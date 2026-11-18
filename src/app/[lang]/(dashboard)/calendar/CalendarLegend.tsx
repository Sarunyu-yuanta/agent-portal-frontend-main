"use client";

import type { DayItem } from "./day-items";
import {
  actionKindName,
  actionKindRank,
  actionPalette,
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
  const kinds = new Set<string>();
  const categories = new Set<string>();
  let hasNote = false;
  let hasDoneNote = false;

  for (const items of itemsByDay.values()) {
    for (const item of items) {
      if (item.source === "corporate-action") kinds.add(item.kind);
      else if (item.source === "event") categories.add(item.kind);
      else if (item.done) hasDoneNote = true;
      else hasNote = true;
    }
  }

  const sortedKinds = [...kinds].sort(
    (a, b) => actionKindRank(a) - actionKindRank(b) || a.localeCompare(b),
  );
  const sortedCategories = [...categories].sort((a, b) =>
    eventCategory(a).label.localeCompare(eventCategory(b).label),
  );

  if (
    sortedKinds.length === 0 &&
    sortedCategories.length === 0 &&
    !hasHolidays &&
    !hasNote &&
    !hasDoneNote
  ) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-3 py-3">
      {sortedKinds.map((kind) => {
        const palette = actionPalette(kind);
        return (
          <Entry
            key={`k:${kind}`}
            // The exact three properties `DayCell` sets on a corporate-action
            // pill, so the key and the thing it keys are one lookup apart.
            swatchStyle={{
              backgroundColor: palette.tint,
              color: palette.text,
              borderLeft: `2px solid ${palette.accent}`,
            }}
            swatch={kind}
            label={actionKindName(kind)}
          />
        );
      })}

      {sortedCategories.map((category) => {
        const meta = eventCategory(category);
        return (
          <Entry
            key={`c:${category}`}
            swatchStyle={{ backgroundColor: meta.tint, color: meta.text }}
            swatch={<span className="flex items-center [&>svg]:size-3">{meta.icon}</span>}
            label={meta.label}
          />
        );
      })}

      {hasHolidays && (
        <Entry
          swatchStyle={{
            backgroundColor: HOLIDAY_PALETTE.tint,
            color: HOLIDAY_PALETTE.text,
          }}
          swatch={
            <span className="flex items-center [&>svg]:size-3">
              <HolidayIcon size={12} weight="fill" />
            </span>
          }
          label="วันหยุดตลาด"
        />
      )}

      {/* The future tone, not today's solid fill: a reminder is tinted by how
          far off it is (`PILL_TONE` in `DayCell`), and the one step that is not
          about a particular day is the one to print here. */}
      {hasNote && (
        <Entry
          swatchClassName="bg-[var(--fill-p1-200)] text-[var(--fill-p1-700)]"
          swatch={<span className="size-2 rounded-full bg-current" />}
          label="โน้ต / การเตือนของคุณ"
        />
      )}

      {hasDoneNote && (
        <Entry
          swatchClassName="bg-[var(--fill-gray-100)] text-subtle-text"
          swatch={<span className="size-2 rounded-full bg-current" />}
          label="เตือนที่ทำแล้ว"
        />
      )}
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
      className={`flex h-[18px] min-w-[18px] shrink-0 items-center justify-center gap-1 rounded-[3px] px-1 type-caption font-semibold leading-none ${swatchClassName}`}
    >
      {swatch}
    </span>
  );
}

/** One key: the pill as the grid draws it, and what it stands for. */
function Entry({
  swatch,
  swatchStyle,
  swatchClassName = "",
  label,
}: {
  swatch: React.ReactNode;
  swatchStyle?: React.CSSProperties;
  swatchClassName?: string;
  label: string;
}) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <KeyPill swatch={swatch} swatchStyle={swatchStyle} swatchClassName={swatchClassName} />
      <span className="type-caption text-muted-foreground">{label}</span>
    </span>
  );
}
