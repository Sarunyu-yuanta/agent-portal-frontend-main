"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { addDays, dayKey, WEEKDAY_LABELS } from "./calendar-grid";
import type { ReminderDay } from "./CalendarRemindersTab";
import { useIsoLayoutEffect } from "@/hooks/use-iso-layout-effect";

/** One cell's width. Fixed rather than content-sized so the strip keeps a
 *  rhythm — a two-digit day and a one-digit day must not shift the row.
 *
 *  Wide enough that the numbers are separated by space rather than by being
 *  read apart: at 44px twenty-six days fit across a laptop and the row read as
 *  a bar code. This fits about twenty, which is still three weeks of context. */
const CELL_W = 56;

/** How far an arrow moves the strip: one week. A fixed pixel amount would step
 *  by a different number of days on every screen, and the row is read in weeks
 *  — the same seven columns land under the same seven weekday labels after a
 *  press as before it. */
const PAGE = CELL_W * 7;

type Cell = {
  key: string;
  day: Date;
  /** The month's short name, on its first day and on the first cell of the
   *  strip — drawn as a divider standing before the cell, not as part of it.
   *  `null` on every other day. */
  month: string | null;
  /** Whether the timeline has a group for this day at all: what makes the cell
   *  clickable, and what its number's colour says. */
  has: boolean;
  /** Whether anything actually falls on it — what the dot says. Different from
   *  `has` on exactly one day: today keeps a block whether or not it has
   *  anything in it, and a dot under an empty today would be a lie. */
  hasRows: boolean;
  isToday: boolean;
  /** In the same Sunday-to-Saturday week as today — what the band is drawn
   *  behind. */
  inWeek: boolean;
};

/**
 * The run of days the timeline covers, as one scrollable row.
 *
 * The list below answers "what is on the 8th" once you have found the 8th. This
 * answers "where am I", which a list of headings cannot: three months of dates
 * scrolled past one screenful at a time gives no sense of position, and no way
 * to reach a day two weeks out except by scrolling to it.
 *
 * Every calendar day, not only the ones with rows. A strip that skipped the
 * empty days would put the 3rd next to the 9th and stop being a calendar — the
 * gaps are information, and the run of dates is what makes a date findable by
 * counting forward from the one you know.
 */
