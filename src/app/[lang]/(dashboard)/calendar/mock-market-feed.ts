/**
 * Stand-in for the three market feeds the backend will serve.
 *
 * Replaces the old `mock-alerts`, which faked one case — a stock going
 * ex-dividend — under a title the desk wrote by hand ("PTT — ex-dividend").
 * The exchange doesn't publish sentences; it publishes a code against a symbol
 * on a date, with a record behind it, and the Calendar has to read the same way
 * the rest of the product does (see the Company Events grid on a stock). So the
 * same three dividends are still here, now as `XD` rows with the full record
 * sheet Figma drew for that grid.
 *
 * Kept in one file with an obvious name so replacing it is a deletion: nothing
 * outside it knows these records are invented, and `day-items` swaps
 * `marketFeed(month)` for a fetch without any component changing.
 *
 * ## What is anchored and what isn't
 *
 * Corporate actions and events are generated *into whichever month is being
 * looked at*, on fixed days of that month, so paging the calendar always has
 * something to show. Holidays are the opposite: a real holiday is a real date,
 * and sliding Songkran into November to keep a demo busy would be a lie the
 * user could act on. They come from `src/data/market-holidays.json` as-is.
 *
 * Everything is derived from the date passed in — never from `new Date()` —
 * so the server render and the client render agree and React has nothing to
 * warn about.
 *
 * ## Two records here are deliberately "wrong"
 *
 * The feed emits one corporate-action code (`XC`) and one event category
 * (`quarterly-briefing`) that the frontend has never heard of. Both render:
 * that is the whole claim `market-taxonomy` makes, and a claim only tested in
 * theory is one that breaks the first time the backend adds a code. Leave them
 * in.
 *
 * ## Holiday dates worth knowing about
 *
 * Thailand's fixed-date holidays are exactly that and are safe. The Buddhist
 * ones (Makha Bucha, Visakha Bucha, Asalha Bucha, Buddhist Lent) follow the
 * lunar calendar and are announced per year — the dates in the JSON are
 * plausible placeholders, not an authority. Use the real SET holiday
 * announcement when this becomes an endpoint.
 */

import holidayData from "@/data/market-holidays.json";
import { dayKey } from "./calendar-grid";
import type {
  CorporateActionFeedItem,
  MarketCalendarFeed,
  MarketEventFeedItem,
  MarketFact,
  MarketHoliday,
} from "./market-feed";

// ── Corporate actions ───────────────────────────────────────────────────────

/**
 * One row of the table below: everything except the date and the record, both
 * of which the anchor month supplies.
 *
 * `dividend` and `payOn` stand in for the figures an XD's record carries. They
 * are not written out as rows here because every row in a record is a formatted
 * date — "12/09/26" — and the month those dates fall in is only known once the
 * feed is asked for one.
 */
type ActionSeed = Omit<CorporateActionFeedItem, "id" | "date" | "record" | "name"> & {
  on: number;
  /** Dividend per share, for an XD. Its presence is what makes the record a
   *  dividend sheet rather than the short common one. */
  dividend?: string;
  /** Day of the *following* month the dividend is paid on. */
  payOn?: number;
};

/**
 * Issuer names, for the record sheet's header line.
 *
 * A lookup rather than a field on every seed: two symbols in here are two share
 * classes of the same issuer, and a name repeated per row is a name that gets
 * edited in one place and not the other. The real feed will send it per record.
 */
