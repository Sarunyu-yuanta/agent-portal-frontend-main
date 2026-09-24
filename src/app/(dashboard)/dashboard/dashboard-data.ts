/**
 * What the Dashboard derives, kept out of the components that draw it.
 *
 * ─── Why this page exists ────────────────────────────────────────────────────
 * Every other section is organised by its own subject — Client 360 by client,
 * Product Catalog by product category, Insights by the period a view was
 * published in. None of them is organised by *today*, and the one axis in the
 * app that is (`../notification-zones`) had exactly one reader: the header
 * bell, a popover that closes the moment you click anything in it.
 *
 * So this file does two things the rest of the app leaves undone:
 *
 * 1. **Merges the three feeds that own an RM's morning** — KYC expiries,
 *    reminders, and desk-raised alerts — onto that shared urgency axis, so they
 *    can be worked through as one list instead of three surfaces.
 * 2. **Joins the axes that already have a bridge in the data but no screen
 *    using it** — a house view to the products it points at, a client to the
 *    advisory account they don't have yet.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * Nothing new is mocked here. Every input is a dataset that already exists
 * (`@/lib/mock-data`, the notes context, the calendar's alert stand-in), so
 * pointing those at real endpoints lights this page up with them.
 */

import { mockHouseViewStrategies, mockNBAActions } from "@/lib/mock-data";
import { maskName } from "@/lib/mask-name";
import type { Client, Note } from "@/types/domain";
import {
  addMonths,
  dayFromKey,
  dayKey,
  dayOffset,
  dayRelation,
  isSameMonth,
} from "../calendar/calendar-grid";
import { groupDayItems, type DayItem } from "../calendar/day-items";
import {
  bucketFor,
  bucketSortsDescending,
  REMINDER_BUCKETS,
  type ReminderBucket,
} from "../calendar/reminder-buckets";
import { getRelatedProducts } from "../insights/house-view-data";
import { kycExpiry, kycExpiryLabelTh } from "../client/[id]/client-detail-data";
import { lastCheckpointCrossed } from "../use-kyc-notification-feed";
import { zoneForDays } from "../notification-zones";

// ── Reminders ───────────────────────────────────────────────────────────────

/**
 * Where a reminder row came from. A superset of the Calendar's
 * `DayItemSource`: KYC has no calendar row of its own (it is derived from the
 * client's record, not written on a day), but in a list of things with a date
 * on them it is the same kind of thing — a deadline someone has to act on
 * before it passes, and the header bell already merges the two feeds for
 * exactly that reason.
 */
export type QueueSource = "kyc" | "note" | "dividend";

export type QueueItem = {
  /**
   * Stable, and for KYC *checkpoint-scoped* — `kyc:110002:d7` rather than
   * `kyc:110002`. Dismissing a row must not silence that client forever: the
   * id changes at the next checkpoint (30 → 15 → 7 → 1 → 0), so the expiry
   * comes back as a new row each time it gets closer. Same reasoning, and the
   * same checkpoint, as the bell's row ids.
   */
  id: string;
  source: QueueSource;
  title: string;
  detail: string;
  day: Date;
  /** Negative once the deadline has passed. */
  daysLeft: number;
  /** Settled and no longer asking for anything. Only a note can be. */
  done: boolean;
  clientIds: string[];
  /** The calendar row this opens in a modal, or `null` for a KYC row. */
  dayItem: DayItem | null;
  /** Where the row navigates instead, when it has no modal. */
  href: string | null;
};

/** Deadlines set by someone else lead; the user's own handwriting follows. */
const SOURCE_WEIGHT: Record<QueueSource, number> = {
  kyc: 0,
  dividend: 1,
  note: 2,
};

/**
 * Everything due inside the bell's 15-day horizon, as one ordered list.
 *
 * @param isPrivate masks the client names a KYC row is titled with. Applied
 * here rather than at render because only this function knows which strings in
 * a row are names — a note's title and an alert's title are not.
 */
