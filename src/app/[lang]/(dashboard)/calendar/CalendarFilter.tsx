"use client";

import { useState } from "react";
import { Button, Checkbox, Popover } from "@sarunyu/system-one";
import { CaretDownIcon, FunnelSimpleIcon } from "@phosphor-icons/react";
import type { DayItem, DayItemSource } from "./day-items";
import {
  actionKindName,
  actionKindRank,
  actionKindShortName,
  actionPalette,
  eventCategory,
} from "./market-taxonomy";
import { KeyPill } from "./CalendarLegend";

/**
 * Which of the Calendar's layers are switched off, and which codes inside them.
 *
 * Stored as what is **hidden**, never as what is shown. The whole point of the
 * market feeds is that the backend can send a corporate-action code or an event
 * category the frontend has never heard of (see `market-taxonomy`); a
 * shown-list would silently swallow every one of those, because nothing would
 * have opted it in. Hidden-lists start empty, so new arrives visible.
 *
 * Three sets rather than one, because the questions nest: turning off "Company
 * events" hides all of them whatever the per-code boxes say, and turning it
 * back on restores whichever codes were individually ticked.
 */
export type CalendarFilterState = {
  /** `DayItemSource` values, plus `"holiday"` — which is a layer but not a row.
   *  See the note on `DayItemSource` in `day-items`. */
  hiddenLayers: ReadonlySet<string>;
  /** SET corporate-action codes. */
  hiddenKinds: ReadonlySet<string>;
  /** Market-event categories. */
  hiddenCategories: ReadonlySet<string>;
};

export const SHOW_EVERYTHING: CalendarFilterState = {
  hiddenLayers: new Set(),
  hiddenKinds: new Set(),
  hiddenCategories: new Set(),
};

export type CalendarLayerKey = DayItemSource | "holiday";

/**
 * The layers, in the order the menu lists them.
 *
 * Ordered by how much of the grid each one usually fills rather than
 * alphabetically or by source: a reader reaching for this control is almost
 * always trying to quieten the corporate actions, which arrive dozens a month,
 * and their own reminders are the last thing they would switch off.
 *
 * Four names and nothing else. An earlier pass gave each one a line of
 * explanatory caption and the two single-colour layers a swatch, which made a
 * four-item menu eight lines tall and put two loose dots in a column where
 * nothing else had one. The names carry it; the colours are decoded by the
 * codes inside the two layers that have them.
 */
const LAYERS: { key: CalendarLayerKey; label: string }[] = [
  { key: "corporate-action", label: "Company events" },
  { key: "event", label: "Events" },
  { key: "holiday", label: "Holidays" },
  { key: "note", label: "Reminders" },
];

/** Does this row survive the filter? Applied before the grid so a hidden row
 *  isn't counted by a cell's "+N more" either. */
export function itemVisible(
  item: DayItem,
  filter: CalendarFilterState,
): boolean {
  if (filter.hiddenLayers.has(item.source)) return false;
  if (item.source === "corporate-action")
    return !filter.hiddenKinds.has(item.kind);
  if (item.source === "event") return !filter.hiddenCategories.has(item.kind);
  return true;
}

export function holidaysVisible(filter: CalendarFilterState): boolean {
  return !filter.hiddenLayers.has("holiday");
}

/** How many boxes are unticked, for the button's own readout. A layer counts
 *  once however many codes sit under it — it is one decision the reader made,
 *  and the number is there to say "you are not seeing everything", not to be
 *  arithmetic. */
export function hiddenCount(filter: CalendarFilterState): number {
  let n = filter.hiddenLayers.size;
  if (!filter.hiddenLayers.has("corporate-action"))
    n += filter.hiddenKinds.size;
  if (!filter.hiddenLayers.has("event")) n += filter.hiddenCategories.size;
  return n;
}

function toggle(
  set: ReadonlySet<string>,
  key: string,
  hidden: boolean,
): Set<string> {
  const next = new Set(set);
  if (hidden) next.add(key);
  else next.delete(key);
  return next;
}

function ChildRow({
  tag,
  tagStyle,
  name,
  fullName,
  checked,
  onChange,
}: {
  /** What the grid prints inside the pill — a SET code, or a category's icon. */
  tag: React.ReactNode;
  /** The pill's fill and text colour, exactly as `DayCell` sets them. */
  tagStyle: React.CSSProperties;
  /** The name beside the pill: the long form of a SET code, or a category's label. */
  name: string | null;
  /** What the row is called in full, for the tooltip and the accessible name —
   *  the visible name has "Excluding " trimmed off it. */
  fullName: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Checkbox
      checked={checked}
      onChange={onChange}
      ariaLabel={fullName}
      label={
        // `whitespace-nowrap`: the list is sized to hold the longest name on one
        // line, and a row that wrapped would break the even rhythm the eye
        // scans down. If a feed ever sends something longer, it truncates —
        // the panel does not widen and never scrolls sideways.
        <span
          className="flex min-w-0 items-center gap-1.5 whitespace-nowrap"
          title={fullName}
        >
          <KeyPill swatch={tag} swatchStyle={tagStyle} />
          <span className="min-w-0 truncate type-body-2 text-muted-foreground">
            {name}
          </span>
        </span>
      }
    />
  );
}