const ISSUER_NAMES: Record<string, string> = {
  ADVANC: "ADVANCED INFO SERVICE PUBLIC COMPANY LIMITED",
  AMKR03: "AMKOR TECHNOLOGY INC. (DR)",
  AMKR23: "AMKOR TECHNOLOGY INC. (DR)",
  AOT: "AIRPORTS OF THAILAND PUBLIC COMPANY LIMITED",
  BBL: "BANGKOK BANK PUBLIC COMPANY LIMITED",
  BDMS: "BANGKOK DUSIT MEDICAL SERVICES PUBLIC COMPANY LIMITED",
  BGRIM: "B.GRIMM POWER PUBLIC COMPANY LIMITED",
  "CPALL-W1": "CP ALL PUBLIC COMPANY LIMITED",
  CTARAF: "CHATRIUM HOTEL PROPERTY FUND",
  DELTA: "DELTA ELECTRONICS (THAILAND) PUBLIC COMPANY LIMITED",
  EA: "ENERGY ABSOLUTE PUBLIC COMPANY LIMITED",
  GULF: "GULF DEVELOPMENT PUBLIC COMPANY LIMITED",
  INTUCH: "INTOUCH HOLDINGS PUBLIC COMPANY LIMITED",
  KBANK: "KASIKORNBANK PUBLIC COMPANY LIMITED",
  LHHOTEL: "LH HOTEL LEASEHOLD REAL ESTATE INVESTMENT TRUST",
  MJLF: "MAJOR CINEPLEX LIFESTYLE LEASEHOLD PROPERTY FUND",
  NETEASE80: "NETEASE INC. (DR)",
  PINGAN01: "PING AN INSURANCE (GROUP) COMPANY OF CHINA (DR)",
  PINGAN80: "PING AN INSURANCE (GROUP) COMPANY OF CHINA (DR)",
  PTT: "PTT PUBLIC COMPANY LIMITED",
  PTTGC: "PTT GLOBAL CHEMICAL PUBLIC COMPANY LIMITED",
  SCB: "SCB X PUBLIC COMPANY LIMITED",
  SCC241A: "THE SIAM CEMENT PUBLIC COMPANY LIMITED",
  SGC: "SG CAPITAL PUBLIC COMPANY LIMITED",
  SINGER: "SINGER THAILAND PUBLIC COMPANY LIMITED",
  TRUE: "TRUE CORPORATION PUBLIC COMPANY LIMITED",
};

const ACTION_SEEDS: ActionSeed[] = [
  { on: 4, kind: "XW", symbol: "TRUE", detail: "Warrant TRUE-W6 goes ex" },
  { on: 8, kind: "XR", symbol: "EA", detail: "Rights offering 1:4 at THB 12.00" },
  { on: 8, kind: "XR", symbol: "BGRIM" },

  {
    on: 10,
    kind: "XD",
    symbol: "PTT",
    detail: "THB 2.50 per share",
    dividend: "2.50", payOn: 5,
    clientIds: ["110001", "110003", "110006"],
  },
  {
    on: 10,
    kind: "XD",
    symbol: "SCB",
    detail: "THB 3.00 per share",
    dividend: "3.00", payOn: 8,
    clientIds: ["110001", "110004"],
  },
  { on: 10, kind: "XD", symbol: "KBANK", dividend: "1.75", payOn: 8 },

  // The day the grouped day-panel card was designed against: six XDs, two XMs
  // and one XN, all on one date. A day like this is the reason corporate
  // actions are drawn grouped by kind instead of one row per symbol.
  { on: 12, kind: "XD", symbol: "AMKR03", dividend: "0.45", payOn: 3 },
  { on: 12, kind: "XD", symbol: "AMKR23", dividend: "0.45", payOn: 3 },
  { on: 12, kind: "XD", symbol: "MJLF", dividend: "0.18", payOn: 6 },
  {
    on: 12,
    kind: "XD",
    symbol: "NETEASE80",
    dividend: "0.92", payOn: 6,
    clientIds: ["110002"],
  },
  { on: 12, kind: "XD", symbol: "PINGAN01", dividend: "1.10", payOn: 6 },
  { on: 12, kind: "XD", symbol: "PINGAN80", dividend: "1.10", payOn: 6 },
  { on: 12, kind: "XM", symbol: "SGC", detail: "AGM, 10:00 · registration closes 09:30" },
  { on: 12, kind: "XM", symbol: "SINGER", detail: "EGM 1/2026" },
  { on: 12, kind: "XN", symbol: "CTARAF", detail: "Capital return THB 0.35 per unit" },

  { on: 16, kind: "XT", symbol: "BBL", detail: "Transferable subscription right" },
  { on: 16, kind: "XI", symbol: "SCC241A", detail: "Coupon 3.25% · semi-annual" },

  { on: 18, kind: "XM", symbol: "AOT", detail: "AGM, 14:00" },

  {
    on: 20,
    kind: "XD",
    symbol: "ADVANC",
    detail: "THB 4.75 per share",
    dividend: "4.75", payOn: 12,
    clientIds: ["110002", "110005"],
  },
  { on: 20, kind: "XD", symbol: "INTUCH", dividend: "2.20", payOn: 12 },
  { on: 20, kind: "XE", symbol: "CPALL-W1", detail: "Exercise window opens" },

  { on: 25, kind: "XA", symbol: "DELTA", detail: "All benefits excluded" },

  { on: 26, kind: "XD", symbol: "GULF", dividend: "0.60", payOn: 18 },
  {
    on: 26,
    kind: "XD",
    symbol: "BDMS",
    dividend: "0.55", payOn: 18,
    clientIds: ["110007"],
  },

  // Not one of the eleven codes `market-taxonomy` names — on purpose. See the
  // file header: the resolver's fallback should be exercised by the mock, not
  // just asserted in a comment.
  { on: 27, kind: "XC", symbol: "PTTGC", detail: "Conversion event" },

  { on: 29, kind: "XN", symbol: "LHHOTEL", detail: "Capital return THB 0.22 per unit" },
];

