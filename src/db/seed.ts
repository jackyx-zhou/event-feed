import "dotenv/config";
import { createHash } from "node:crypto";
import { addDays, setHours, setMinutes, startOfDay } from "date-fns";
import { db } from "./index";
import { events, type NewEvent } from "./schema";

function hash(parts: string[]): string {
  return createHash("sha256")
    .update(parts.join("|").toLowerCase())
    .digest("hex")
    .slice(0, 16);
}

function at(daysFromNow: number, hour: number, minute = 0): Date {
  return setMinutes(setHours(startOfDay(addDays(new Date(), daysFromNow)), hour), minute);
}

function makeEvent(args: {
  title: string;
  artists: string[];
  venue: string;
  startAt: Date;
  genres: string[];
  priceMin?: number;
  priceMax?: number;
  sources: Record<string, string>;
}): NewEvent {
  return {
    title: args.title,
    artists: args.artists,
    venue: args.venue,
    city: "London",
    startAt: args.startAt,
    genres: args.genres,
    priceMinPence: args.priceMin ? args.priceMin * 100 : null,
    priceMaxPence: args.priceMax ? args.priceMax * 100 : null,
    sourceUrls: args.sources,
    canonicalHash: hash([args.artists.join(","), args.venue, args.startAt.toISOString().slice(0, 10)]),
  };
}

