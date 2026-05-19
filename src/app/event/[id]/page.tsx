import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/db";
import { events } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const [event] = await db.select().from(events).where(eq(events.id, numericId)).limit(1);
  if (!event) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">{event.title}</h1>
      <div className="mt-2 text-zinc-400">{format(event.startAt, "EEEE d MMMM yyyy · HH:mm")}</div>
      <div className="mt-1 text-zinc-300">
        {event.venue}, {event.city}
      </div>

      {event.genres.length > 0 && (
        <div className="mt-2 text-sm text-zinc-400">{event.genres.join(", ")}</div>
      )}

      {event.artists.length > 0 && (
        <section className="mt-6">
          <div className="text-sm uppercase tracking-wide text-zinc-500">Line-up</div>
          <div className="mt-1">{event.artists.join(", ")}</div>
        </section>
      )}

      <section className="mt-6">
        <div className="text-sm uppercase tracking-wide text-zinc-500">Tickets</div>
        <ul className="mt-2 space-y-1">
          {Object.entries(event.sourceUrls).map(([source, url]) => (
            <li key={source}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-100 underline decoration-zinc-600 underline-offset-4 hover:decoration-zinc-200"
              >
                {source}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
