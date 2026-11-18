"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { BottomSheet, Popover } from "@sarunyu/system-one";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DayPopoverContent } from "./DayPopoverContent";
import { useVisibleRows } from "./use-visible-rows";
import { splitDayItems, type ActionGroup, type DayItem } from "./day-items";
import type { MarketHoliday } from "./market-feed";
import {
  actionKindName,
  actionPalette,
  eventCategory,
  HOLIDAY_PALETTE,
  HolidayIcon,
} from "./market-taxonomy";
import {
  dayLabel,
  dayRelation,
  isSameMonth,
  WEEKS_SHOWN,
  type DayRelation,
} from "./calendar-grid";

/**
 * Pill fill by how the day reads against today — one primary ramp rather than
 * the red/amber/green urgency scale the note list uses.
 *
 * A month grid already says which day a reminder is on; colouring each pill by
 * that same fact in a second, unrelated palette makes the grid look busier
 * without adding anything. One hue in three weights instead says the only thing
 * the position doesn't: how much attention the day is still owed. Today is
 * solid and reads first, the days ahead are a light tint, and what's behind you
 * is washed out — present but no longer competing.
 *
 * **Notes only.** A corporate action and a desk event are coloured by their own
 * taxonomy (see `market-taxonomy`), which is a fact about what they are rather
 * than about when they are, and the two cannot share a hue channel. They keep
 * the "behind you" half of this idea through {@link PAST_FADE} and give up the
 * rest — which is the right trade, because an XD's code is the thing a reader
 * is scanning the month for and its distance from today is already the column
 * it is standing in.
 */
const PILL_TONE: Record<DayRelation, string> = {
  past: "bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)] opacity-60",
  today: "bg-primary-action text-white",
  future: "bg-[var(--fill-p1-200)] text-[var(--fill-p1-700)]",
};

/**
 * Kept apart from the fill above so only the clickable pill takes it.
 *
 * Tailwind already gates `hover:` behind `@media (hover: hover)`, so a phone
 * never sees these. The case this is actually for is a touch laptop or a
 * narrowed desktop window: under 768px the pill is a plain `<span>` with nothing
 * to click, and a hover response on something inert is a promise the UI can't
 * keep.
 */
const PILL_HOVER: Record<DayRelation, string> = {
  past: "hover:opacity-100 hover:bg-[var(--fill-p1-200)]!",
  today: "hover:bg-[var(--primary-action-hover)]!",
  future: "hover:bg-[var(--fill-p1-300)]!",
};

/** What is left of the relation ramp for a pill whose hue is spoken for. A day
 *  already gone is still worth drawing — an X-date last week explains a price
 *  gap — but it has stopped asking for anything. */
const PAST_FADE = "opacity-55 hover:opacity-100";

/** Done outranks the day: a ticked-off reminder is finished business whether it
 * was due yesterday or next week, so it drops out of the primary ramp entirely
 * rather than keeping a colour that still asks to be dealt with. */
const DONE_TONE = "bg-[var(--fill-gray-100)] text-subtle-text line-through";
const DONE_HOVER = "hover:bg-[var(--fill-gray-200)]!";

/** Sun–Sat. Columns 0–2 open their popover to the right, 3–6 to the left. */
const COLUMNS_PER_WEEK = 7;

/** Shared pill geometry. Every row in the stack has to report the same height
 *  to `useVisibleRows`, which measures the first one and divides. */
const PILL_SHELL =
  "flex shrink-0 items-center gap-1 overflow-hidden rounded-[3px] px-1 py-0.5 type-caption leading-tight";

/** One line of the stack: a whole group of corporate actions, or a single row. */
type CellRow =
  | { type: "group"; key: string; group: ActionGroup }
  | { type: "item"; key: string; item: DayItem };

