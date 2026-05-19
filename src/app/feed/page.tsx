import Link from "next/link";
import { asc, gte } from "drizzle-orm";
import { format } from "date-fns";
import { db } from "@/db";
import { events } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const upcoming = await db
    .select()
    .from(events)
    .where(gte(events.startAt, new Date()))
    .orderBy(asc(events.startAt))
    .limit(50);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-3xl font-bold">Upcoming in London</h1>
      <p className="mb-6 text-sm text-zinc-400">{upcoming.length} events</p>
      <ul className="space-y-3">
        {upcoming.map((e) => (
          <li
            key={e.id}
            className="rounded-lg border border-zinc-800 p-4 transition hover:border-zinc-600 hover:bg-zinc-900/40"
          >
            <Link href={`/event/${e.id}`} className="block">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                {format(e.startAt, "EEE d MMM · HH:mm")}
              </div>
              <div className="mt-1 text-lg font-semibold">{e.title}</div>
              <div className="text-sm text-zinc-300">
                {e.venue}
                {e.genres.length > 0 && <span className="text-zinc-500"> · {e.genres.join(", ")}</span>}
              </div>
              <div className="mt-2 flex gap-2">
                {Object.keys(e.sourceUrls).map((src) => (
                  <span
                    key={src}
                    className="rounded bg-zinc-800 px-2 py-0.5 text-xs uppercase tracking-wide text-zinc-300"
                  >
                    {src}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