/**
 * The Calendar's "what am I looking at" control.
 *
 * A month grid carrying four unrelated feeds needs a way to take one of them
 * away — a desk chasing a dividend run does not want six seminars and a bank
 * holiday in the same cells. This is that, and because every row carries the
 * colour it wears on the grid, it is also the legend the grid would otherwise
 * have needed a permanent strip for.
 *
 * ## Collapsed by default
 *
 * Eleven SET codes plus four event categories is nineteen rows, which turned
 * the panel into a scroller taller than most of the calendar behind it. The
 * four layers are the decision people actually come here to make; the codes
 * inside one are a refinement, so each layer opens on demand and the panel
 * opens at four lines.
 *
 * `kinds` and `categories` are the union of what the taxonomy knows and what
 * the feed actually sent this month, so a code nobody has designed for is still
 * something you can switch off. Passed in rather than read here because only
 * the caller holds the month.
 */
export function CalendarFilterMenu({
  state,
  kinds,
  categories,
  onChange,
}: {
  state: CalendarFilterState;
  /** SET codes to offer, unsorted — this component ranks them. */
  kinds: string[];
  /** Event categories to offer, unsorted. */
  categories: string[];
  onChange: (next: CalendarFilterState) => void;
}) {
  const hidden = hiddenCount(state);
  /** Which layers are showing their codes. Starts empty — see the note above. */
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const sortedKinds = [...kinds].sort(
    (a, b) => actionKindRank(a) - actionKindRank(b) || a.localeCompare(b),
  );
  const sortedCategories = [...categories].sort((a, b) =>
    eventCategory(a).label.localeCompare(eventCategory(b).label),
  );

  const childrenOf = (key: CalendarLayerKey) =>
    key === "corporate-action"
      ? {
          all: sortedKinds,
          hiddenSet: state.hiddenKinds,
          field: "hiddenKinds" as const,
        }
      : key === "event"
        ? {
            all: sortedCategories,
            hiddenSet: state.hiddenCategories,
            field: "hiddenCategories" as const,
          }
        : null;

  /**
   * Turning a layer back on also clears whatever was unticked inside it.
   *
   * The alternative — restoring the old per-code state — sounds more
   * considerate and isn't: the box you just ticked says "Company events" and
   * the grid would come back still missing three of them, with no visible
   * reason why. Off means off; on means all of it.
   */
  const setLayer = (key: CalendarLayerKey, shown: boolean) => {
    const child = childrenOf(key);
    onChange({
      ...state,
      hiddenLayers: toggle(state.hiddenLayers, key, !shown),
      ...(shown && child ? { [child.field]: new Set<string>() } : {}),
    });
  };

  const content = (
    // Wide enough for "Transferable Subscription Right" — the longest name the
    // SET taxonomy has, once "Excluding " is trimmed — to sit on one line,
    // and `overflow-x-hidden` so it can never become the sideways scroller it
    // was when the list sized itself off its content. No vertical cap either:
    // with the layers collapsed the panel is four rows, and expanding one is a
    // deliberate act whose result should be visible rather than scrolled to.
    //
    // No padding of its own. The rows carry all of it, which is what makes the
    // space above the first row, below the last and either side of a divider
    // the same 8px — a panel padded on top of padded rows ends up with a band
    // under the final row that reads as a gap nobody put there.
    <div className="flex w-[352px] max-w-[calc(var(--vw)*100-2rem)] flex-col overflow-x-hidden">
      {LAYERS.map((layer) => {
        const layerShown = !state.hiddenLayers.has(layer.key);
        const child = childrenOf(layer.key);
        const hiddenHere = child
          ? child.all.filter((c) => child.hiddenSet.has(c)).length
          : 0;
        const isOpen = expanded.has(layer.key);

        return (
          <div
            key={layer.key}
            className="flex flex-col gap-1.5 border-b border-border/60 px-3 py-2 last:border-b-0"
          >
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <Checkbox
                  // Indeterminate is the honest state for a layer that is on
                  // with some of its codes off — a plain tick would claim the
                  // grid is showing every company event when it is showing
                  // eight of eleven.
                  checked={
                    layerShown
                      ? hiddenHere > 0
                        ? "indeterminate"
                        : true
                      : false
                  }
                  onChange={(next) => setLayer(layer.key, next)}
                  label={
                    <span className="type-body-2 font-medium text-foreground">
                      {layer.label}
                    </span>
                  }
                />
              </div>

              {/* Only where there is something to open. The count is the
                  collapsed row's whole readout: "8/11" says both how many codes
                  are under here and that three of them are off, which is the
                  one thing you would otherwise have to expand to find out. */}
              {child && child.all.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((current) => {
                      const next = new Set(current);
                      if (next.has(layer.key)) next.delete(layer.key);
                      else next.add(layer.key);
                      return next;
                    })
                  }
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? "Hide" : "Show"} the ${child.all.length} ${layer.label.toLowerCase()} types`}
                  className="flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-1 type-caption font-medium text-muted-foreground transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]! hover:text-foreground"
                >
                  <span className="tabular-nums">
                    {hiddenHere > 0
                      ? `${child.all.length - hiddenHere}/${child.all.length}`
                      : child.all.length}
                  </span>
                  <CaretDownIcon
                    size={12}
                    weight="bold"
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>

            {/* Dimmed when the parent is off — still readable, because they are
                also the legend, but plainly not in force.
                `pointer-events-none` rather than `disabled` on each box: the
                parent is the control that matters here, and eleven greyed
                inputs is a lot of markup to say one thing. */}
            {child && isOpen && child.all.length > 0 && (
              <div
                className={`flex flex-col gap-1.5 pl-6 ${
                  layerShown ? "" : "pointer-events-none opacity-40"
                }`}
              >
                {layer.key === "corporate-action"
                  ? sortedKinds.map((kind) => {
                      const palette = actionPalette(kind);
                      return (
                        <ChildRow
                          key={kind}
                          tag={kind}
                          tagStyle={{
                            backgroundColor: palette.tint,
                            color: palette.text,
                            borderLeft: `2px solid ${palette.accent}`,
                          }}
                          name={actionKindShortName(kind)}
                          fullName={actionKindName(kind)}
                          checked={!state.hiddenKinds.has(kind)}
                          onChange={(next) =>
                            onChange({
                              ...state,
                              hiddenKinds: toggle(
                                state.hiddenKinds,
                                kind,
                                !next,
                              ),
                            })
                          }
                        />
                      );
                    })
                  : sortedCategories.map((category) => {
                      const meta = eventCategory(category);
                      return (
                        <ChildRow
                          key={category}
                          tag={
                            <span className="flex items-center [&>svg]:size-3">
                              {meta.icon}
                            </span>
                          }
                          tagStyle={{
                            backgroundColor: meta.tint,
                            color: meta.text,
                          }}
                          name={meta.label}
                          fullName={meta.label}
                          checked={!state.hiddenCategories.has(category)}
                          onChange={(next) =>
                            onChange({
                              ...state,
                              hiddenCategories: toggle(
                                state.hiddenCategories,
                                category,
                                !next,
                              ),
                            })
                          }
                        />
                      );
                    })}
              </div>
            )}
          </div>
        );
      })}

      {hidden > 0 && (
        // A row like the others rather than a floating link, so the list keeps
        // one left edge and one rhythm all the way down.
        <button
          type="button"
          onClick={() => onChange(SHOW_EVERYTHING)}
          className="shrink-0 border-t border-border/60 px-3 py-2 text-left type-body-2 font-medium text-primary-action transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]!"
        >
          Show everything
        </button>
      )}
    </div>
  );

  return (
    <Popover align="end" className="p-0 overflow-hidden" content={content}>
      {/* Two buttons rather than one with a hidden label, for the reason
          `CalendarView`'s "New reminder" pair documents: `Button` trims the
          padding on whichever side carries an icon, which leaves a lone glyph
          visibly off-centre. `!` on the `hidden`s because `@sarunyu/system-one`
          ships a plain `.inline-flex` and loads after `globals.css`, so it wins
          the tie against a Tailwind responsive variant. */}
      <span className="shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="max-sm:hidden!"
          leftIcon={<FunnelSimpleIcon size={15} />}
          rightIcon={<CaretDownIcon size={12} weight="bold" />}
        >
          {hidden > 0 ? `Filter · ${hidden}` : "Filter"}
        </Button>
        <Button
          variant="outline"
          size="icon-md"
          aria-label={hidden > 0 ? `Filter · ${hidden} hidden` : "Filter"}
          className="sm:hidden!"
        >
          <FunnelSimpleIcon size={16} />
        </Button>
      </span>
    </Popover>
  );
}