export function ReminderDayStrip({
  days,
  today,
  activeKey,
  centreKey,
  centreNonce,
  onSelect,
}: {
  /** The groups the timeline drew — what decides the span, and which cells are
   *  reachable. */
  days: ReminderDay[];
  today: Date;
  /** The day currently at the top of the timeline, from the parent's scrollspy. */
  activeKey: string | null;
  /** The day an explicit jump is heading for — see {@link centreNonce}. */
  centreKey: string;
  /**
   * Bumped by the parent whenever it sends the reader somewhere deliberately,
   * rather than the reader having scrolled there. The strip cannot tell the two
   * apart on its own: both arrive as `activeKey` changes.
   */
  centreNonce: number;
  onSelect: (key: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const cells = buildCells(days, today);

  /** Whether there is anything left to scroll to on each side — what decides
   *  if an arrow is there at all. An arrow that does nothing is worse than no
   *  arrow: it says there is more when there is not. */
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () =>
      setEdges({
        // A pixel of slack: a scroller at its end can sit a fraction short of
        // `scrollWidth` on a fractional device pixel ratio.
        left: el.scrollLeft > 1,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      });
    el.addEventListener("scroll", update, { passive: true });
    // Fires once on `observe`, which is what gives the arrows their first
    // state — rather than a `setState` in the effect body.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [cells.length]);

  const page = (direction: -1 | 1) =>
    scrollRef.current?.scrollBy({ left: direction * PAGE, behavior: "smooth" });

  /**
   * A deliberate jump is owed a centring, and is armed here until it arrives.
   *
   * It cannot be done when the button is pressed: that scrolls the timeline
   * *smoothly*, so the scrollspy walks `activeKey` through every day in
   * between, and centring the destination up front only for those steps to drag
   * the strip back off it again is how the day ended up at the edge. The flag
   * waits for the destination to actually become active.
   */
  const owedCentre = useRef(true);
  useEffect(() => {
    owedCentre.current = true;
  }, [centreNonce]);

  /**
   * Keep the marked day on screen.
   *
   * Runs on every change of `activeKey`, not once: the parent's scrollspy moves
   * it as the list scrolls, and a strip that stayed put would be pointing at a
   * day nobody can see.
   *
   * `nearest` for those, because they come a few days at a time and centring
   * would drag the whole strip under the reader on every scroll. `center` only
   * on arriving where a jump was aiming — on entry today is the 58th of
   * eighty-eight cells, and `nearest` parks it hard against an edge with two
   * months off-screen, which is the one moment the reader most wants to see
   * what is coming. Pressing "ไปยังวันปัจจุบัน" from far away wants the same
   * treatment for the same reason, and used to get `nearest` because the strip
   * had no way to tell that press apart from a scroll.
   */
  useIsoLayoutEffect(() => {
    const el = activeRef.current;
    if (!el) return;
    const centre = owedCentre.current && activeKey === centreKey;
    el.scrollIntoView({ block: "nearest", inline: centre ? "center" : "nearest" });
    if (centre) owedCentre.current = false;
  }, [activeKey, centreKey]);

  return (
    <div className="relative shrink-0 border-b border-border">
      {edges.left && <StripEdge side="left" onPage={() => page(-1)} />}
      {edges.right && <StripEdge side="right" onPage={() => page(1)} />}
      <div
        ref={scrollRef}
        // No vertical padding of its own: the cells carry it, so the week's
        // band reaches the strip's top and bottom edges instead of floating
        // inside them. Height is unchanged — the 12px moved into each cell.
        className="flex overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cells.map((cell) => {
          const isActive = cell.key === activeKey;
          return (
            <Fragment key={cell.key}>
              {cell.month && (
                <MonthDivider label={cell.month} inWeek={cell.inWeek} />
              )}
              <button
                ref={isActive ? activeRef : undefined}
                type="button"
                // Nothing on that day, so there is nowhere to send the reader. Left
                // in place and dimmed rather than removed: an empty Sunday is part
                // of the run you count along.
                disabled={!cell.has}
                aria-current={cell.isToday ? "date" : undefined}
                onClick={() => onSelect(cell.key)}
                // The visible cell is three characters of date; the month it sits
                // in is a divider beside it, which a screen reader is told to skip.
                aria-label={cell.day.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                style={{ width: CELL_W }}
                // Square, all of them. The band used to round its two ends, which
                // worked while it floated clear of the strip's edges; flush top
                // and bottom, the same radius clips the corners at exactly the
                // edges it is meant to reach. Hover follows, so a pointed-at day
                // is the same shape inside the band and out.
                className={`flex shrink-0 flex-col items-center gap-1.5 py-4 transition-colors ${
                  cell.inWeek ? "bg-[var(--fill-p1-100)]" : ""
                } ${
                  !cell.has
                    ? "cursor-default"
                    : cell.inWeek
                      ? // Grey over the band would take the highlight off the one
                        // cell being pointed at. One step along the same ramp.
                        "cursor-pointer hover:bg-[var(--fill-p1-200)]"
                      : "cursor-pointer hover:bg-[var(--fill-gray-100)]"
                }`}
              >
                <span className="text-meta leading-[20px] text-[var(--text-default-placeholder)]">
                  {WEEKDAY_LABELS[cell.day.getDay()]}
                </span>
                <span
                  className={`flex size-9 items-center justify-center rounded-full text-body tabular-nums transition-colors ${
                    cell.isToday
                      ? "bg-primary-action font-bold text-on-primary-action"
                      : isActive
                        ? "bg-[var(--fill-p1-200)] font-semibold text-[var(--fill-p1-700)]"
                        : cell.has
                          ? "text-foreground"
                          : "text-[var(--text-default-placeholder)]"
                  }`}
                >
                  {cell.day.getDate()}
                </span>
                {/* Which days have something on them. Kept in the layout when they
                do not, so every number sits on the same line. */}
                <span
                  className={`size-1 rounded-full ${
                    cell.hasRows ? "bg-primary-action" : "bg-transparent"
                  }`}
                />
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Where one month ends and the next begins: the month's name, turned on its
 * side, standing between the two days it divides.
 *
 * It was a line above the 1st before, which cost every cell in the strip a
 * reserved row so that three of eighty-eight could use it, and still read as
 * part of the 1st rather than as a break. Stood up between the days it divides,
 * it is the shape of the thing it means and costs the run nothing but its own
 * width.
 *
 * No rule beside it. The turned text is already a break in a row of upright
 * numbers, and a line would be a second mark saying the same thing in a strip
 * that sits inside a bordered card and under a bordered tab bar.
 *
 * `vertical-rl` turned 180° reads bottom-to-top, the direction a rotated label
 * beside a horizontal run is read in. `aria-hidden` because each day button
 * already names its own month in full.
 */
function MonthDivider({ label, inWeek }: { label: string; inWeek: boolean }) {
  return (
    <span
      aria-hidden
      // Padding, not margin, and it carries the band when the month turns
      // mid-week — which is exactly when it does, since the 1st lands wherever
      // it lands. On a margin the band would break into two around it.
      className={`flex shrink-0 items-center self-stretch px-1 ${
        inWeek ? "bg-[var(--fill-p1-100)]" : ""
      }`}
    >
      <span className="rotate-180 text-meta font-bold uppercase tracking-widest text-primary-action [writing-mode:vertical-rl]">
        {label}
      </span>
    </span>
  );
}

/**
 * Every day from the first group to the last, inclusive.
 *
 * Built off the groups rather than off `today` and a fixed span so the strip
 * and the list cannot disagree about where the timeline begins and ends — one
 * of them would eventually be changed without the other.
 */
function buildCells(days: ReminderDay[], today: Date): Cell[] {
  if (days.length === 0) return [];

  const withRows = new Set(
    days.filter((d) => d.items.length > 0).map((d) => d.key),
  );
  const reachable = new Set(days.map((d) => d.key));
  const todayKey = dayKey(today);

  // Sunday to Saturday, the week `WEEKDAY_LABELS` and the month grid are both
  // laid out in — a band running Monday to Sunday under a row that starts on
  // Sunday would cut across itself.
  const weekStart = addDays(today, -today.getDay());
  const weekEnd = addDays(weekStart, 6);

  const cells: Cell[] = [];
  const last = days[days.length - 1].day;
  for (
    let day = days[0].day;
    day.getTime() <= last.getTime();
    day = addDays(day, 1)
  ) {
    const key = dayKey(day);
    cells.push({
      key,
      day,
      // The first cell names its month too, even mid-month: it is where the
      // run starts, and a strip that opened on a bare "3" would not say of
      // what.
      month:
        day.getDate() === 1 || cells.length === 0
          ? day.toLocaleDateString("en-GB", { month: "short" })
          : null,
      // Today is always reachable — the timeline keeps a block for it even when
      // nothing falls on it, which is the one day worth jumping to empty.
      has: withRows.has(key) || reachable.has(key),
      hasRows: withRows.has(key),
      isToday: key === todayKey,
      inWeek: day >= weekStart && day <= weekEnd,
    });
  }
  return cells;
}

/**
 * One end of the strip when there is more beyond it: the days softening into
 * the edge, and the arrow that pages past them.
 *
 * The softening is `backdrop-blur` under a gradient mask rather than a gradient
 * of the card's own colour. The current week is painted behind these, and a
 * white-to-transparent wash would tear a pale hole in that band every time it
 * scrolled under an edge. A blur takes whatever is behind it and leaves its
 * colour alone, so the band fades out still blue; the thin `bg-card` wash on
 * top rides the same mask, lightening the edge a little rather than replacing
 * it.
 *
 * The fade is `pointer-events-none`, so the days under it stay clickable — a
 * day half under the blur is still a day, and the arrow is the only thing here
 * meant to be pressed.
 */
function StripEdge({
  side,
  onPage,
}: {
  side: "left" | "right";
  onPage: () => void;
}) {
  const isLeft = side === "left";
  return (
    <>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 z-[5] w-14 bg-card/50 backdrop-blur-[3px] ${
          isLeft
            ? "left-0 [mask-image:linear-gradient(to_right,black,transparent)]"
            : "right-0 [mask-image:linear-gradient(to_left,black,transparent)]"
        }`}
      />
      <button
        type="button"
        onClick={onPage}
        aria-label={isLeft ? "Earlier days" : "Later days"}
        className={`absolute top-1/2 z-10 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-[0px_2px_8px_rgba(0,0,0,0.12)] transition-colors hover:text-foreground ${
          isLeft ? "left-1" : "right-1"
        }`}
      >
        {isLeft ? (
          <CaretLeftIcon size={14} weight="bold" />
        ) : (
          <CaretRightIcon size={14} weight="bold" />
        )}
      </button>
    </>
  );
}