export function DayCell({
  day,
  viewMonth,
  today,
  items,
  holiday,
  clients,
  onOpenNote,
  onOpenAlert,
  onNewReminder,
  columnIndex,
  rowIndex,
}: {
  day: Date;
  /** The month currently being viewed — days outside it render muted. */
  viewMonth: Date;
  today: Date;
  /** Everything on this day — corporate actions, desk events and the user's own
   * reminders alike, already sorted by the caller. See `day-items`. */
  items: DayItem[];
  /** The market closure on this day, if any. A property of the day rather than
   *  a row in it — see the note on `DayItemSource`. */
  holiday?: MarketHoliday | null;
  clients: { id: string; name: string }[];
  onOpenNote: (noteId: string) => void;
  /** A row with no note behind it — the caller opens its own read-only panel. */
  onOpenAlert: (item: DayItem) => void;
  onNewReminder: (day: Date) => void;
  /** Sun = 0 … Sat = 6. Decides which side the popover opens on, and whether the
   * right-hand rule is drawn (Saturday's would double up with the card border). */
  columnIndex: number;
  /** Week 0 … 5. Decides which of the cell's edges the popover aligns to. */
  rowIndex: number;
}) {
  const [open, setOpen] = useState(false);
  // The same breakpoint the Notes split view drills in at, so "phone" means one
  // thing across the app.
  const isMobile = useMediaQuery("(max-width: 767px)");
  const inMonth = isSameMonth(day, viewMonth);
  // Every note in a cell falls on the same day, so the tone is a property of the
  // cell — resolved once here rather than per pill.
  const relation = dayRelation(day, today);
  const isToday = relation === "today";
  const isPast = relation === "past";
  /** Saturday and Sunday sit on a grey ground, so the working week reads as
   *  the five white columns between them — in every week on screen, including
   *  the leading and trailing days, whose dates fade but whose ground does not. */
  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
  const pillTone = PILL_TONE[relation];
  const pillHover = PILL_HOVER[relation];

  // Corporate actions collapse into one pill per kind, for the reason
  // `ActionGroupCard` spells out: the exchange publishes per security, and a
  // cell with room for three lines cannot spend six of them on the word "XD".
  const { actionGroups, others } = splitDayItems(items);
  const cellRows: CellRow[] = [
    ...actionGroups.map((group) => ({ type: "group" as const, key: `g:${group.kind}`, group })),
    ...others.map((item) => ({ type: "item" as const, key: item.id, item })),
  ];

  // How many rows the stack can show is a layout question, not a constant — see
  // `useVisibleRows`, which the Company Events grid on a stock shares.
  const { stackRef, rows } = useVisibleRows();

  // A closure takes no row: it is marked by the cell's tint and an icon beside
  // the date, so every row goes to the pills.
  const budget = rows;
  // "+N more" occupies a row of its own, so it can only be afforded by giving up
  // a pill. When even one row is too many, everything folds into the counter.
  const capped = cellRows.length > budget;
  const visible = capped ? cellRows.slice(0, Math.max(0, budget - 1)) : cellRows;
  const overflow = cellRows.length - visible.length;

  // Open away from the nearer edge of the week: the left half points right, the
  // right half points left. Decided from the column rather than left to Radix's
  // collision flip, so the panel never covers the cell it belongs to and a given
  // column always behaves the same way — collision handling only kicks in once
  // the layout is genuinely too narrow for the chosen side.
  const side = columnIndex >= COLUMNS_PER_WEEK / 2 ? "left" : "right";

  // The vertical half of the same idea, but only the two outer weeks need to
  // pick an edge. A panel centred on its cell reads as belonging to it more
  // clearly than one hanging off a corner, and everywhere except the first and
  // last row there is room above and below to centre into. The top row can only
  // grow down and the bottom row can only grow up, so those two anchor to the
  // edge they have room from — otherwise the panel runs off the calendar and
  // Radix shunts it back to somewhere unrelated to the cell that opened it.
  const align =
    rowIndex === 0 ? "start" : rowIndex === WEEKS_SHOWN - 1 ? "end" : "center";

  /**
   * The same list either way; only the shell around it changes.
   *
   * Both hand-offs close the panel first. The modal they open is portalled at
   * the same `z-50` and mounts after it, so a panel left open paints over the
   * modal's backdrop and sits on top of the note being edited. Closing is also
   * just what the panel is for — it hands off to the editing surface and is
   * done.
   */
  const dayContent = (dismiss: () => void) => (
    <DayPopoverContent
      day={day}
      items={items}
      clients={clients}
      relation={relation}
      holiday={holiday}
      variant={isMobile ? "sheet" : "popover"}
      onOpenNote={(noteId) => {
        dismiss();
        onOpenNote(noteId);
      }}
      onOpenAlert={(alertItem) => {
        dismiss();
        onOpenAlert(alertItem);
      }}
      onNewReminder={() => {
        dismiss();
        onNewReminder(day);
      }}
    />
  );

  /**
   * One stack row's contents and fill, before it is wrapped in a button or a
   * span.
   *
   * `onOpen` is what splits the two. A single row names one record and goes
   * straight to it; a group names a kind and several, so it can only open the
   * day — which is the cell's own job, and the reason a group pill hands back
   * `undefined` rather than a target of its own.
   */
  const rowContent = (row: CellRow): {
    body: ReactNode;
    title: string;
    /** Absent when the row has no single target of its own. */
    onOpen?: () => void;
    className?: string;
    style?: CSSProperties;
  } => {
    if (row.type === "group") {
      const palette = actionPalette(row.group.kind);
      const symbols = row.group.items.map((item) => item.symbol);
      return {
        // Border, not a second fill: at 14px a left bar in the saturated hue is
        // the only part of the card's styling that survives the shrink, and it
        // is what ties a pill here to its card in the day panel.
        style: {
          backgroundColor: palette.tint,
          color: palette.text,
          borderLeft: `2px solid ${palette.accent}`,
        },
        title: `${actionKindName(row.group.kind)} · ${symbols.join(", ")}`,
        onOpen: undefined,
        body: (
          <>
            <span className="shrink-0 font-semibold">{row.group.kind}</span>
            <span className="truncate">{symbols.join(", ")}</span>
            {/* Outside the truncation, so a day with nine XDs still says nine
                even when the cell can only print the first two symbols. */}
            {symbols.length > 1 && (
              <span className="ml-auto shrink-0 font-semibold tabular-nums">
                {symbols.length}
              </span>
            )}
          </>
        ),
      };
    }

    const { item } = row;
    if (item.source === "event") {
      const category = eventCategory(item.kind);
      return {
        style: { backgroundColor: category.tint, color: category.text },
        title: `${category.label} · ${item.title}`,
        onOpen: () => onOpenAlert(item),
        body: (
          <>
            <span className="flex shrink-0 items-center [&>svg]:size-3">{category.icon}</span>
            <span className="truncate">{item.title}</span>
          </>
        ),
      };
    }

    return {
      className: item.done ? `${DONE_TONE} ${DONE_HOVER}` : `${pillTone} ${pillHover}`,
      title: item.title,
      onOpen: item.noteId ? () => onOpenNote(item.noteId!) : () => onOpenAlert(item),
      body: <span className="truncate">{item.title}</span>,
    };
  };

  return (
    <>
    {/* The `Popover` wrapper stays mounted on a phone even though it never
        opens there. Dropping it would change the trigger's markup between the
        server render (which can't know the viewport) and the client, since
        Radix's `asChild` trigger writes its own attributes onto this div —
        holding it open at `false` keeps one DOM for both. */}
    <Popover
      open={!isMobile && open}
      onOpenChange={setOpen}
      side={side}
      align={align}
      sideOffset={8}
      // `p-0`: the content lays out its own header/list/footer sections and
      // wants their rules and hover fills to reach the bubble's edges, which the
      // component's default `p-3` would inset. `overflow-hidden` keeps the first
      // and last of those from squaring off the bubble's rounded corners.
      className="p-0 overflow-hidden shadow-lg"
      // The popover has no exit animation to protect, so it dismisses by
      // flipping `open` directly.
      content={!isMobile && open ? dayContent(() => setOpen(false)) : null}
    >
      {/* `border-[rgba(0,0,0,0.12)]` rather than `border-border`: the same
          10%-black-opacity-reads-as-invisible issue `globals.css` already
          documents for `system-one`'s `<Table>` (~2-3% perceived contrast on
          a white cell). Not much darker than that 10%, though — a whole grid
          of these compounds, and a value that reads as a crisp single line in
          isolation reads as a heavy one repeated across 7 columns × 6 rows.

          Hover is the same story: `hover:bg-[var(--bg-default-secondary)]`
          (the token every other hover state in the app uses) loses the
          cascade fight against this cell's own `bg-card` here — `system-one`'s
          stylesheet loads after `globals.css` and apparently isn't layered the
          same way, so its `bg-card` outranks an app-level `hover:` variant
          regardless of specificity. The trailing `!` is this repo's existing
          fix for exactly that (see `SELECTED_TITLE` in `NotesSidebarList.tsx`),
          and an explicit colour sidesteps the token entirely rather than
          fighting to make the reference win too. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setOpen(true);
        }}
        /* Today gets a light step of the primary ramp behind the whole
           cell, not just the circled number — a filled 24px disc is easy to
           miss in a grid this dense. Only while today is in the month on
           screen: paged away it lands in the leading or trailing band, whose
           whole job is to recede, and a tinted cell there would pull harder
           than the in-month days around it. The circled number still marks it
           there.

           The `!` on both hovers is this repo's standing cascade fix — see the
           note above about `bg-card` outranking an app-level `hover:`. */
        className={`flex h-full min-h-0 flex-col gap-1 overflow-hidden p-1.5 text-left transition-colors cursor-pointer ${
          columnIndex === COLUMNS_PER_WEEK - 1 ? "" : "border-r border-[rgba(0,0,0,0.12)]"
        } ${
          isToday && inMonth
            ? "bg-[var(--fill-p1-200)] hover:bg-[var(--fill-p1-300)]!"
            : `${
                // A market closure tints the whole cell; its strip goes a shade
                // deeper (below) so it still reads on top of it. Ahead
                // of the weekend grey: a closure is the rarer, louder fact.
                holiday
                  ? inMonth
                    ? "bg-[var(--fill-rose-100)]"
                    : "bg-[var(--fill-rose-100)]/60"
                  : // Weekends keep their grey in the leading and trailing weeks
                    // too, so the columns read straight down the grid; only the
                    // date fades there.
                    isWeekend
                    ? "bg-[var(--fill-gray-100)]"
                    : !inMonth
                      ? "bg-[var(--bg-default-secondary)]/60"
                      : "bg-card"
              } hover:bg-[rgba(0,0,0,0.045)]!`
        }`}
      >
        {/* The date itself carries the closure as well as the strip below it.
            Scanning a month for "which days is the market shut" is a glance at
            the numbers, not a read of every cell, and a rose date answers it
            without the reader entering the cell at all. Today still outranks
            it: there is only ever one of those. */}
        {/* The date, and in the top-right corner the closure's mark when the
            market is shut.
            An icon rather than a strip: the cell's tint already says "closed",
            and a strip spent one of the few rows a cell has on saying it again.
            The name is in the tooltip and in the day's popover. */}
        <div className="flex shrink-0 items-center justify-between gap-1">
          <span
            className={`flex size-6 shrink-0 items-center justify-center rounded-full type-caption font-semibold ${
              isToday
                ? "bg-primary-action text-white"
                : inMonth
                  ? "text-foreground"
                  : "text-muted-foreground/50"
            }`}
            style={
              !isToday && holiday
                ? { color: HOLIDAY_PALETTE.text, opacity: inMonth ? 1 : 0.5 }
                : undefined
            }
          >
            {day.getDate()}
          </span>
          {holiday && (
            <span
              role="img"
              aria-label={`${holiday.name} · ${holiday.market} closed`}
              title={`${holiday.name} · ${holiday.market} closed`}
              className="flex shrink-0"
              // `-800`: a step darker than the date beside it, so the mark
              // holds its own on the rose cell rather than melting into it.
              // Not faded outside the month, unlike the date: a closure on a
              // leading or trailing day is still worth seeing at a glance.
              style={{ color: "var(--fill-rose-800)" }}
            >
              <HolidayIcon size={16} weight="fill" />
            </span>
          )}
        </div>
        <div ref={stackRef} className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
          {/* On a pointer device a pill goes straight to what it names, and
              `stopPropagation` keeps that click off the cell behind it — landing
              on a day list you'd only have to click through is a wasted step
              when you already named the thing you want. A group pill is the one
              exception: it names several, so it opens the day like the cell
              does.

              On a phone every pill is only a label. A pill is a ~14px-tall strip
              inside a ~50px cell, well under any thumb: aiming for the cell and
              hitting a pill, or the reverse, would be luck, and the two do
              different things. One target per cell, and the sheet it opens lists
              the same rows at a size worth tapping. */}
          {visible.map((row) => {
            const { body, title, onOpen, className, style } = rowContent(row);
            // A note's own tone already carries the relation ramp; everything
            // else spends its hue on taxonomy and only borrows the fade.
            const isNote = row.type === "item" && row.item.source === "note";
            const shell = `${PILL_SHELL} ${className ?? ""} ${
              !isNote && isPast ? PAST_FADE : ""
            }`;

            if (isMobile || !onOpen) {
              return (
                <span key={row.key} className={shell} style={style} title={title}>
                  {body}
                </span>
              );
            }

            return (
              <button
                key={row.key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  // Close this cell's own popover before handing off. It may
                  // well be open — a pill is inside the trigger, so Radix
                  // neither treats the click as "outside" nor lets its trigger
                  // handler see it through the `stopPropagation` above. Left
                  // alone the popover stays up beside the panel that just
                  // opened, which is two answers to one click.
                  setOpen(false);
                  onOpen();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                title={title}
                style={style}
                /* `shrink-0` (in `PILL_SHELL`): a flex child that compresses
                   would report a smaller `offsetHeight` to the measurement
                   above, which would then fit more rows and compress it
                   further. */
                className={`${shell} text-left cursor-pointer transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--fill-p1-600)] ${
                  style ? "hover:brightness-95" : ""
                }`}
              >
                {body}
              </button>
            );
          })}
          {/* Sits in the pill stack, so it takes the pills' geometry and hover —
              a plain grey line among three tinted buttons reads as a caption
              rather than the thing that reveals the rest. On a pointer device it
              opens the panel itself rather than letting the click reach the
              cell: same result, but it doesn't depend on the trigger behind it
              to be the target. On a phone it goes back to being a caption, since
              the cell around it already does exactly this. */}
          {overflow > 0 &&
            (isMobile ? (
              <span className="shrink-0 truncate px-1 py-0.5 type-caption leading-tight font-medium text-muted-foreground">
                +{overflow} more
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(true);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="shrink-0 truncate rounded-[3px] px-1 py-0.5 type-caption leading-tight text-left font-medium text-muted-foreground cursor-pointer transition-colors hover:bg-[var(--fill-gray-200)]! hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--fill-blue-500)]"
              >
                +{overflow} more
              </button>
            ))}
        </div>
      </div>
    </Popover>

    {/* Mounted for the whole time the viewport is a phone, not only while open:
        `BottomSheet` is a vaul drawer and plays its own slide-out off the `open`
        prop, so unmounting on close would cut the animation. It renders nothing
        until first opened.

        `px-0 pb-0` rather than the sheet's own `px-4 pb-6` — the day list draws
        full-bleed section rules and row hovers, and the footer already sets its
        own bottom padding around the home indicator. `flex min-h-0 flex-col` on
        the content is what lets the list scroll: the sheet caps itself at 80vh,
        and a long day only stays inside that cap if the box between the two can
        shrink. No header, because the content leads with its own date and
        weekday — the design system's would be a second title above it. */}
    {isMobile && (
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        showHeader={false}
        // Not rendered — it goes to the drawer's `sr-only` title, which vaul
        // requires and screen readers announce on open.
        title={dayLabel(day)}
        className="px-0 pb-0"
        contentClassName="flex min-h-0 flex-col pt-0"
      >
        {dayContent(() => setOpen(false))}
      </BottomSheet>
    )}
    </>
  );
}