const SEED: NewEvent[] = [
  makeEvent({
    title: "Bicep Live",
    artists: ["Bicep"],
    venue: "Printworks",
    startAt: at(3, 22),
    genres: ["electronic", "techno"],
    priceMin: 35,
    priceMax: 45,
    sources: { dice: "https://dice.fm/event/example-bicep", ra: "https://ra.co/events/example" },
  }),
  makeEvent({
    title: "Sub Focus & Wilkinson",
    artists: ["Sub Focus", "Wilkinson"],
    venue: "Alexandra Palace",
    startAt: at(7, 21),
    genres: ["drum and bass"],
    priceMin: 40,
    sources: { ticketmaster: "https://ticketmaster.co.uk/example", dice: "https://dice.fm/event/example-sf" },
  }),
  makeEvent({
    title: "Andy C: All Night Long",
    artists: ["Andy C"],
    venue: "Drumsheds",
    startAt: at(10, 23),
    genres: ["drum and bass"],
    priceMin: 30,
    sources: { dice: "https://dice.fm/event/example-andyc" },
  }),
  makeEvent({
    title: "Chase & Status: RTRN II Jungle",
    artists: ["Chase & Status"],
    venue: "O2 Academy Brixton",
    startAt: at(14, 19),
    genres: ["drum and bass", "jungle"],
    priceMin: 38,
    priceMax: 55,
    sources: { ticketmaster: "https://ticketmaster.co.uk/example-cs" },
  }),
  makeEvent({
    title: "Four Tet",
    artists: ["Four Tet"],
    venue: "EartH",
    startAt: at(5, 20),
    genres: ["electronic"],
    priceMin: 32,
    sources: { dice: "https://dice.fm/event/example-ft" },
  }),
  makeEvent({
    title: "Fred again..",
    artists: ["Fred again.."],
    venue: "Wembley Arena",
    startAt: at(21, 20),
    genres: ["electronic", "house"],
    priceMin: 45,
    priceMax: 75,
    sources: { axs: "https://axs.com/example-fred", ticketmaster: "https://ticketmaster.co.uk/example-fred" },
  }),
  makeEvent({
    title: "Skrillex",
    artists: ["Skrillex"],
    venue: "Drumsheds",
    startAt: at(28, 22),
    genres: ["dubstep", "electronic"],
    priceMin: 50,
    sources: { dice: "https://dice.fm/event/example-skrillex" },
  }),
  makeEvent({
    title: "Peggy Gou",
    artists: ["Peggy Gou"],
    venue: "Magazine London",
    startAt: at(11, 22),
    genres: ["house", "techno"],
    priceMin: 40,
    sources: { ra: "https://ra.co/events/example-pg", dice: "https://dice.fm/event/example-pg" },
  }),
  makeEvent({
    title: "Bonobo",
    artists: ["Bonobo"],
    venue: "Roundhouse",
    startAt: at(17, 19, 30),
    genres: ["electronic", "downtempo"],
    priceMin: 38,
    sources: { ticketmaster: "https://ticketmaster.co.uk/example-bonobo" },
  }),
  makeEvent({
    title: "Overmono",
    artists: ["Overmono"],
    venue: "Troxy",
    startAt: at(4, 21),
    genres: ["electronic", "breakbeat"],
    priceMin: 35,
    sources: { dice: "https://dice.fm/event/example-overmono" },
  }),
  makeEvent({
    title: "Rudimental",
    artists: ["Rudimental"],
    venue: "O2 Academy Brixton",
    startAt: at(23, 19),
    genres: ["drum and bass"],
    priceMin: 36,
    sources: { ticketmaster: "https://ticketmaster.co.uk/example-rud" },
  }),
  makeEvent({
    title: "Hospitality presents",
    artists: ["High Contrast", "Etherwood", "Whiney"],
    venue: "Printworks",
    startAt: at(9, 22),
    genres: ["drum and bass"],
    priceMin: 32,
    sources: { dice: "https://dice.fm/event/example-hosp" },
  }),
  makeEvent({
    title: "Floating Points",
    artists: ["Floating Points"],
    venue: "Village Underground",
    startAt: at(6, 21),
    genres: ["electronic"],
    priceMin: 30,
    sources: { ra: "https://ra.co/events/example-fp" },
  }),
  makeEvent({
    title: "Disclosure",
    artists: ["Disclosure"],
    venue: "Alexandra Palace",
    startAt: at(35, 20),
    genres: ["house"],
    priceMin: 42,
    sources: { ticketmaster: "https://ticketmaster.co.uk/example-disc", axs: "https://axs.com/example-disc" },
  }),
  makeEvent({
    title: "Loyle Carner",
    artists: ["Loyle Carner"],
    venue: "EartH",
    startAt: at(12, 19),
    genres: ["hip hop"],
    priceMin: 28,
    sources: { dice: "https://dice.fm/event/example-lc" },
  }),
  makeEvent({
    title: "Romy",
    artists: ["Romy"],
    venue: "Heaven",
    startAt: at(2, 22),
    genres: ["electronic", "pop"],
    priceMin: 25,
    sources: { dice: "https://dice.fm/event/example-romy" },
  }),
  makeEvent({
    title: "Gentlemen's Club",
    artists: ["Gentlemen's Club"],
    venue: "XOYO",
    startAt: at(8, 23),
    genres: ["dubstep"],
    priceMin: 18,
    sources: { dice: "https://dice.fm/event/example-gc" },
  }),
  makeEvent({
    title: "Caribou (DJ set)",
    artists: ["Caribou"],
    venue: "Phonox",
    startAt: at(15, 23),
    genres: ["electronic"],
    priceMin: 20,
    sources: { ra: "https://ra.co/events/example-caribou" },
  }),
  makeEvent({
    title: "Anyma",
    artists: ["Anyma"],
    venue: "Drumsheds",
    startAt: at(40, 22),
    genres: ["techno", "melodic techno"],
    priceMin: 55,
    sources: { ticketmaster: "https://ticketmaster.co.uk/example-anyma" },
  }),
  makeEvent({
    title: "Joy Orbison",
    artists: ["Joy Orbison"],
    venue: "Village Underground",
    startAt: at(19, 22),
    genres: ["electronic", "house"],
    priceMin: 22,
    sources: { ra: "https://ra.co/events/example-joy" },
  }),
];

async function main() {
  console.log(`Seeding ${SEED.length} events…`);
  await db.delete(events);
  await db.insert(events).values(SEED);
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
