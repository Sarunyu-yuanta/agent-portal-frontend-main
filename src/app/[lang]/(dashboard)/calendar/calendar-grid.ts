const WEEKDAYS_PER_WEEK = 7;
/** Six rows covers every month (a 31-day month starting on Saturday needs it),
 * so paging between months always renders the same grid height. */
export const WEEKS_SHOWN = 6;

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type DayRelation = "past" | "today" | "future";

/**
 * Where a day sits relative to today — what the Calendar tints its reminder
 * pills by.
 *
 * Compared by calendar day, not by timestamp, for the reason `reminderTag`
 * documents: a date-only reminder means the whole day, so anything else calls
 * this morning's reminder "past" from the moment the clock passes it.
 */
export function dayRelation(day: Date, today: Date): DayRelation {
  const a = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (a < b) return "past";
  if (a > b) return "future";
  return "today";
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** `date` plus `n` whole days, at local midnight like every other day here.
 *  Lived privately in `dashboard-data` until the Calendar's Reminder tab needed
 *  it to place a KYC expiry — a fifth copy is how the two would drift. */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * The fixed 6×7 grid a month view shows: the tail of the previous month that
 * fills the first row, every day of `viewDate`'s own month, and enough of the
 * next month to fill six full weeks.
 */
export function monthGrid(viewDate: Date): Date[] {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

  return Array.from({ length: WEEKS_SHOWN * WEEKDAYS_PER_WEEK }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

/** `monthGrid`'s flat 42 days, chunked into six 7-day weeks — one per grid row. */
export function weeksOf(days: Date[]): Date[][] {
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += WEEKDAYS_PER_WEEK) {
    weeks.push(days.slice(i, i + WEEKDAYS_PER_WEEK));
  }
  return weeks;
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** A day popover's title line — "27 August 2026". */
export function dayLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Its subtitle's first half — "Thursday". Split from `dayLabel` because the two
 * are set at different sizes and the weekday shares its line with the count. */
export function weekdayLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { weekday: "long" });
}

/** Groups notes by the calendar day their reminder falls on — notes with no reminder are dropped. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * `dayKey` in reverse, for a caller that has to walk a keyed map and needs the
 * day back out of it.
 *
 * Its own function because the obvious `new Date(key)` is wrong and looks
 * right: the month in a key is `getMonth()`, which is zero-based, and the string
 * parser reads it as a calendar month — so every day comes back one month late.
 */
export function dayFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month, day);
}

/** A stable memo key for "today," anchored to the calendar day rather than a
 *  fresh `Date` object every render — a `useMemo` keyed on the object itself
 *  would recompute every time regardless of whether the day actually changed. */
export function todayDateKey(): string {
  return new Date().toDateString();
}

/** Whole calendar days between `day` and `today` — negative when `day` has
 *  already passed. */
export function dayOffset(day: Date, today: Date): number {
  return Math.round((day.getTime() - today.getTime()) / 86_400_000);
}

/** "In 5 days" / "3 days overdue" / "Today". */
export function relativeDayLabel(diff: number): string {
  if (diff === 0) return "Today";
  const n = Math.abs(diff);
  const noun = `day${n === 1 ? "" : "s"}`;
  return diff > 0 ? `In ${n} ${noun}` : `${n} ${noun} overdue`;
}
