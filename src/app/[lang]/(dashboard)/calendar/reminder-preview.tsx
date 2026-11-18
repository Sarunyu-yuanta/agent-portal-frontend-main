"use client";

import type { ReactNode } from "react";
import { BellIcon, CalendarBlankIcon, CalendarCheckIcon } from "@phosphor-icons/react";
import { formatDayOnly, TAG_CHIP_TONE } from "../notes/note-format";

/**
 * One reminder the way the Client 360 Overview card draws it: a bell, the
 * title, and the date. `meta` is the extra line the Dashboard needs once the
 * same row covers every client instead of the person whose profile is open.
 */
export function ReminderPreviewRow({
  title,
  meta,
  dayIso,
  dueToday,
  onClick,
  flush = false,
  showDate = true,
  hoverClassName = "hover:bg-[var(--fill-gray-200)]!",
  icon,
  iconToneClassName,
}: {
  title: string;
  meta?: string;
  dayIso: string;
  dueToday: boolean;
  onClick: () => void;
  /** Drop the row's own radius and fill, for a caller that stacks these inside
   *  one bordered list and draws the rules between them itself. Opt-in so the
   *  three surfaces that render these as separate tiles — the mini calendar's
   *  day popover and the Client 360 Overview card — are untouched. */
  flush?: boolean;
  /** Drop the date line, for a caller that has already grouped these under a
   *  date heading — the Calendar's Reminder tab. On by default: everywhere else
   *  these rows sit in a flat list where the date is the whole point. */
  showDate?: boolean;
  /** What the row tints to under the cursor. A class rather than a token,
   *  because the caller that needs this — the Reminder tab's highlighted
   *  "today" block — sits on a primary fill, where the default grey would take
   *  the highlight off the one row being pointed at. Same trade `RowIcon` in
   *  `dashboard/CardHeader` makes with its `tone`. */
  hoverClassName?: string;
  /** What sits in the round badge, when a bell is the wrong word for it. The
   *  Calendar's Reminder tab lists KYC expiries beside the calendar's own rows,
   *  and an expiring record is not something anyone set an alarm on. */
  icon?: ReactNode;
  /** Fill + text classes for that badge, overriding the due/not-due pair. */
  iconToneClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 p-3 text-left transition-colors cursor-pointer ${hoverClassName} ${
        flush ? "w-full" : "rounded-xl bg-[var(--bg-default-secondary)]"
      }`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
          iconToneClassName ?? TAG_CHIP_TONE[dueToday ? "yellow" : "green"]
        }`}
      >
        {icon ?? <BellIcon size={16} weight="fill" />}
      </span>
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <p className="type-body-2 font-semibold text-foreground truncate">{title}</p>
        {meta ? <p className="type-caption text-muted-foreground truncate">{meta}</p> : null}
        {!showDate ? null : dueToday ? (
          <p className="type-caption text-muted-foreground/70">
            Due today · {formatDayOnly(dayIso)}
          </p>
        ) : (
          <p className="flex items-center gap-1 type-caption text-muted-foreground/70">
            <CalendarBlankIcon size={12} />
            {formatDayOnly(dayIso)}
          </p>
        )}
      </div>
    </button>
  );
}

/** The Overview card's empty state, used wherever that card's list can run out. */
export function RemindersPreviewEmpty({
  hint = "Set one from a note on the Notes tab.",
}: {
  /** `null` hides the line under the title — a caller that offers its own next step. */
  hint?: string | null;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-4 text-center">
      <CalendarCheckIcon size={32} className="text-muted-foreground/40" weight="duotone" />
      <p className="type-body-2 text-muted-foreground">No reminders yet</p>
      {hint ? <p className="type-caption text-muted-foreground/60">{hint}</p> : null}
    </div>
  );
}
