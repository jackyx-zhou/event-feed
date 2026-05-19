# Event Discovery Feed — Side Project Plan

## Context
A greenfield side project with dual purpose: (1) a portfolio piece for job applications, and (2) something you'd actually use. The product is a **personalised event discovery feed** that aggregates gigs/club nights from multiple sources (Dice, Resident Advisor, Skiddle, Ticketmaster, AXS) into one ranked feed. Phase 2 layers an LLM-powered natural-language search on top ("show me all the drum & bass nights in London this weekend") that translates plain English into structured filters over the aggregated data.

**Scope discipline:** the MVP is **London-only, scrape-only, no auth, no bought-ticket import**. That keeps the build small enough to actually ship while still covering the interesting engineering: scraping pipeline, normalisation, dedup, ranking, and (Phase 2) LLM-as-query-parser.

The portfolio story is: *heterogeneous ingestion → unified schema → personalised ranking → natural-language interface*. Each phase is independently demoable.

## Realism check
- **APIs:** Ticketmaster Discovery API (free, ~5k req/day), Skiddle (free public API). Use these first — they're free wins.
- **Scraping:** Dice, Resident Advisor, AXS have no public APIs and disallow scraping in their ToS. For a personal/portfolio project this is generally tolerated if you rate-limit aggressively, cache, and don't redistribute commercially. Be ready to talk through this trade-off in interviews — owning the nuance is itself a signal.
- **LLM cost:** With **Groq** (free tier, hosts Llama 3.1 8B/70B) or **Cloudflare Workers AI** (generous free tier, hosts Llama/Mistral), NL-query parsing is effectively free at portfolio scale. Falls back to Anthropic Haiku if you want a paid-but-cheap option.
- **Timeline:** Phase 1 MVP ~3–4 weekends. Phase 2 (LLM search) ~1 weekend on top. Phase 3 (personalisation) ~2 weekends.

## Recommended stack
Single-stack to keep MVP fast. Add a Python service later only if you need it.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui** | Recruiters know it; SSR for shareable event pages; fast iteration. |
| Scraping | **Playwright (Node)** inside Next.js, run from cron jobs | Stays in one language. Playwright handles JS-heavy sites (RA, AXS). |
| DB | **Postgres (Neon free tier)** + **Drizzle ORM** | Drizzle is lightweight, great TS DX. Neon has branch DBs (good demo talking point). |
| Search/filter | Postgres + **`pg_trgm`** for fuzzy artist/venue match | No Elastic needed at this scale. |
| Jobs | **Inngest** (free tier) | Cron + retries + observability dashboard. Tiny config. |
| LLM (Phase 2) | **Groq** (Llama 3.1 8B) with **structured output** (Zod schema) | Free, fast, returns JSON matching your filter schema. |
| Deploy | **Vercel** | Free tier covers everything. Inngest cloud runs the jobs. |
| Observability | **Sentry** (free) + Inngest dashboard | Cheap, talkable. |

## Architecture
```
┌────────────────────────────────────────────────┐
│              Next.js on Vercel                 │
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ /feed    │  │ /search  │  │ /api/ingest  │  │
│  │ (UI)     │  │ (NL UI)  │  │  (Inngest)   │  │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
└───────┼─────────────┼───────────────┼──────────┘
        │             │               │
        │             │ Groq API      │ cron
        │             ▼               ▼
        │       ┌─────────┐    ┌─────────────────┐
        │       │ LLM     │    │ Inngest jobs    │
        │       │ NL→JSON │    │ - scrape Dice   │
        │       │ filters │    │ - scrape RA     │
        │       └────┬────┘    │ - pull TM API   │
        │            │         │ - pull Skiddle  │
        │            ▼         │ - normalise     │
        │      ┌──────────────┘ - dedup         │
        ▼      ▼                └──────┬─────────┘
   ┌────────────────────────────────────▼────────┐
   │            Postgres (Neon)                  │
   │  raw_events  →  events  ←  artists/venues   │
   └─────────────────────────────────────────────┘
```

## Data model (sketch)
- `raw_events` — id, source, fetched_at, source_url, payload (JSONB), parsed_at
- `events` — id, title, artists (text[]), venue, city, start_at, end_at, genres (text[]), price_min, price_max, source_urls (JSONB: source→url), canonical_hash, lineup_score
- `venues` — id, name, city, lat, lng, slug (for fuzzy match)
- `artists` — id, name, slug, genres (text[])
- `event_artists` — event_id, artist_id (join)
- `user_preferences` (Phase 3) — anonymous_id (cookie), liked_artist_ids, liked_genres, liked_venue_ids

No users table for MVP — feed is anonymous, personalisation is cookie-keyed.

## Phased build

**Phase 0 — scaffolding (1 weekend)**
- Next.js + Drizzle + Neon set up, deployed to Vercel.
- Inngest connected, one no-op cron firing in prod.
- `events` and `raw_events` tables; seed script with 20 hand-curated events to drive UI dev before any scraper works.

