import {
  pgTable,
  serial,
  text,
  timestamp,
  jsonb,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const rawEvents = pgTable(
  "raw_events",
  {
    id: serial("id").primaryKey(),
    source: text("source").notNull(),
    sourceId: text("source_id").notNull(),
    sourceUrl: text("source_url"),
    payload: jsonb("payload").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
    parsedAt: timestamp("parsed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("raw_events_source_unique").on(t.source, t.sourceId)]
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    artists: text("artists").array().notNull().default([]),
    venue: text("venue"),
    city: text("city").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    genres: text("genres").array().notNull().default([]),
    priceMinPence: integer("price_min_pence"),
    priceMaxPence: integer("price_max_pence"),
    sourceUrls: jsonb("source_urls").$type<Record<string, string>>().notNull().default({}),
    canonicalHash: text("canonical_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("events_canonical_hash_unique").on(t.canonicalHash),
    index("events_start_at_idx").on(t.startAt),
    index("events_city_idx").on(t.city),
  ]
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type RawEvent = typeof rawEvents.$inferSelect;
