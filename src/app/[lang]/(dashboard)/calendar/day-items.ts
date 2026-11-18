import type { Note } from "@/types/domain";
import { dayKey } from "./calendar-grid";
import { actionKindRank } from "./market-taxonomy";
import { marketFeed } from "./mock-market-feed";
import type { MarketFact } from "./market-feed";

/**
 * What put a row on a day.
 *
 * The Calendar started out showing one thing — reminders the user wrote on their
 * own notes — and its components took `Note[]` straight through. That stops
 * working the moment anything else lands on a date, which is what the
 * rule-based alerts raised by the backend will be. So a day holds `DayItem`s:
 * whatever they came from, they are the same shape by the time a cell or a sheet
 * sees them, and adding a source is a matter of writing one more adapter into
 * this file rather than teaching the UI a second data shape.
 *
 * Three sources, and the list is meant to stay short:
 *
 * - `note` — the user's own handwriting, the only editable one.
 * - `corporate-action` — an exchange fact against a symbol (XD, XW, XT, …).
 *   This replaced the old `dividend` source, which was the same thing said in
 *   prose; see `mock-market-feed`.
 * - `event` — a seminar, a campaign, anything dated the desk puts up itself.
 *
 * A **holiday is not here**, deliberately. It has no holders, nothing to open
 * and nothing to act on, and a row for it would queue behind the user's
 * reminders on every surface that lists them — the Dashboard's queue, a
 * client's Reminders tab, the header bell. It is a property of the day, so it
 * is fetched as one: `holidaysByDay` in `mock-market-feed`, read by the
 * Calendar alone.
 */
export type DayItemSource = "note" | "corporate-action" | "event";

export type DayItem = {
  /** Unique across sources — the React key for a row and a pill. */
  id: string;
  source: DayItemSource;
  title: string;
  /** The row's second line. Empty is allowed; the row falls back to a placeholder. */
  detail: string;
  /** Resolved to avatars by the caller, which is the one holding the client list. */
  clientIds: string[];
  /** Settled and no longer asking for anything. Only a note can be. */
  done: boolean;
  /**
   * The note this row opens, or `null` for an item with nothing behind it yet.
   *
   * A `null` here is what makes a row inert rather than a button — an alert that
   * looked clickable and did nothing would be a worse lie than one that plainly
   * isn't.
   */
  noteId: string | null;
  /**
   * The taxonomy code inside the source: a corporate action's SET kind ("XD"),
   * a market event's category ("seminar"). `""` for a note, which has none.
   *
   * A plain string on purpose — the frontend does not own either list. See
   * `market-taxonomy`, which resolves a colour and a label for anything.
   */
  kind: string;
  /** The security a corporate action lands on. `""` for everything else. */
  symbol: string;
  /** The issuer's legal name, for the record sheet's header. `""` unless the
   *  row is a corporate action whose feed carried one. */
  symbolName: string;
  /**
   * Labelled rows the detail surface prints — an X-date, a DPS, a seat count —
   * grouped the way they should be ruled off. Empty for a note, whose body is
   * the detail.
   *
   * Grouped even when there is only one group, so the two surfaces that draw
   * these (the corporate-action record sheet and the event panel) take one
   * shape rather than each flattening or nesting on its own.
   */
  facts: MarketFact[][];
};

/** Deadlines someone else set lead; the user's own handwriting follows. Inside
 *  a day this is the only thing separating a dividend from a reminder, so it is
 *  one table rather than a chain of `===` in the comparator. */
const SOURCE_RANK: Record<DayItemSource, number> = {
  "corporate-action": 0,
  event: 1,
  note: 2,
};

function fromNote(note: Note): DayItem {
  return {
    id: `note:${note.id}`,
    source: "note",
    title: note.title || "Untitled note",
    detail: note.body,
    clientIds: note.clientIds,
    done: note.reminderDone,
    noteId: note.id,
    kind: "",
    symbol: "",
    symbolName: "",
    facts: [],
  };
}

/** `YYYY-MM-DD` as a local calendar day. `new Date(iso)` would read it as UTC
 *  midnight and land the whole feed on the previous day for anyone east of
 *  Greenwich — which is everyone reading this product. */
function dayFromIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Everything that falls on a day, keyed by that day.
 *
 * Notes with no reminder are dropped — an undated note isn't on the calendar at
 * all.
 *
 * @param anchorMonth the month the market feeds are asked for. Passed in rather
 * than read from the clock so the whole view agrees on which month it is
 * showing, and so paging the Calendar re-anchors the feed to the month on
 * screen; see `mock-market-feed`.
 * @param clientId narrows every source to the rows that name this client — what
 * a client's own Reminders tab asks for. Applied here rather than by the caller
 * because an action's holder list is the feed's business, not the UI's, and
 * filtering it afterwards would mean every caller learning the shape of a
 * source it otherwise never touches.
 */
