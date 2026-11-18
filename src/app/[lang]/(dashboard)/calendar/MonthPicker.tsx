"use client";

import { useState } from "react";
import { BottomSheet, Popover } from "@sarunyu/system-one";
import { CaretDownIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { monthLabel } from "./calendar-grid";

/** Built from a fixed date so the list is the same on the server and the client
 * — a locale month name is otherwise the kind of thing that hydrates twice. */
const MONTH_NAMES = Array.from({ length: 12 }, (_, month) =>
  new Date(2000, month, 1).toLocaleDateString("en-GB", { month: "short" }),
);

/**
 * The month label, as a control rather than a heading: reading it tells you
 * where you are, clicking it takes you somewhere.
 *
 * Stepping with ‹ › is fine for next month and unusable for next March — twelve
 * clicks, each one a re-render you have to watch go by. The two coexist because
 * they answer different questions, which is why this replaces the label and not
 * the arrows.
 */
export function MonthPicker({
  value,
  today,
  onSelect,
}: {
  /** The month on screen — the first of it, as `CalendarView` holds it. */
  value: Date;
  today: Date;
  onSelect: (month: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  // The year being browsed, which is not the year being viewed: paging to 2027
  // to look around should not move the calendar until a month is actually
  // picked. Reset on open so it never opens somewhere you left it months ago.
  const [year, setYear] = useState(value.getFullYear());

  const handleOpenChange = (next: boolean) => {
    if (next) setYear(value.getFullYear());
    setOpen(next);
  };

  /** Same grid either way; the sheet takes the width it is given and trades it
   * for taller months, since on a phone each one is a thumb target. */
  const panel = (dismiss: () => void) => (
    <div className={isMobile ? "w-full" : "w-60"}>
      <div
        className={`flex items-center justify-between gap-2 border-b border-border/60 px-2 ${
          isMobile ? "py-2" : "py-1.5"
        }`}
      >
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          aria-label="Previous year"
          className={`flex items-center justify-center rounded-lg text-muted-foreground transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]! hover:text-foreground ${
            isMobile ? "size-9" : "size-7"
          }`}
        >
          <CaretLeftIcon size={isMobile ? 16 : 14} />
        </button>
        <span className="type-body-2 font-semibold text-foreground tabular-nums">{year}</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          aria-label="Next year"
          className={`flex items-center justify-center rounded-lg text-muted-foreground transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]! hover:text-foreground ${
            isMobile ? "size-9" : "size-7"
          }`}
        >
          <CaretRightIcon size={isMobile ? 16 : 14} />
        </button>
      </div>

      <div
        className={`grid grid-cols-3 gap-1 ${
          // Bottom padding clears the home indicator on a gesture-navigation
          // phone, where the last few pixels aren't reliably tappable.
          isMobile ? "p-3 pb-[max(1rem,env(safe-area-inset-bottom))]" : "p-2"
        }`}
      >
        {MONTH_NAMES.map((name, month) => {
          const selected = month === value.getMonth() && year === value.getFullYear();
          // Marked even when it is not the selection, so "where is now" stays
          // answerable while browsing another year.
          const isThisMonth = month === today.getMonth() && year === today.getFullYear();

          return (
            <button
              key={name}
              type="button"
              onClick={() => {
                onSelect(new Date(year, month, 1));
                dismiss();
              }}
              className={`rounded-lg type-body-2 transition-colors cursor-pointer ${
                isMobile ? "py-3" : "py-1.5"
              } ${
                selected
                  ? "bg-primary-action text-white font-medium hover:bg-[var(--primary-action-hover)]!"
                  : isThisMonth
                    ? "text-primary-action font-medium hover:bg-[var(--bg-default-secondary)]!"
                    : "text-foreground hover:bg-[var(--bg-default-secondary)]!"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
    {/* Kept mounted on a phone even though it never opens there, for the reason
        `DayCell` documents: Radix's `asChild` trigger writes attributes onto the
        button below, and dropping the wrapper on the client only would leave the
        server's markup disagreeing with it. */}
    <Popover
      open={!isMobile && open}
      onOpenChange={handleOpenChange}
      side="bottom"
      align="start"
      sideOffset={6}
      className="p-0 overflow-hidden shadow-lg"
      content={!isMobile && open ? panel(() => setOpen(false)) : null}
    >
      <button
        type="button"
        aria-label="Change month"
        // On a phone the Popover isn't listening, so the trigger opens the sheet
        // itself. Reset the browsed year here too — `handleOpenChange` is the
        // Popover's callback and never fires on that path.
        onClick={isMobile ? () => handleOpenChange(true) : undefined}
        className="flex min-w-0 items-center gap-1 rounded-lg px-1.5 py-1 transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]!"
      >
        <span className="type-body-1 font-semibold text-foreground truncate">
          {monthLabel(value)}
        </span>
        <CaretDownIcon
          size={13}
          className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
    </Popover>

    {/* See `DayCell` for why this is mounted rather than gated on `open`, and
        why the sheet's own padding is turned off — the grid sets its own, and
        its bottom edge already clears the home indicator. */}
    {isMobile && (
      <BottomSheet
        open={open}
        onOpenChange={handleOpenChange}
        showHeader={false}
        title="Change month"
        className="px-0 pb-0"
        contentClassName="pt-0"
      >
        {panel(() => setOpen(false))}
      </BottomSheet>
    )}
    </>
  );
}
