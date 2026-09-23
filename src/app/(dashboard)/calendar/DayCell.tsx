"use client";

import { useState } from "react";
import { BottomSheet, Popover } from "@sarunyu/system-one";
import { CoinsIcon } from "@phosphor-icons/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DayPopoverContent } from "./DayPopoverContent";
import { useVisibleRows } from "./use-visible-rows";
import type { DayItem } from "./day-items";
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

/**
 * The same three weights in orange, for anything the backend raised rather than
 * the user wrote.
 *
 * A second hue rather than the coin glyph alone: at 11px inside a ~14px pill the
 * glyph is legible when you look for it and invisible when you're scanning a
 * month, which is the only time the grid is doing any work. Colour survives that
 * scan; a glyph doesn't.
 *
 * Still shaded by day relation, so the grid keeps saying two things at once —
 * hue for where a row came from, weight for how much attention the day is still
 * owed. Dropping to one flat orange would have traded one of those away.
 */
const ALERT_TONE: Record<DayRelation, string> = {
  past: "bg-[var(--fill-orange-100)] text-[var(--fill-orange-600)] opacity-60",
  today: "bg-[var(--fill-orange-500)] text-white",
  future: "bg-[var(--fill-orange-100)] text-[var(--fill-orange-700)]",
};

const ALERT_HOVER: Record<DayRelation, string> = {
  past: "hover:opacity-100 hover:bg-[var(--fill-orange-200)]!",
  today: "hover:bg-[var(--fill-orange-600)]!",
  future: "hover:bg-[var(--fill-orange-200)]!",
};

/** Done outranks the day: a ticked-off reminder is finished business whether it
 * was due yesterday or next week, so it drops out of the primary ramp entirely
 * rather than keeping a colour that still asks to be dealt with. */
const DONE_TONE = "bg-[var(--fill-gray-100)] text-subtle-text line-through";
const DONE_HOVER = "hover:bg-[var(--fill-gray-200)]!";

/** Sun–Sat. Columns 0–2 open their popover to the right, 3–6 to the left. */
const COLUMNS_PER_WEEK = 7;

export function DayCell({
  day,
  viewMonth,
  today,
  items,
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
  /** Everything on this day — notes and alerts alike, already sorted by the
   * caller. See `day-items`. */
  items: DayItem[];
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
  const pillTone = PILL_TONE[relation];
  const pillHover = PILL_HOVER[relation];
  const alertTone = ALERT_TONE[relation];
  const alertHover = ALERT_HOVER[relation];

  // How many rows the stack can show is a layout question, not a constant — see
  // `useVisibleRows`, which the Company Events grid on a stock shares.
  const { stackRef, rows } = useVisibleRows();

  // "+N more" occupies a row of its own, so it can only be afforded by giving up
  // a pill. When even one row is too many, everything folds into the counter.
  const capped = items.length > rows;
  const visible = capped ? items.slice(0, Math.max(0, rows - 1)) : items;
  const overflow = items.length - visible.length;

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
        className={`flex h-full min-h-0 flex-col gap-1 overflow-hidden p-1.5 text-left transition-colors cursor-pointer hover:bg-[rgba(0,0,0,0.045)]! ${
          columnIndex === COLUMNS_PER_WEEK - 1 ? "" : "border-r border-[rgba(0,0,0,0.12)]"
        } ${inMonth ? "bg-card" : "bg-[var(--bg-default-secondary)]/60"}`}
      >
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full type-caption font-semibold ${
            isToday
              ? "bg-primary-action text-white"
              : inMonth
                ? "text-foreground"
                : "text-muted-foreground/50"
          }`}
        >
          {day.getDate()}
        </span>
        <div ref={stackRef} className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
          {/* On a pointer device a pill goes straight to its note, and
              `stopPropagation` keeps that click off the cell behind it — landing
              on a day list you'd only have to click through is a wasted step
              when you already named the note you want.

              On a phone it is only a label. A pill is a ~14px-tall strip inside
              a ~50px cell, well under any thumb: aiming for the cell and hitting
              a pill, or the reverse, would be luck, and the two do different
              things. One target per cell, and the sheet it opens lists the same
              notes at a size worth tapping.

              An alert carries a glyph: colour here is spoken for by the day
              relation, and the grid still has to say at a glance that a day
              holds something the user didn't put there. */}
          {visible.map((item) => {
            const isAlert = item.source !== "note";
            const tone = item.done ? DONE_TONE : isAlert ? alertTone : pillTone;
            const hover = item.done ? DONE_HOVER : isAlert ? alertHover : pillHover;
            const glyph = isAlert ? (
              <CoinsIcon size={11} weight="fill" className="shrink-0" />
            ) : null;
            const shell = `flex shrink-0 items-center gap-1 rounded-[3px] px-1 py-0.5 type-caption leading-tight`;

            return isMobile ? (
              <span key={item.id} className={`${shell} ${tone}`} title={item.title}>
                {glyph}
                <span className="truncate">{item.title}</span>
              </span>
            ) : (
              <button
                key={item.id}
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
                  if (item.noteId) onOpenNote(item.noteId);
                  else onOpenAlert(item);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                title={item.title}
                /* `shrink-0`: a flex child that compresses would report a smaller
                   `offsetHeight` to the measurement above, which would then fit
                   more rows and compress it further. */
                className={`${shell} text-left cursor-pointer transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--fill-p1-600)] ${tone} ${hover}`}
              >
                {glyph}
                <span className="truncate">{item.title}</span>
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