// ── Market events ───────────────────────────────────────────────────────────

type EventSeed = Omit<MarketEventFeedItem, "id" | "date"> & { on: number };

const EVENT_SEEDS: EventSeed[] = [
  {
    on: 3,
    category: "seminar",
    title: "SET Outlook 2027 — Bangkok",
    detail: "13:30–16:30 · Grand Hyatt Erawan, Ballroom 2",
    facts: [
      { label: "Speaker", value: "Head of Research, Yuanta Securities" },
      { label: "Seats held", value: "12 of 40" },
    ],
    clientIds: ["110001", "110002", "110005"],
  },
  {
    on: 9,
    category: "promotion",
    title: "Fee waiver — new Global Bond accounts",
    detail: "Front-end fee waived on first THB 5M",
    facts: [{ label: "Runs until", value: "end of next month" }],
    clientIds: ["110003", "110006", "110008"],
  },
  {
    on: 17,
    category: "seminar",
    title: "Private Wealth Forum — Q4 allocation",
    detail: "09:00–12:00 · Yuanta Tower, 14th floor",
    clientIds: ["110004", "110007"],
  },
  {
    on: 22,
    category: "deadline",
    title: "Yuanta Global Equity Fund — IPO closes",
    detail: "Subscriptions close 15:30",
    clientIds: ["110001", "110008"],
  },
  {
    on: 24,
    category: "promotion",
    title: "Structured note campaign — KIKO series",
    detail: "Indicative coupon 8.5% p.a. · book by month end",
    clientIds: ["110002", "110005", "110007"],
  },
  // Again deliberately unknown — the category resolver has to name and colour
  // a slug it has never seen.
  {
    on: 28,
    category: "quarterly-briefing",
    title: "Desk briefing — Q4 house view",
    detail: "Internal · 08:30, dealing room",
  },
];

// ── Assembly ────────────────────────────────────────────────────────────────

/** Last day of `month`'s own month, so a seed on the 29th survives February. */
function clampDay(month: Date, dayOfMonth: number): number {
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Math.min(dayOfMonth, lastDay);
}

