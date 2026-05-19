# Project context for Claude

## Owner background
5+ years JVM backend experience, rusty on JS/Node — last touched frontend at uni. When you do something non-trivial (run a command, install a package, write a non-obvious piece of code), briefly explain what you're doing and why. The owner asked for "walk me through what you do" mode; honour that without writing tutorial-style glossaries in code or docs.

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind 4
- Postgres (Neon) + Drizzle ORM
- Inngest for cron + background jobs
- pnpm package manager
- Target deploy: Vercel

## Conventions
- All DB access through `src/db/index.ts` — don't construct a postgres client elsewhere.
- Server components by default; only add `"use client"` when interactivity demands it.
- Use Zod schemas at external boundaries: API routes, scraper output, LLM responses.
- Source integrations live under `src/lib/sources/` — one file per source (ticketmaster, skiddle, dice, ra, axs).
- Inngest functions live under `src/inngest/`.

## Project plan
The full project plan is at `~/.claude/plans/alright-i-am-thinking-dreamy-quokka.md` (in the home dir, NOT this repo). Summary: aggregator feed for London gigs from multiple sources, then LLM-powered natural-language search, then personalised ranking. MVP is London-only, no auth, no bought-ticket import.

@AGENTS.md
