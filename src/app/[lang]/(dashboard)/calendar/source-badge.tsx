import type { CSSProperties, ReactNode } from "react";
import { CoinsIcon, NotePencilIcon } from "@phosphor-icons/react";
import type { DayItem, DayItemSource } from "./day-items";
import { actionKindName, actionPalette, eventCategory } from "./market-taxonomy";

/**
 * The mark a row leads with, so a reader can tell "something I wrote" from
 * "something the exchange published" from "something the desk put up" before
 * reading a word of it.
 *
 * One definition, read by every surface that lists day items — the Calendar's
 * day panel, the alert panel, a client's Reminders tab, the Dashboard queue and
 * the header bell. It started out inline in the day list and was copied into
 * the panel, which is exactly how the two drifted apart: the panel stayed green
 * for a release after the list turned orange.
 *
 * ## Why this is a function and not a table
 *
 * It used to be a `Record<DayItemSource, …>`, back when the two sources were
 * "note" and "dividend" and a source was the whole of what a row's colour had
 * to say. It isn't any more. A corporate action's colour is its SET code and a
 * market event's is its category, and neither list is closed — see
 * `market-taxonomy`. A table keyed by source could only have answered with one
 * orange for every code, which is the same as answering with nothing.
 *
 * So the tint arrives as an inline `style` rather than a Tailwind class. That
 * is not a style the app can hard-code: the whole point is that a kind nobody
 * has designed for still gets one.
 */

export type ItemBadge = {
  icon: ReactNode;
  /** The accessible name — "Note", "Excluding Dividend", "Seminar". */
  label: string;
  /** Tailwind fill, for the cases that have a fixed one. */
  className: string;
  /** Resolved fill, for the cases that don't. */
  style?: CSSProperties;
};

/** Done drops out of every ramp, the way it does everywhere else in the
 * calendar: finished business shouldn't keep a colour that asks to be dealt
 * with. Private now — callers get it folded into {@link ItemBadge.className}
 * rather than deciding for themselves when a row counts as settled, which is
 * how the Reminders tab and the day list once disagreed about it. */
const DONE_BADGE_TONE = "bg-[var(--fill-gray-100)] text-[var(--fill-gray-400)]";

/** The light end of the primary ramp the grid pills use, so a row and the pill
 *  it corresponds to read as the same thing. */
const NOTE_TONE = "bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]";

/**
 * The badge for one row.
 *
 * A corporate action wears its own code rather than a glyph. Two letters is
 * both the shortest and the most specific thing that circle could hold — a coin
 * says "money happened", "XD" says which of eleven things did — and it is the
 * same mark the Company Events grid on a stock puts in the same place.
 */
export function itemBadge(item: Pick<DayItem, "source" | "kind" | "done">): ItemBadge {
  if (item.source === "corporate-action") {
    const palette = actionPalette(item.kind);
    return {
      icon: (
        <span className="text-meta font-semibold leading-none tracking-tight">{item.kind}</span>
      ),
      label: actionKindName(item.kind),
      className: item.done ? DONE_BADGE_TONE : "",
      style: item.done
        ? undefined
        : { backgroundColor: palette.tint, color: palette.text },
    };
  }

  if (item.source === "event") {
    const category = eventCategory(item.kind);
    return {
      icon: category.icon,
      label: category.label,
      className: item.done ? DONE_BADGE_TONE : "",
      style: item.done
        ? undefined
        : { backgroundColor: category.tint, color: category.text },
    };
  }

  return {
    icon: <NotePencilIcon size={15} />,
    label: "Note",
    className: item.done ? DONE_BADGE_TONE : NOTE_TONE,
  };
}

/**
 * The per-source fallback, for the two surfaces that hold a row without its
 * taxonomy code — the Dashboard's queue merges KYC expiries in and types its
 * rows off its own union, not off `DayItem`.
 *
 * Deliberately generic: this is the badge for "some exchange fact" rather than
 * for any particular one, and a caller that can reach the item should call
 * {@link itemBadge} instead and get the real thing.
 */
export const SOURCE_BADGE: Record<DayItemSource, ItemBadge> = {
  note: itemBadge({ source: "note", kind: "", done: false }),
  "corporate-action": {
    icon: <CoinsIcon size={15} />,
    label: "Corporate action",
    className: "bg-[var(--fill-orange-100)] text-[var(--fill-orange-600)]",
  },
  event: itemBadge({ source: "event", kind: "other", done: false }),
};

/**
 * The circle itself — {@link itemBadge} plus the shell every caller built by
 * hand around it. `size`/`selfCenter`/`label` all default to the calendar day
 * popover's own shape; the Reminders tab's card needs a bigger circle that
 * isn't vertically centered and an accessible name of its own.
 */
export function SourceBadgeIcon({
  item,
  size = "small",
  selfCenter = false,
  label,
}: {
  item: Pick<DayItem, "source" | "kind" | "done">;
  size?: "small" | "default";
  selfCenter?: boolean;
  /** Accessible name override — defaults to the badge's own label. */
  label?: string;
}) {
  const badge = itemBadge(item);
  return (
    <span
      role="img"
      aria-label={label ?? badge.label}
      style={badge.style}
      className={`flex shrink-0 items-center justify-center rounded-full ${
        selfCenter ? "self-center " : ""
      }${size === "small" ? "size-7" : "size-8"} ${badge.className}`}
    >
      {badge.icon}
    </span>
  );
}