function isoDay(year: number, monthIndex: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

/**
 * Everything the market feeds have for the month `anchorMonth` falls in.
 *
 * Ids fold the month in, so paging from September to October gives the October
 * copy of a recurring seed a key of its own — two rows sharing an id would
 * collide the moment both months are on screen at once, which the Dashboard's
 * two-month queue does routinely.
 */
export function marketFeed(anchorMonth: Date): MarketCalendarFeed {
  const year = anchorMonth.getFullYear();
  const monthIndex = anchorMonth.getMonth();
  const stamp = `${year}${String(monthIndex + 1).padStart(2, "0")}`;

  /** "12/09/26" — the format the record sheet already prints. */
  const shortDate = (monthOffset: number, day: number) => {
    const d = new Date(year, monthIndex + monthOffset, day);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
  };

  /**
   * The record a corporate action opens into, grouped as the sheet rules it.
   *
   * Two shapes, and the split is the one the Company Events tab on a stock
   * already made: an XD gets the full dividend sheet Figma drew (node
   * 24635:107155), every other code gets the dates alone. Inventing a dividend
   * yield for an XW would be worse than leaving it out — those columns are
   * dividend facts, and a code that isn't a dividend has no answer for them.
   *
   * "-" is the design's own empty marker, not a missing value here: the
   * exchange genuinely publishes several of these blank until after the day.
   */
  const recordFor = (xDay: number, dividend?: string, payOn?: number): MarketFact[][] => {
    const announce = shortDate(-1, Math.min(xDay, 28));
    const dates: MarketFact[][] = [
      [
        { label: "X-Date", value: shortDate(0, xDay) },
        { label: "Announce Date", value: announce },
      ],
    ];
    const closing: MarketFact[] = [
      { label: "Board Date", value: announce },
      { label: "Record Date", value: shortDate(0, xDay + 1) },
      { label: "Book Closing Date", value: "-" },
    ];

    if (!dividend) return [...dates, closing];

    return [
      ...dates,
      [
        { label: "Dividend (per Share)", value: `${dividend} THB` },
        { label: "Adjusted DPS", value: `${dividend} THB` },
      ],
      [
        { label: "Operation Period", value: "-" },
        { label: "Source of Dividend", value: "RE" },
      ],
      [
        { label: "Payment Date", value: shortDate(1, payOn ?? 15) },
        { label: "Price before X-Date", value: "-" },
        { label: "Price on X-Date", value: "-" },
      ],
      [
        { label: "Dividend Yield", value: "-" },
        { label: "Par", value: "1.00" },
      ],
      closing,
    ];
  };

  return {
    corporateActions: ACTION_SEEDS.map(({ on, dividend, payOn, ...seed }) => {
      const xDay = clampDay(anchorMonth, on);
      return {
        ...seed,
        id: `ca:${stamp}:${seed.kind}:${seed.symbol}`,
        date: isoDay(year, monthIndex, xDay),
        name: ISSUER_NAMES[seed.symbol] ?? seed.symbol,
        record: recordFor(xDay, dividend, payOn),
      };
    }),
    events: EVENT_SEEDS.map(({ on, ...seed }, index) => ({
      ...seed,
      id: `ev:${stamp}:${index}`,
      date: isoDay(year, monthIndex, clampDay(anchorMonth, on)),
    })),
  };
}

// ── Holidays ────────────────────────────────────────────────────────────────

type HolidaySeed = { month: number; day: number; name: string; market: string };

const HOLIDAY_DATA = holidayData as {
  recurring: HolidaySeed[];
  byYear: Record<string, HolidaySeed[]>;
};

/**
 * A weekend holiday closes the market on the next working day instead, so the
 * substitute is generated rather than listed — it is derived from the year, and
 * a hand-maintained list of them is a list that goes stale silently.
 *
 * Walks forward past any day already taken, which is what makes a Saturday
 * Songkran push its substitute to the Wednesday rather than landing on the
 * Monday its neighbour already owns.
 */
function substituteFor(day: Date, taken: Set<string>): Date | null {
  if (day.getDay() !== 0 && day.getDay() !== 6) return null;
  const next = new Date(day);
  do {
    next.setDate(next.getDate() + 1);
  } while (next.getDay() === 0 || next.getDay() === 6 || taken.has(dayKey(next)));
  return next;
}

function holidaysForYear(year: number): MarketHoliday[] {
  const seeds = [...HOLIDAY_DATA.recurring, ...(HOLIDAY_DATA.byYear[String(year)] ?? [])];
  const days = seeds
    .map((seed) => ({ seed, date: new Date(year, seed.month - 1, seed.day) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const taken = new Set(days.map(({ date }) => dayKey(date)));
  const out: MarketHoliday[] = [];

  for (const { seed, date } of days) {
    out.push({
      id: `hol:${isoDay(year, seed.month - 1, seed.day)}:${seed.market}`,
      date: isoDay(year, seed.month - 1, seed.day),
      name: seed.name,
      market: seed.market,
    });
    const substitute = substituteFor(date, taken);
    if (!substitute) continue;
    taken.add(dayKey(substitute));
    out.push({
      id: `hol:${isoDay(substitute.getFullYear(), substitute.getMonth(), substitute.getDate())}:sub`,
      date: isoDay(substitute.getFullYear(), substitute.getMonth(), substitute.getDate()),
      name: `${seed.name} (substitution day)`,
      market: seed.market,
      substitute: true,
    });
  }
  return out;
}

/**
 * Holidays keyed by `calendar-grid`'s `dayKey`, for the year `viewDate` is in
 * and the two either side of it.
 *
 * Three years rather than one because a month grid is six weeks wide: opening
 * on January shows the tail of December, and a New Year's Eve that vanished
 * when you paged onto it would be the one holiday nobody believes.
 */
export function holidaysByDay(viewDate: Date): Map<string, MarketHoliday> {
  const year = viewDate.getFullYear();
  const map = new Map<string, MarketHoliday>();
  for (const offset of [-1, 0, 1]) {
    for (const holiday of holidaysForYear(year + offset)) {
      const [y, m, d] = holiday.date.split("-").map(Number);
      // First writer wins: a SET closure and a bank closure on the same day are
      // one shut day to a reader, and the exchange's is the one that matters on
      // a trading calendar.
      const key = dayKey(new Date(y, m - 1, d));
      if (!map.has(key)) map.set(key, holiday);
    }
  }
  return map;
}