export function groupDayItems(
  notes: Note[],
  anchorMonth: Date,
  clientId?: string,
): Map<string, DayItem[]> {
  const map = new Map<string, DayItem[]>();

  const push = (when: Date, item: DayItem) => {
    const key = dayKey(when);
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  };

  for (const note of notes) {
    if (!note.reminderAt) continue;
    if (clientId && !note.clientIds.includes(clientId)) continue;
    push(new Date(note.reminderAt), fromNote(note));
  }

  const feed = marketFeed(anchorMonth);

  for (const action of feed.corporateActions) {
    const clientIds = action.clientIds ?? [];
    if (clientId && !clientIds.includes(clientId)) continue;
    push(dayFromIso(action.date), {
      id: action.id,
      source: "corporate-action",
      // The exchange's own phrasing, and the same string the Company Events
      // grid on a stock prints. A row that said "PTT goes ex-dividend" here and
      // "XD : PTT" there would read as two different events.
      title: `${action.kind} : ${action.symbol}`,
      detail: action.detail ?? "",
      clientIds,
      done: false,
      noteId: null,
      kind: action.kind,
      symbol: action.symbol,
      symbolName: action.name ?? action.symbol,
      facts: action.record ?? [],
    });
  }

  for (const event of feed.events) {
    const clientIds = event.clientIds ?? [];
    if (clientId && !clientIds.includes(clientId)) continue;
    push(dayFromIso(event.date), {
      id: event.id,
      source: "event",
      title: event.title,
      detail: event.detail ?? "",
      clientIds,
      done: false,
      noteId: null,
      kind: event.category,
      symbol: "",
      symbolName: "",
      // One group: an event's extras are a short flat list, and wrapping them
      // is cheaper than teaching the panel two shapes.
      facts: event.facts ? [event.facts] : [],
    });
  }

  for (const list of map.values()) {
    // Three rules, in order. Open before settled, so a ticked-off reminder can't
    // push a live one out of a cell's visible pills. Then by source: an exchange
    // fact is a deadline nobody can reschedule, a desk event is one someone
    // could, and a note is the user's own handwriting — the one they have least
    // control over reads first. Then, within the corporate actions, the
    // exchange's own code order and the symbol, so a day's cards come out
    // identical on every render.
    list.sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        SOURCE_RANK[a.source] - SOURCE_RANK[b.source] ||
        actionKindRank(a.kind) - actionKindRank(b.kind) ||
        a.kind.localeCompare(b.kind) ||
        a.symbol.localeCompare(b.symbol),
    );
  }
  return map;
}

/**
 * Whether a row belongs in somebody's personal queue, as opposed to on the
 * calendar.
 *
 * The Calendar is a view of the market: every XD the exchange publishes belongs
 * on it, whether or not the desk holds the stock. The Dashboard's reminder
 * queue, a client's Reminders tab and the header bell are the opposite — they
 * are lists of things *this person* has to do, and a corporate action against a
 * symbol nobody in the book holds is not one of them.
 *
 * This is not a cosmetic cap. Before the market feeds landed the Calendar
 * raised three dividend alerts a month and every surface could show all of
 * them; a real corporate-action feed is dozens a month, and a bell that rings
 * for each one is a bell nobody reads. A note is always in, holders or not:
 * the user wrote it, which is the whole of the claim that it concerns them.
 */
export function concernsSomeone(item: DayItem): boolean {
  return item.source === "note" || item.clientIds.length > 0;
}

/** A day's corporate actions of one kind — six XDs drawn as one card with six
 *  symbol chips, rather than six rows saying "XD" six times. */
export type ActionGroup = { kind: string; items: DayItem[] };

/**
 * A day, split the way both the grid cell and the day panel need it.
 *
 * One function for two surfaces because the grouping *is* the shared decision:
 * a cell shows one pill per kind and the panel shows one card per kind, and the
 * two disagreeing about which symbols are in which group would be the same
 * drift `source-badge` documents.
 *
 * `items` must already be sorted by {@link groupDayItems} — groups come out in
 * first-appearance order, which is only stable because of that sort.
 */
export function splitDayItems(items: DayItem[]): {
  actionGroups: ActionGroup[];
  others: DayItem[];
} {
  const actionGroups: ActionGroup[] = [];
  const byKind = new Map<string, ActionGroup>();
  const others: DayItem[] = [];

  for (const item of items) {
    if (item.source !== "corporate-action") {
      others.push(item);
      continue;
    }
    const existing = byKind.get(item.kind);
    if (existing) {
      existing.items.push(item);
      continue;
    }
    const group = { kind: item.kind, items: [item] };
    byKind.set(item.kind, group);
    actionGroups.push(group);
  }

  return { actionGroups, others };
}
