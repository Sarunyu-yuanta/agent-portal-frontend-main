"use client";

import { useCallback, useId } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import type { DayItem } from "@/features/calendar/lib/day-items";
import { useStoredIds } from "@/hooks/use-stored-ids";
import { useT } from "@/i18n/I18nProvider";
import {
  actionKindName,
  actionKindRank,
  actionKindShortName,
  actionKindTag,
  actionPalette,
  assetClassName,
  assetClassRank,
  eventCategory,
  HolidayIcon,
  HOLIDAY_PALETTE,
} from "./market-taxonomy";

/**
 * What the colours on the grid mean, under the grid.
 *
 * The month is two dozen tinted pills wearing two-letter codes, and nothing on
 * the page said which colour was a dividend and which was a rights issue. The
 * filter menu names them — but only while it is open, and only to someone who
 * went looking for a filter when what they wanted was a key.
 *
 * ## Only what is on screen
 *
 * Built from the rows the grid actually drew, after the filter, rather than
 * from the taxonomy's full list of eleven codes and four categories. A legend
 * is read against the thing it explains: a row for `XP` in a month with no XP
 * is a colour the reader will hunt for and not find, and eleven of those bury
 * the six that are really up there. It changes as you page months, which is
 * correct — so does the grid.
 *
 * ## Grouped by what the item is about, and folded by default
 *
 * One group per asset class — หุ้น, ตราสารหนี้, Structured Note, กองทุนรวม —
 * then the desk's events, then holidays and reminders. A single flat run of
 * every code read as one list of twenty-odd alert types with no way to tell
 * that XD is a share's date and a coupon a bond's.
 *
 * Folded, it is one line: each group's name, its colours as dots and how many
 * kinds it holds — enough to say what the month is made of without taking the
 * grid's height. Unfolded, each group is a card listing its entries. Whether it
 * is open is a lasting preference (`useStoredIds`), like a column choice: a
 * reader who wants the key wants it every visit.
 *
 * ## The swatches are the pills
 *
 * Each entry is drawn with the same fill, text colour and accent bar `DayCell`
 * gives that row, from the same `market-taxonomy` call. Not a colour square
 * beside a label: a square is a second shape the reader has to map onto the
 * first, and these are small enough to print the code itself.
 */