export function buildQueue({
  clients,
  notes,
  today,
  isPrivate,
}: {
  clients: Client[];
  notes: Note[];
  today: Date;
  isPrivate: boolean;
}): QueueItem[] {
  const rows: QueueItem[] = [];

  for (const client of clients) {
    const expiry = kycExpiry(client.id);
    if (!expiry || expiry.daysLeft === null) continue;
    // Two gates, exactly as the bell applies them: the checkpoint decides
    // whether this expiry has started ringing at all, the zone decides whether
    // it is close enough to show. See `use-kyc-notification-feed`.
    const checkpoint = lastCheckpointCrossed(expiry.daysLeft);
    if (checkpoint === null) continue;
    const zone = zoneForDays(expiry.daysLeft);
    if (!zone) continue;

    rows.push({
      id: `kyc:${client.id}:d${checkpoint}`,
      source: "kyc",
      title: maskName(client.name, isPrivate),
      detail: kycExpiryLabelTh(client.id) ?? "",
      day: addDays(today, expiry.daysLeft),
      daysLeft: expiry.daysLeft,
      done: false,
      clientIds: [client.id],
      dayItem: null,
      href: `/client/${client.id}?tab=kyc`,
    });
  }

  // Two months' worth: `groupDayItems` anchors the desk's alerts to the month
  // of the date it is given, so a 15-day horizon started late in a month would
  // otherwise stop at the month boundary. Notes are passed to the first call
  // only — they carry their own dates and would come back twice.
  const dayGroups = [
    groupDayItems(notes, today),
    groupDayItems([], addMonths(today, 1)),
  ];

  for (const group of dayGroups) {
    for (const [key, items] of group) {
      const day = dayFromKey(key);
      const daysLeft = dayOffset(day, today);
      const zone = zoneForDays(daysLeft);
      if (!zone) continue;

      for (const item of items) {
        // An alert is an event, not an obligation: once PTT has gone ex-
        // dividend there is no longer anything to do about it, so it drops out
        // rather than sitting under "เลยกำหนด" forever. A reminder is the
        // opposite — a missed one is exactly what the user needs to see, and a
        // ticked one stays as the Done bucket's contents.
        if (item.source !== "note" && daysLeft < 0) continue;

        rows.push({
          id: item.id,
          source: item.source,
          title: item.title,
          detail: item.detail,
          day,
          daysLeft,
          done: item.done,
          clientIds: item.clientIds,
          dayItem: item,
          href: null,
        });
      }
    }
  }

  return rows.sort(
    (a, b) =>
      a.daysLeft - b.daysLeft || SOURCE_WEIGHT[a.source] - SOURCE_WEIGHT[b.source],
  );
}

