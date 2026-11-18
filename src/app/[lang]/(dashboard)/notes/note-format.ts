import type { TagProps, TagVariant } from "@sarunyu/system-one";
import type { Note } from "@/types/domain";

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The stamp leading a note's preview line in the sidebar: a clock time while
 * the note is still today's, its date once it isn't — past today the day is
 * what you're scanning for, not the minute. Deliberately no "Yesterday"/
 * "Today" wording: the group header the row sits under already says that.
 */
export function formatListStamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return isToday
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * A reminder is a day, not a moment — the UI only ever asks for a date.
 *
 * `reminderAt` stays a full ISO timestamp because that is what the `Note` type
 * in `types/domain` declares, so rather than carry whatever hour the picker
 * happened to open at, the time is pinned here.
 * Morning rather than midnight: a reminder for the 27th means "on the 27th", and
 * midnight would land it in the previous evening for anyone reading a raw
 * timestamp in another timezone.
 */
const REMINDER_HOUR = 9;

/**
 * What a fresh reminder starts on: tomorrow.
 *
 * Must be called from an event handler, never from a `useState` initialiser —
 * `/notes` prerenders, so an initialiser would bake the build date into the HTML
 * and then disagree with the client on hydration.
 */
export function defaultReminderDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** The one place a picked date becomes a storable `reminderAt`. */
export function reminderAtFromDate(date: Date): string {
  const at = new Date(date);
  at.setHours(REMINDER_HOUR, 0, 0, 0);
  return at.toISOString();
}

/**
 * A calendar day, no time — for reminders (which have no time to show) and for
 * note cards (where the minute is noise).
 */
export function formatDayOnly(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Mirrors the design system's `Tag` variant tokens.
 *
 * Not hand-picked colours: these are the exact `--fill-*` variables `Tag` maps
 * each variant to, so a chip built here stays in step with every other tag in
 * the app and follows dark mode for free. Used by the note detail pane's
 * summary chips; the Calendar's own pills tint by day instead (`PILL_TONE` in
 * `DayCell`), since the grid position already carries the urgency this encodes.
 */
export const TAG_CHIP_TONE: Record<TagVariant, string> = {
  blue: "bg-[var(--fill-blue-50)] text-[var(--fill-blue-700)]",
  green: "bg-[var(--fill-green-100)] text-[var(--fill-green-600)]",
  yellow: "bg-[var(--fill-yellow-100)] text-[var(--fill-yellow-600)]",
  red: "bg-[var(--fill-red-100)] text-[var(--fill-red-600)]",
  gray: "bg-[var(--fill-gray-100)] text-subtle-text",
  lime: "bg-[var(--fill-lime-100)] text-[var(--fill-lime-600)]",
};

/**
 * The reminder line's colour, by the same variants `reminderTag` already sorts
 * notes into — text only, since this is a caption under a card rather than the
 * filled chip `TAG_CHIP_TONE` paints elsewhere. Kept as its own map rather than
 * merged with `TAG_CHIP_TONE`: same variant keys, but the two are genuinely
 * different visual treatments (fill+text chip vs. text-only caption).
 */
export const REMINDER_TONE: Record<NonNullable<TagProps["variant"]>, string> = {
  blue: "text-[var(--fill-blue-700)]",
  green: "text-[var(--fill-green-600)]",
  yellow: "text-[var(--fill-yellow-600)]",
  red: "text-[var(--fill-red-600)]",
  gray: "text-subtle-text",
  lime: "text-[var(--fill-lime-600)]",
};

export type ReminderTag = { label: string; variant: NonNullable<TagProps["variant"]> };

export function reminderTag(note: Note): ReminderTag | null {
  if (!note.reminderAt) return null;
  const when = formatDayOnly(note.reminderAt);
  if (note.reminderDone) return { label: `Done · ${when}`, variant: "gray" };

  // Compared by day, not by timestamp. The old version measured the gap to
  // `Date.now()`, which for a date-only reminder called today "Overdue" from
  // 09:00 onward and called tomorrow "Due today" whenever it was less than 24
  // hours away. Day boundaries are what a date-only reminder actually means.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(note.reminderAt);
  due.setHours(0, 0, 0, 0);

  if (due.getTime() < today.getTime()) return { label: `Overdue · ${when}`, variant: "red" };
  if (due.getTime() === today.getTime()) return { label: `Due today · ${when}`, variant: "yellow" };
  // `green` for a reminder that's simply scheduled. Blue is the client chip's
  // now, and this is the only reminder state that was competing for it — the
  // urgent ones keep red/yellow and a done one stays gray, so nothing here can
  // collide with a client.
  return { label: `Reminder · ${when}`, variant: "green" };
}