export function CalendarLegend({
  itemsByDay,
  hasHolidays,
}: {
  /** The filtered map the grid renders — see the note above about "on screen". */
  itemsByDay: Map<string, DayItem[]>;
  /** Whether any market closure is drawn this month, holidays layer included. */
  hasHolidays: boolean;
}) {
  const t = useT();
  /** Asset class → the codes on screen for it. */
  const kindsByClass = new Map<string, Set<string>>();
  const categories = new Set<string>();
  let hasNote = false;
  let hasDoneNote = false;

  for (const items of itemsByDay.values()) {
    for (const item of items) {
      if (item.source === "corporate-action") {
        const set = kindsByClass.get(item.assetClass);
        if (set) set.add(item.kind);
        else kindsByClass.set(item.assetClass, new Set([item.kind]));
      } else if (item.source === "event") categories.add(item.kind);
      else if (item.done) hasDoneNote = true;
      else hasNote = true;
    }
  }

  const classGroups = [...kindsByClass]
    .sort(([a], [b]) => assetClassRank(a) - assetClassRank(b) || a.localeCompare(b))
    .map(([assetClass, kinds]) => ({
      assetClass,
      kinds: [...kinds].sort((a, b) => actionKindRank(a) - actionKindRank(b) || a.localeCompare(b)),
    }));
  const sortedCategories = [...categories].sort((a, b) =>
    eventCategory(a, t).label.localeCompare(eventCategory(b, t).label),
  );

  if (
    classGroups.length === 0 &&
    sortedCategories.length === 0 &&
    !hasHolidays &&
    !hasNote &&
    !hasDoneNote
  ) {
    return null;
  }

  const { legend } = t.planner.calendar;
  const groups: LegendGroup[] = [
    ...classGroups.map(({ assetClass, kinds }) => ({
      key: assetClass,
      label: assetClassName(assetClass, t),
      entries: kinds.map((kind): EntryProps => {
        const palette = actionPalette(kind);
        return {
          key: kind,
          // The exact three properties `DayCell` sets on a corporate-action
          // pill, so the key and the thing it keys are one lookup apart.
          swatchStyle: {
            backgroundColor: palette.tint,
            color: palette.text,
            borderLeft: `2px solid ${palette.accent}`,
          },
          dot: palette.accent,
          swatch: <span className="flex items-center [&>svg]:size-3">{actionKindTag(kind)}</span>,
          // The short name: the card is already headed "หุ้น" / "Equity", so
          // "Excluding " on every entry is noise. The full name is the tooltip.
          label: actionKindShortName(kind, t) ?? actionKindName(kind, t),
          fullLabel: actionKindName(kind, t),
        };
      }),
    })),
    {
      key: "event",
      label: legend.groups.event,
      entries: sortedCategories.map((category): EntryProps => {
        const meta = eventCategory(category, t);
        return {
          key: category,
          swatchStyle: { backgroundColor: meta.tint, color: meta.text },
          dot: meta.accent,
          swatch: <span className="flex items-center [&>svg]:size-3">{meta.icon}</span>,
          label: meta.label,
        };
      }),
    },
    {
      key: "other",
      label: legend.groups.other,
      entries: (
        [
          hasHolidays && {
            key: "holiday",
            swatchStyle: { backgroundColor: HOLIDAY_PALETTE.tint, color: HOLIDAY_PALETTE.text },
            dot: HOLIDAY_PALETTE.accent,
            swatch: (
              <span className="flex items-center [&>svg]:size-3">
                <HolidayIcon size={12} weight="fill" />
              </span>
            ),
            label: legend.holiday,
          },
          // The future tone, not today's solid fill: a reminder is tinted by how
          // far off it is (`PILL_TONE` in `DayCell`), and the one step that is
          // not about a particular day is the one to print here.
          hasNote && {
            key: "note",
            swatchClassName: "bg-[var(--fill-p1-200)] text-[var(--fill-p1-700)]",
            dot: "var(--fill-p1-500)",
            swatch: <span className="size-2 rounded-full bg-current" />,
            label: legend.note,
          },
          hasDoneNote && {
            key: "done-note",
            swatchClassName: "bg-[var(--fill-gray-100)] text-subtle-text",
            dot: "var(--fill-gray-400)",
            swatch: <span className="size-2 rounded-full bg-current" />,
            label: legend.doneNote,
          },
        ] as (EntryProps | false)[]
      ).filter((entry): entry is EntryProps => Boolean(entry)),
    },
  ].filter((group) => group.entries.length > 0);

  return <LegendPanel groups={groups} />;
}

type EntryProps = {
  key: string;
  swatch: React.ReactNode;
  swatchStyle?: React.CSSProperties;
  swatchClassName?: string;
  /** The entry's saturated colour, for the folded bar's dots. */
  dot: string;
  label: string;
  /** The tooltip, where `label` is a shortened form. */
  fullLabel?: string;
};

type LegendGroup = { key: string; label: string; entries: EntryProps[] };

const isOpenFlag = (id: string) => id === "open";

/** Entries a card holds in one column before it widens to two. */
const WIDE_AFTER = 5;

