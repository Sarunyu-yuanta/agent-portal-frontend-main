import type { Locale } from "@/i18n/config";
import { formatDate, formatTime, weekdayNames } from "@/i18n/format";
import type { NotificationItem } from "@sarunyu/system-one";

/**
 * The one axis every bell row is placed on: how many days until it is due.
 *
 * Both feeds that reach the bell — reminders and KYC expiries — used to group
 * on axes of their own. Reminders answered "how close is this", KYC answered
 * "when did this alert arrive", and the shell concatenated the two lists. The
 * result read as two apps stapled together, and put "Next 2 weeks" *above*
 * "วันนี้" because the second list simply started after the first had ended.
 *
 * One shared zone fixes the ordering and the vocabulary at the same time: a KYC
 * expiring today and a dividend due today land in the same group, under one
 * Thai heading, sorted by urgency rather than by which hook produced them.
 */
export type NotificationZone =
  | "overdue"
  | "today"
  | "tomorrow"
  | "thisWeek"
  | "next2Weeks";

/** Urgency order — the order the groups are rendered in. */
export const ZONE_ORDER: NotificationZone[] = [
  "overdue",
  "today",
  "tomorrow",
  "thisWeek",
  "next2Weeks",
];


/**
 * Which zone a due-date falls in, or `null` past 15 days — the point nothing
 * has rung its first checkpoint yet and the bell should stay quiet.
 *
 * Overdue and today are each exactly one day; the zones widen further out,
 * since something 15 days away does not need the day-by-day separation that
 * something due tomorrow does.
 */
export function zoneForDays(daysLeft: number): NotificationZone | null {
  if (daysLeft < 0) return "overdue";
  if (daysLeft === 0) return "today";
  if (daysLeft === 1) return "tomorrow";
  if (daysLeft <= 7) return "thisWeek";
  if (daysLeft <= 15) return "next2Weeks";
  return null;
}

/**
 * Whether a zone belongs in the bell's first screen.
 *
 * The split the whole panel is built on: *already due* on open, everything
 * still ahead behind one row. Tomorrow sits on the far side deliberately —
 * "หน้าแรกคือสิ่งที่ถึงกำหนดแล้ว" is a rule that survives being explained,
 * where "today plus tomorrow, but not the day after" is not.
 */
export function isDue(zone: NotificationZone): boolean {
  return zone === "overdue" || zone === "today";
}

/** A row plus the zone it was placed in, before the shell groups them. */
export type ZonedNotification = {
  zone: NotificationZone;
  /** Days until due — sorts rows within a zone, most urgent first. */
  daysLeft: number;
  /**
   * The exact moment it happened, when the source knows one — an order's
   * settlement, a note's reminder time. Absent for things that only have a
   * day (a KYC expiry, a corporate action, a standing "book is full"), which
   * the bell then dates by day alone. Also breaks ties within a day.
   */
  at?: Date;
  item: NotificationItem;
};

/**
 * A day counted back from today, the way a chat list dates its messages —
 * words for the first two and a count after that: "วันนี้", "เมื่อวาน",
 * "2 วันก่อน". The bell prints it on each row of a bucket that spans several
 * days (see `pastBucketTh`), where the heading alone can't say which day.
 *
 * `daysAgo` is `-daysLeft`, so 0 is today and 1 is yesterday.
 */


/** Bucket ids in panel order, newest first. Headings: `t.buckets.past[id]`. */
export const PAST_BUCKETS = ["today", "yesterday", "week", "earlier"] as const;
export type PastBucket = (typeof PAST_BUCKETS)[number];

/**
 * The heading a past row is grouped under in the bell.
 *
 * One heading per day read as one heading per row once alerts got sparse
 * ("13 วันก่อน", "15 วันก่อน", …), so only today and yesterday get a day of
 * their own; the rest share a week bucket and an "earlier" bucket, and each
 * row carries its own stamp from `notificationStampEn`.
 */
export function pastBucket(daysAgo: number): PastBucket {
  if (daysAgo <= 0) return "today";
  if (daysAgo === 1) return "yesterday";
  if (daysAgo <= 7) return "week";
  return "earlier";
}


/**
 * The small stamp beside a bell row's title, sized to its bucket:
 *
 * - today → the time alone, "9:43 AM" (the heading already says which day)
 * - yesterday and the last 7 days → weekday and time, "Fri 11:43 AM"
 * - earlier → weekday and date, "Thu 11/5" (a time that old is noise)
 *
 * A row without an exact `at` only knows its day, so it gets the day part
 * alone — and nothing at all under "วันนี้", where that would be empty.
 *
 * Only ever rendered once the panel is open (client-side), so formatting in
 * the browser's own zone can't cause a hydration mismatch.
 */
export function notificationStamp(daysAgo: number, locale: Locale, at?: Date): string {
  const day = at ?? new Date(new Date().setHours(0, 0, 0, 0) - daysAgo * 86_400_000);
  const clock = at ? formatTime(locale, at) : "";
  if (daysAgo <= 0) return clock;
  const weekday = weekdayNames(locale, "short")[day.getDay()];
  if (daysAgo <= 7) return clock ? `${weekday} ${clock}` : weekday;
  return `${weekday} ${formatDate(locale, day, "dayMonth")}`;
}
