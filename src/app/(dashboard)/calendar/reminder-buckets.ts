/**
 * The four states a reminder can be in, and how each one looks.
 *
 * A reminder's date only means something relative to today, so every surface
 * that lists reminders ends up sorting them into the same four groups rather
 * than showing one run of dates: what has slipped, what is due now, what is
 * coming, and what is finished. The client's Reminders tab established the
 * model; the Dashboard needed the same one, and two copies of a tone table is
 * exactly how the Calendar's pills turned orange while the alert panel stayed
 * green (see `source-badge` for that story).
 *
 * Labels are *not* here. The two surfaces are written in different languages —
 * the client tab in English, the Dashboard in Thai — and that is a property of
 * the screen, not of the bucket. Everything that must not drift is.
 */

import type { DayRelation } from "./calendar-grid";

/** Urgency order — the order the groups are rendered in, everywhere. */
export const REMINDER_BUCKETS = ["overdue", "today", "upcoming", "done"] as const;

export type ReminderBucket = (typeof REMINDER_BUCKETS)[number];

/**
 * Which bucket a row lands in.
 *
 * `done` outranks the date: a ticked reminder is finished business whether it
 * was due yesterday or next week, so it leaves the urgency scale entirely
 * rather than keeping a place that still asks to be dealt with.
 */
export function bucketFor(done: boolean, relation: DayRelation): ReminderBucket {
  if (done) return "done";
  return ({ past: "overdue", today: "today", future: "upcoming" } as const)[relation];
}

/**
 * Badge tone per bucket, matching the badges the Calendar's day popover uses
 * for the same concept (`RELATION_BADGE` in `DayPopoverContent`).
 *
 * Overdue reads off the primary ramp rather than red, so it doesn't compete
 * with the KYC-style risk red used elsewhere for "urgent". Upcoming gets a
 * neutral tag the popover skips — there the date line already says it, but in
 * a list where rows from different buckets sit together, every row needs one.
 */
export const BUCKET_TONE: Record<ReminderBucket, string> = {
  overdue: "bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]",
  today: "bg-primary-action text-white",
  upcoming: "bg-[var(--fill-gray-100)] text-[var(--fill-gray-600)]",
  done: "bg-[var(--fill-gray-100)] text-[var(--fill-gray-400)]",
};

/**
 * Whether the newest row in a bucket is the one you want first.
 *
 * Ascending everywhere but Done: oldest first means most overdue first, and
 * soonest first for what's ahead. Done is finished business kept so a ticked
 * reminder can still be found, and the one you finished last is the one you
 * are most likely looking for.
 */
export function bucketSortsDescending(bucket: ReminderBucket): boolean {
  return bucket === "done";
}