/** The folded bar and, when open, the cards under it. */
function LegendPanel({ groups }: { groups: LegendGroup[] }) {
  const t = useT();
  const { legend } = t.planner.calendar;
  const panelId = useId();
  const [flags, setFlags] = useStoredIds<"open">("calendar:legend", isOpenFlag);
  const open = flags.has("open");
  const toggle = useCallback(
    () => setFlags(open ? new Set() : new Set(["open"])),
    [open, setFlags],
  );

  return (
    <div className="flex shrink-0 flex-col border-t border-border">
      {/* The whole bar is the toggle — the summary is what you click to see
          more of, and a lone caret at the far end is a small target on a
          wide screen. */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-10 w-full cursor-pointer items-center gap-x-4 gap-y-1 px-3 py-2 text-left transition-colors hover:bg-[var(--bg-default-secondary)]!"
      >
        <span className="type-caption shrink-0 font-semibold text-foreground">{legend.title}</span>
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
          {groups.map((group) => (
            <span key={group.key} className="flex items-center gap-1.5">
              <span aria-hidden className="flex items-center -space-x-0.5">
                {group.entries.slice(0, 6).map((entry) => (
                  <span
                    key={entry.key}
                    className="size-2 rounded-full ring-2 ring-card"
                    style={{ backgroundColor: entry.dot }}
                  />
                ))}
              </span>
              <span className="type-caption whitespace-nowrap text-muted-foreground">
                {group.label}
                <span className="text-subtle-text ml-1 tabular-nums">{group.entries.length}</span>
              </span>
            </span>
          ))}
        </span>
        <span className="type-caption text-primary-action flex shrink-0 items-center gap-1 font-medium">
          {open ? legend.hide : legend.showAll}
          <CaretDownIcon
            size={12}
            weight="bold"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div id={panelId} className="flex flex-wrap items-start gap-2 px-3 pb-3">
          {groups.map((group) => (
            <GroupCard key={group.key} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One group as a card: its name and count on top, its entries one per line
 * below. One per line rather than wrapped, so every swatch sits in the same
 * column and the names read straight down.
 */
function GroupCard({ group }: { group: LegendGroup }) {
  const t = useT();
  // A group past this many entries (the shares' X-codes) takes two columns,
  // its list split across them, so it ends near the height of its neighbours
  // instead of standing twice as tall.
  const wide = group.entries.length > WIDE_AFTER;
  return (
    <div
      role="group"
      aria-label={t.planner.calendar.legend.groupLabel(group.label)}
      // Sized by its content and never stretched: a card doesn't cut its own
      // names short to squeeze one more onto the line — it wraps to the next —
      // and one that wrapped alone doesn't balloon to the full width.
      // `max-w-full` is the phone's limit.
      className="flex max-w-full flex-col gap-2 rounded-lg border border-border/70 bg-[var(--bg-default-secondary)] p-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="type-caption truncate font-semibold text-foreground">{group.label}</span>
        <span className="type-caption text-subtle-text shrink-0 tabular-nums">
          {group.entries.length}
        </span>
      </div>
      <div className={`grid gap-x-3 gap-y-1.5 ${wide ? "sm:grid-cols-2" : ""}`}>
        {group.entries.map(({ key, ...entry }) => (
          <Entry key={key} {...entry} />
        ))}
      </div>
    </div>
  );
}

/** The pill as the grid draws it — shared with the filter menu, so the code
 *  you tick there and the key printed under the grid are one and the same. */
export function KeyPill({
  swatch,
  swatchStyle,
  swatchClassName = "",
}: {
  swatch: React.ReactNode;
  swatchStyle?: React.CSSProperties;
  swatchClassName?: string;
}) {
  return (
    <span
      style={swatchStyle}
      className={`type-caption flex h-[18px] min-w-[18px] shrink-0 items-center justify-center gap-1 rounded-[3px] px-1 leading-none font-semibold ${swatchClassName}`}
    >
      {swatch}
    </span>
  );
}

/** One key: the pill as the grid draws it, and what it stands for.
 *
 * Every swatch is the same width, so a two-letter code and a glyph start their
 * labels on the same line rather than staggering by a few pixels per entry. */
function Entry({
  swatch,
  swatchStyle,
  swatchClassName = "",
  label,
  fullLabel,
}: Omit<EntryProps, "key" | "dot">) {
  return (
    <span className="flex h-5 min-w-0 items-center gap-1.5" title={fullLabel ?? label}>
      <KeyPill
        swatch={swatch}
        swatchStyle={{ minWidth: 26, ...swatchStyle }}
        swatchClassName={swatchClassName}
      />
      <span className="type-caption min-w-0 truncate text-muted-foreground">{label}</span>
    </span>
  );
}