/** `today` plus `n` whole days, at local midnight like every other day here. */
function addDays(today: Date, n: number): Date {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * The Thai wording for the buckets the client's Reminders tab labels in
 * English. The buckets, their order and their tones are shared; only this is
 * local — see `calendar/reminder-buckets`.
 */
export const BUCKET_LABEL_TH: Record<ReminderBucket, string> = {
  overdue: "เลยกำหนด",
  today: "วันนี้",
  upcoming: "กำลังจะถึง",
  done: "เสร็จแล้ว",
};

/** A headed block of rows — one bucket's worth. */
export type QueueGroup = {
  bucket: ReminderBucket;
  label: string;
  items: QueueItem[];
};

/**
 * Reminders sorted into the same four buckets the client's Reminders tab uses,
 * empty ones dropped.
 *
 * The page used to group these by the bell's notification zones (today /
 * tomorrow / this week / next two weeks). That axis is right for a
 * notification panel, where the question is "how soon", and wrong for a list
 * you work through, where it is "what has slipped" — and it meant a reminder
 * looked like one thing on a client's profile and another on the Dashboard.
 * The zones still decide *which* rows reach this list (`buildQueue` keeps the
 * 15-day horizon); they no longer decide how it reads.
 */
export function groupQueueByBucket(items: QueueItem[], today: Date): QueueGroup[] {
  return REMINDER_BUCKETS.map((bucket) => ({
    bucket,
    label: BUCKET_LABEL_TH[bucket],
    items: items
      .filter((i) => bucketFor(i.done, dayRelation(i.day, today)) === bucket)
      .sort((a, b) =>
        bucketSortsDescending(bucket)
          ? b.day.getTime() - a.day.getTime()
          : a.day.getTime() - b.day.getTime(),
      ),
  })).filter((g) => g.items.length > 0);
}

/**
 * Everything on one particular day, with no horizon applied.
 *
 * Separate from {@link buildQueue} rather than a filter over it, because the
 * calendar can reach days the queue deliberately cannot. The queue stops at 15
 * days — the bell's horizon, and about as far ahead as a morning list is worth
 * reading — but a month grid shows the whole month, and a day the user has
 * pointed at should answer rather than come back empty.
 *
 * Nothing is dropped here for being in the past either. Asking for a specific
 * past day is a deliberate act; the default list's rule that a lapsed alert is
 * no longer work only makes sense while the list is choosing for you.
 */
export function buildDayQueue({
  clients,
  notes,
  day,
  today,
  isPrivate,
}: {
  clients: Client[];
  notes: Note[];
  day: Date;
  today: Date;
  isPrivate: boolean;
}): QueueItem[] {
  const wanted = dayKey(day);
  const rows: QueueItem[] = [];

  for (const client of clients) {
    const expiry = kycExpiry(client.id);
    if (!expiry || expiry.daysLeft === null) continue;
    const expiryDay = addDays(today, expiry.daysLeft);
    if (dayKey(expiryDay) !== wanted) continue;
    // Still checkpoint-scoped, so a row dismissed in the list stays dismissed
    // when the same expiry is reached through the calendar.
    const checkpoint = lastCheckpointCrossed(expiry.daysLeft);
    rows.push({
      id: `kyc:${client.id}:d${checkpoint ?? "none"}`,
      source: "kyc",
      title: maskName(client.name, isPrivate),
      detail: kycExpiryLabelTh(client.id) ?? "",
      day: expiryDay,
      daysLeft: expiry.daysLeft,
      done: false,
      clientIds: [client.id],
      dayItem: null,
      href: `/client/${client.id}?tab=kyc`,
    });
  }

  for (const item of groupDayItems(notes, day).get(wanted) ?? []) {
    rows.push({
      id: item.id,
      source: item.source,
      title: item.title,
      detail: item.detail,
      day,
      daysLeft: dayOffset(day, today),
      done: item.done,
      clientIds: item.clientIds,
      dayItem: item,
      href: null,
    });
  }

  return rows.sort((a, b) => SOURCE_WEIGHT[a.source] - SOURCE_WEIGHT[b.source]);
}

/**
 * Ids the user has cleared, as stored in their preferences.
 *
 * Only the two sources with nothing to write back to are ever in here. A note
 * is settled by its own `reminderDone`, which the Calendar and the client's
 * Reminders tab read too — clearing it from a local list would settle it on
 * this page alone.
 */
export const HIDDEN_QUEUE_IDS_PREF = "dashboard:hidden-queue";

/** Drops stored ids that no longer match any source this page can raise. */
export function isQueueId(id: string): boolean {
  return id.startsWith("kyc:") || id.startsWith("dividend:");
}

// ── The month grid's dots ───────────────────────────────────────────────────

/** How many of each kind of thing falls on one day. */
export type DayDots = { kyc: number; alert: number; note: number };

/**
 * A month's worth of counts, keyed by day — what puts the dots under the dates
 * in the mini calendar.
 *
 * Built from the raw sources rather than from {@link buildQueue}, and so
 * deliberately *not* capped at 15 days: a month grid that went blank two thirds
 * of the way down would be worse than no grid, and the whole reason to show a
 * month is the part of it the list can't reach.
 */
export function buildMonthDots({
  clients,
  notes,
  today,
  viewDate,
}: {
  clients: Client[];
  notes: Note[];
  today: Date;
  viewDate: Date;
}): Map<string, DayDots> {
  const map = new Map<string, DayDots>();
  const bump = (day: Date, kind: keyof DayDots) => {
    const key = dayKey(day);
    const entry = map.get(key) ?? { kyc: 0, alert: 0, note: 0 };
    entry[kind] += 1;
    map.set(key, entry);
  };

  for (const client of clients) {
    const expiry = kycExpiry(client.id);
    if (!expiry || expiry.daysLeft === null) continue;
    const day = addDays(today, expiry.daysLeft);
    if (isSameMonth(day, viewDate)) bump(day, "kyc");
  }

  // `viewDate` rather than `today`, so paging to another month re-anchors the
  // desk's alerts to the month being looked at — the same argument
  // `groupDayItems` takes for the Calendar's own month navigation.
  for (const [key, items] of groupDayItems(notes, viewDate)) {
    const day = dayFromKey(key);
    if (!isSameMonth(day, viewDate)) continue;
    for (const item of items) {
      if (item.done) continue;
      bump(day, item.source === "note" ? "note" : "alert");
    }
  }

  return map;
}

// ── Next Best Actions ───────────────────────────────────────────────────────

/**
 * One AI-suggested action on one client.
 *
 * Typed off `mockNBAActions` here rather than imported from
 * `command-center/command-center-data`, which is where this type used to live.
 * The dataset is real and shared (`nba-actions.json` → `@/lib/mock-data`); the
 * Command Center page around it is an early sketch that predates most of the
 * app, and the Dashboard should not be the reason it has to stay.
 */
export type NbaAction = (typeof mockNBAActions)[number];

export type NbaRow = {
  action: NbaAction;
  /** Masked at build time, for the same reason a KYC row's title is. */
  displayName: string;
  /** Parsed out of `revenueImpact` when it is an amount rather than a note. */
  revenueThbM: number | null;
};

/** `"฿ 2.4M est. revenue"` → `2.4`; anything that isn't an amount → `null`. */
function revenueOf(action: NbaAction): number | null {
  if (!action.revenueImpact.startsWith("฿")) return null;
  const parsed = Number.parseFloat(action.revenueImpact.replace(/[฿M\s]/g, ""));
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * The action list, highest priority first.
 *
 * The data carries `priority` as a word and `priorityVariant` as the colour it
 * is drawn in; the order below is that word's own ranking, so HIGH sits above
 * MEDIUM whatever order the file happens to be authored in. Revenue breaks the
 * tie, since among equally urgent actions the bigger one is the one to do first.
 */
const PRIORITY_RANK: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function buildNbaRows(actions: NbaAction[], isPrivate: boolean): NbaRow[] {
  return actions
    .map((action) => ({
      action,
      displayName: maskName(action.clientName, isPrivate),
      revenueThbM: revenueOf(action),
    }))
    .sort(
      (a, b) =>
        (PRIORITY_RANK[a.action.priority] ?? 9) - (PRIORITY_RANK[b.action.priority] ?? 9) ||
        (b.revenueThbM ?? 0) - (a.revenueThbM ?? 0),
    );
}

/** Total opportunity across the list, in ฿M — the card's one summary figure. */
export function totalNbaRevenue(rows: NbaRow[]): number {
  return rows.reduce((sum, row) => sum + (row.revenueThbM ?? 0), 0);
}

/**
 * Actions the user has dismissed.
 *
 * Its own preference key rather than sharing the reminders' one: the two lists
 * have unrelated id spaces (`nba-actions.json` numbers its rows `1`, `2`, `3`),
 * and one shared key would mean a stale id from either list pruning rows out of
 * the other.
 */
export const HIDDEN_NBA_IDS_PREF = "dashboard:hidden-nba";

/** Every id in `nba-actions.json` is a bare number, so anything is plausible —
 *  the guard exists so a key written by some other feature can't leak in. */
export function isNbaId(id: string): boolean {
  return /^\d+$/.test(id);
}

/** How many actions are shown before the card stops being a shortlist. */
export const NBA_ROW_LIMIT = 4;

// ── House view, and what it points at ───────────────────────────────────────

export type SpotlightProduct = { id: string; name: string; sub: string; href: string };

/**
 * The newest house view, plus the catalog entries it implies.
 *
 * `getRelatedProducts` has mapped an asset class to real products since the
 * Insights detail page was built — this is the first surface to use it outside
 * that page, which is the join the Dashboard exists to make: the view an RM has
 * to talk about, and the thing they can actually sell off the back of it.
 *
 * `[0]` because the dataset is authored newest-first, the same order the
 * Insights list groups it in.
 */
export function houseViewSpotlight() {
  const strategy = mockHouseViewStrategies[0];
  const related = getRelatedProducts(strategy);

  const products: SpotlightProduct[] = [
    ...related.structured.map((p) => ({
      id: `structured:${p.id}`,
      name: p.productName,
      sub: `${p.coupon} · ${p.tenor}`,
      href: `/product-catalog/product/${p.id}`,
    })),
    ...related.fixedIncome.map((b) => ({
      id: `bond:${b.id}`,
      name: b.symbol,
      sub: `YTM ${b.ytm} · ${b.tenor}`,
      href: `/product-catalog/fixed-income/bond/${b.id}`,
    })),
    ...related.globalBond.map((g) => ({
      id: `global:${g.id}`,
      name: g.title,
      sub: `${g.estimatedYield} · ${g.currency}`,
      href: `/product-catalog/global-bond/${g.id}`,
    })),
  ];

  return { strategy, products };
}