**Phase 1 — aggregator MVP, London only (2–3 weekends)**
1. **Ticketmaster** API client + 6-hourly poll for London. (Easiest win, no scraping.)
2. **Skiddle** API client + 6-hourly poll for London.
3. **Dice scraper** with Playwright (cleanest HTML of the three scrape targets — start here).
4. **Normaliser** job: raw → canonical, fuzzy-match venues, extract artists.
5. **Dedup**: same artist + same venue + same date → merge, keep all `source_urls`.
6. **Feed UI**: `/feed` shows upcoming London events, default sort by date, filters for genre/venue/date-range/price.
7. Event detail page with all source links ("buy on Dice / Ticketmaster").

**Phase 2 — natural-language search (1 weekend)**
- `/search` page with a single text input.
- Server action: send query + filter schema (Zod) to Groq → get back structured filters → run Drizzle query → render results.
- Schema covers: `genres[]`, `artists[]`, `venues[]`, `city`, `date_from`, `date_to`, `price_max`, `free_text`.
- Show the parsed filters above results ("I understood: drum & bass, London, this weekend") so users can correct misparses — also makes a great demo screenshot.
- Cache identical NL queries in Postgres for 1 hour (cost + latency).

**Phase 3 — personalised feed (2 weekends)**
- Anonymous cookie-based identity (no auth).
- Implicit signals: clicks, dwell time, "not interested" button.
- Explicit signals: "follow artist", "follow venue", "follow genre" buttons.
- Ranking: simple weighted score = `artist_match * 3 + genre_match * 2 + venue_match * 2 + recency_decay`. No ML needed; this is enough to talk through trade-offs.
- A/B-able: `/feed` (default chronological) vs `/feed?ranked=1` (personalised).

**Phase 4 — optional polish**
- Add Resident Advisor scraper (harder — heavy JS, careful pacing).
- ICS export / "add to calendar" per event.
- Weekly digest email (Resend) for users who opt in (this is when you finally add auth).
- Expand beyond London.

## LLM query-parser sketch (Phase 2)
```ts
const FilterSchema = z.object({
  genres: z.array(z.string()).optional(),
  artists: z.array(z.string()).optional(),
  venues: z.array(z.string()).optional(),
  city: z.string().optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  price_max: z.number().optional(),
  free_text: z.string().optional(),
});

// System prompt gives Groq the schema + known genres/venues list + today's date.
// Returns JSON; validate with Zod; if validation fails, fall back to free-text search.
```
Talking points for interviews: structured output, schema-as-contract, graceful fallback, prompt-caching the system prompt, query caching layer.

## What to highlight on your CV / in interviews
- **Heterogeneous ingestion**: 2 APIs + 1+ scrapers feeding a unified schema.
- **Idempotent retryable jobs** with observability (Inngest dashboard).
- **Fuzzy cross-source dedup** — show concrete before/after numbers ("3,200 raw events → 1,150 canonical").
- **LLM as a structured-output interface**, not a chatbot — a maturer use of LLMs than RAG-everything.
- **Honest discussion** of scraping ToS, rate limits, fragility monitoring.
- **Live deployed demo** with seed data so reviewers don't need to do anything to evaluate it.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Scrapers break silently | Per-source health check job: if 0 new events in 48h, alert via Sentry. |
| Dice/RA block your IP | Aggressive rate limits (1 req per few seconds), cache aggressively, respect any `Retry-After`. Don't be greedy. |
| LLM misparses queries | Always show parsed filters above results; provide manual filter UI as fallback. |
| Vercel function timeouts on scrape | Run scrapers in Inngest (long-running), not Vercel request handlers. |
| Scope creep | Hold the phasing above. Ship Phase 1 publicly before starting Phase 2. |

## Critical files to create (Phase 0–2)
- `drizzle/schema.ts` — tables above
- `drizzle/migrations/` — generated migrations
- `src/app/feed/page.tsx` — main feed UI
- `src/app/search/page.tsx` — NL search UI (Phase 2)
- `src/app/event/[id]/page.tsx` — event detail
- `src/lib/sources/ticketmaster.ts`
- `src/lib/sources/skiddle.ts`
- `src/lib/sources/dice.ts` — Playwright scraper
- `src/lib/normalise/index.ts` — raw → canonical
- `src/lib/normalise/dedup.ts` — fuzzy matcher
- `src/lib/llm/parse-query.ts` — Groq client + Zod schema (Phase 2)
- `src/inngest/functions.ts` — cron jobs (scrape, normalise, dedup)
- `src/inngest/client.ts`

## Verification
- **Local:** `pnpm dev` + local Postgres (or Neon branch). Seed script loads sample raw events from each source; assert normaliser produces N canonical events with expected dedup count.
- **Scraper tests:** save HTML fixtures from real pages, run Playwright parser against the fixture (not the live site) in CI. Live-site smoke test runs nightly in prod, not in CI.
- **LLM tests (Phase 2):** golden-set of ~20 example NL queries with expected parsed-filter JSON; run against Groq in CI (it's free and fast).
- **End-to-end:** load `/feed` in deployed app, confirm events appear with multiple source badges where deduped; on `/search`, query "techno in shoreditch next friday" and confirm sensible results + correctly parsed filters shown.
- **Demo readiness:** seed data baked into a Neon branch so the deployed `/feed` is never empty even if all scrapers break.
