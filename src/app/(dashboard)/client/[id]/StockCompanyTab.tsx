"use client";

import { useMemo, useState } from "react";
import { Button, Checkbox, Chip, Popover, Tooltip } from "@sarunyu/system-one";
import {
  CalendarBlankIcon,
  CalendarDotIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ClipboardTextIcon,
  GearSixIcon,
  MapPinIcon,
  TicketIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { MonthPicker } from "../../calendar/MonthPicker";
import {
  addMonths,
  dayKey,
  dayLabel,
  isSameMonth,
  monthGrid,
  weeksOf,
} from "../../calendar/calendar-grid";
import {
  COMPANY_SUB_TABS,
  getStockCompanyEvents,
  type CompanySubTab,
  type CorporateActionKind,
  type CorporateCalendarMarker,
  type CorporateDayEvent,
} from "./stock-company-data";

const WEEKDAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const MARKER_STYLE: Record<
  CorporateActionKind | "event",
  { bar: string; text: string; legend: string }
> = {
  XT: { bar: "#fee6c9", text: "#8d3a01", legend: "#eb6101" },
  XW: { bar: "#ccecf7", text: "#006182", legend: "#00a2d9" },
  XD: { bar: "#daebdd", text: "#3b7448", legend: "#3b7448" },
  event: { bar: "transparent", text: "rgba(0,0,0,0.85)", legend: "#0a6ee7" },
};

/** The gear dropdown's checklist (Figma node 27745:78796) offers the whole SET
 *  corporate-action taxonomy, not just the three the mock feed emits today.
 *  Kept verbatim so the control is already right when the feed sends the rest;
 *  unchecking a kind with no markers is simply a no-op. */
const ACTION_FILTER_KINDS = [
  "XP",
  "XR",
  "XD",
  "XW",
  "XT",
  "XM",
  "XI",
  "XN",
  "XA",
  "XB",
  "XE",
] as const;

const ACTION_HEADER: Record<CorporateActionKind, string> = {
  XT: "#fee6c9",
  XW: "#dbeafe",
  XD: "#daebdd",
};

function CompanySubTabPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center py-10 text-sm text-[#6a7282]">
      {label} will be available soon.
    </div>
  );
}

function CalendarMarker({ marker }: { marker: CorporateCalendarMarker }) {
  if (marker.kind === "event") {
    return (
      <div className="flex h-3.5 w-full items-center gap-0.5 overflow-hidden rounded-sm">
        <span className="size-2 shrink-0 rounded-full bg-[#0a6ee7]" aria-hidden />
        <span className="truncate text-[9px] leading-[14px] text-[rgba(0,0,0,0.85)]">Event</span>
      </div>
    );
  }

  const style = MARKER_STYLE[marker.kind];
  return (
    <div
      className={`flex h-3.5 w-full items-center overflow-hidden rounded-sm px-1 ${marker.muted ? "opacity-40" : ""}`}
      style={{ backgroundColor: style.bar }}
    >
      <span className="truncate text-[9px] leading-[14px]" style={{ color: style.text }}>
        {marker.label}
      </span>
    </div>
  );
}

function CalendarLegend() {
  const items: { key: CorporateActionKind | "event"; label: string }[] = [
    { key: "XT", label: "XT" },
    { key: "XW", label: "XW" },
    { key: "XD", label: "XD" },
    { key: "event", label: "Event" },
  ];

  return (
    <div className="flex h-10 w-full items-center gap-2 px-4">
      {items.map(({ key, label }) => (
        <div
          key={key}
          className={`flex items-center rounded border border-black/10 bg-white py-1 pl-2 pr-3 ${
            // Figma node 6435:26713 — the swatch tags carry a 12px gap, the
            // Event tag only 4px, because its dot reads as part of the word.
            key === "event" ? "gap-1" : "gap-3"
          }`}
        >
          {key === "event" ? (
            <span className="size-3 shrink-0 rounded-full bg-[#0a6ee7]" aria-hidden />
          ) : (
            // A 2px rule turned on its side and stretched to the tag's height
            // (Figma rotates the same Line component 90°), not a dash.
            <span
              className="w-0.5 shrink-0 self-stretch"
              style={{ backgroundColor: MARKER_STYLE[key].legend }}
              aria-hidden
            />
          )}
          <span className="text-xs leading-4 text-[rgba(0,0,0,0.85)]">{label}</span>
        </div>
      ))}
    </div>
  );
}

function CompanyEventsCalendar({
  symbol,
  selectedKey,
  onSelectDay,
}: {
  symbol: string;
  selectedKey: string;
  onSelectDay: (key: string) => void;
}) {
  const data = useMemo(() => getStockCompanyEvents(symbol), [symbol]);
  const today = useMemo(() => new Date(2026, 3, 30), []);
  const [viewDate, setViewDate] = useState(
    () => new Date(data.initialMonth.year, data.initialMonth.month, 1),
  );

  const days = useMemo(() => monthGrid(viewDate), [viewDate]);
  const weeks = useMemo(() => {
    const all = weeksOf(days);
    // `monthGrid` always pads to a fixed six rows. A month that finishes inside
    // five — April 2026 ends Thu the 30th — leaves a trailing row with no
    // in-month day at all, which Figma doesn't show. Trim it here rather than
    // in the shared helper: the main Calendar page wants that fixed height.
    let last = all.length;
    while (last > 1 && !all[last - 1].some((d) => isSameMonth(d, viewDate))) last -= 1;
    return all.slice(0, last);
  }, [days, viewDate]);

  const goToToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDay(dayKey(today));
  };

  /** Stored as the hidden set, not the shown one, so every kind the feed grows
   *  later starts visible without anyone remembering to opt it in. */
  const [hiddenKinds, setHiddenKinds] = useState<ReadonlySet<string>>(() => new Set());
  const toggleKind = (kind: string, next: boolean) =>
    setHiddenKinds((current) => {
      const updated = new Set(current);
      if (next) updated.delete(kind);
      else updated.add(kind);
      return updated;
    });

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex w-full items-center justify-between gap-2">
        {/* Same three groups, same order, same chrome as the Calendar page's
            toolbar (`CalendarView`): Today, the two arrows, then the month they
            read out. Copied deliberately — this is the second calendar in the
            app and a second dialect of the same control would read as a
            different widget. `!` on the responsive gap for the reason that file
            documents: `@sarunyu/system-one` ships a plain `.gap-1` and loads
            after `globals.css`, so it wins the tie against a Tailwind variant. */}
        <div className="flex min-w-0 flex-1 items-center gap-1 max-sm:gap-2.5!">
          <Tooltip content={`Go to today · ${dayLabel(today)}`} side="bottom">
            <Button
              variant="plain"
              size="sm"
              className="shrink-0"
              leftIcon={<CalendarDotIcon size={15} />}
              onClick={goToToday}
            >
              Today
            </Button>
          </Tooltip>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setViewDate((d) => addMonths(d, -1))}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[var(--bg-default-secondary)] hover:text-foreground"
            >
              <CaretLeftIcon size={16} />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewDate((d) => addMonths(d, 1))}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[var(--bg-default-secondary)] hover:text-foreground"
            >
              <CaretRightIcon size={16} />
            </button>
          </div>
          <div className="min-w-0">
            <MonthPicker value={viewDate} today={today} onSelect={setViewDate} />
          </div>
        </div>
        {/* Figma pairs this with a by-calendar/by-list switch; that control was
            dropped on request, so the gear stands alone. Sized 32px to match
            the arrows opposite it rather than Figma's 34px, which would make it
            the one odd height in the bar. */}
        <div className="flex shrink-0 items-center gap-2">
          <Popover
            align="end"
            content={
              <div className="flex max-h-[320px] w-[128px] flex-col gap-2 overflow-y-auto p-1">
                {ACTION_FILTER_KINDS.map((kind) => {
                  const shown = !hiddenKinds.has(kind);
                  return (
                    <Checkbox
                      key={kind}
                      checked={shown}
                      onChange={(next) => toggleKind(kind, next)}
                      label={
                        <span
                          className={`text-sm leading-5 ${shown ? "text-[#0a6ee7]" : "text-[rgba(0,0,0,0.35)]"}`}
                        >
                          {kind}
                        </span>
                      }
                    />
                  );
                })}
              </div>
            }
          >
            <button
              type="button"
              aria-label="Filter corporate actions"
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-black/10 text-[#4a5565] transition-colors hover:bg-[var(--bg-default-secondary)]"
            >
              <GearSixIcon size={18} />
            </button>
          </Popover>
        </div>
      </div>

      {/* No frame: Figma builds the grid out of horizontal rules alone — the
          weekday underline plus one per week — with nothing boxing it in. */}
      <div className="flex w-full flex-col">
        <div className="grid grid-cols-7 border-b-2 border-black/10 pb-1">
          {WEEKDAY_SHORT.map((label) => (
            <div
              key={label}
              className="flex h-7 items-center justify-center text-xs leading-4 text-[rgba(0,0,0,0.85)]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex min-h-[442px] flex-col">
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              // `py-1` on the row as well as the cells: Figma pads the Week and
              // the Block separately (4px each), which is what keeps a day's
              // chips clear of the rules above and below it.
              className="grid min-h-0 flex-1 grid-cols-7 border-b border-black/10 py-1"
            >
              {week.map((day) => {
                const key = dayKey(day);
                const inMonth = isSameMonth(day, viewDate);
                const selected = key === selectedKey;
                // "Event" markers aren't corporate actions, so the gear's
                // taxonomy filter never applies to them.
                const markers = (data.markersByDay[key] ?? []).filter(
                  (marker) => marker.kind === "event" || !hiddenKinds.has(marker.kind),
                );

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelectDay(key)}
                    className={`flex min-h-[72px] flex-col items-center gap-1 px-0.5 py-1 text-left transition-colors ${
                      selected ? "rounded bg-[#f3f8fe]" : "hover:bg-black/[0.02]"
                    }`}
                  >
                    <span
                      className={`flex size-4 items-center justify-center rounded-full text-[9px] leading-[14px] ${
                        selected
                          ? "bg-[#0a6ee7] text-white"
                          : inMonth
                            ? "text-[rgba(0,0,0,0.85)]"
                            : "text-black/35"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <div className="flex w-full flex-col gap-0.5">
                      {markers.map((marker, index) => (
                        <CalendarMarker key={`${key}-${index}`} marker={marker} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* A sibling of the grid, not a footer inside it — the 16px the column
          gap already provides is the separation Figma shows. */}
      <CalendarLegend />
    </div>
  );
}

function CorporateActionCard({
  action,
  symbol,
}: {
  action: CorporateActionKind;
  symbol: string;
}) {
  return (
    <div className="w-full overflow-hidden rounded-lg shadow-[0px_0px_1px_rgba(102,102,102,0.16),0px_4px_4px_rgba(102,102,102,0.12)]">
      <div className="px-3 py-2" style={{ backgroundColor: ACTION_HEADER[action] }}>
        <p className="text-sm font-bold leading-5 text-[rgba(0,0,0,0.85)]">{action}</p>
      </div>
      <div className="bg-white px-3 py-4">
        <span
          className="inline-flex rounded px-2 py-0.5 text-sm leading-5"
          style={{ backgroundColor: MARKER_STYLE[action].bar, color: MARKER_STYLE[action].text }}
        >
          {symbol}
        </span>
      </div>
    </div>
  );
}

function MeetingEventCard({ event }: { event: Extract<CorporateDayEvent, { type: "meeting" }> }) {
  const seatPct = Math.round((event.seatsTaken / event.seatsTotal) * 100);

  return (
    <div className="w-full overflow-hidden rounded-lg bg-white shadow-[0px_0px_2px_rgba(102,102,102,0.16),0px_4px_8px_rgba(102,102,102,0.12)]">
      <div className="flex flex-col gap-2 px-4 py-3">
        <p className="truncate text-base font-bold leading-6 text-[rgba(0,0,0,0.85)]">
          {event.title}
        </p>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <CalendarBlankIcon size={16} className="shrink-0 text-[#4a5565]" />
            <p className="min-w-0 flex-1 truncate text-sm font-bold leading-5 text-[#eb6101]">
              {event.datetime}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPinIcon size={16} className="shrink-0 text-[#4a5565]" />
            <p className="min-w-0 flex-1 truncate text-sm leading-5 text-[rgba(0,0,0,0.75)]">
              {event.location}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <UserIcon size={16} className="shrink-0 text-[#4a5565]" />
            <p className="min-w-0 flex-1 truncate text-sm leading-5 text-[rgba(0,0,0,0.75)]">
              {event.speakers}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <ClipboardTextIcon size={16} className="shrink-0 text-[#4a5565]" />
            <p className="text-sm font-bold leading-5 text-[#0a6ee7]">
              {event.seatsTaken}/{event.seatsTotal}
            </p>
            <p className="text-sm leading-5 text-[rgba(0,0,0,0.75)]">Seats</p>
          </div>
          <span className="inline-flex items-center rounded bg-[#f3f8fe] px-2 py-1">
            <TicketIcon size={14} className="text-[#0a6ee7]" />
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ececec]">
          <div className="h-full rounded-full bg-[#0a6ee7]" style={{ width: `${seatPct}%` }} />
        </div>
      </div>
    </div>
  );
}

function CompanyEventDetailPanel({
  symbol,
  selectedKey,
}: {
  symbol: string;
  selectedKey: string;
}) {
  const data = useMemo(() => getStockCompanyEvents(symbol), [symbol]);
  const events = data.eventsByDay[selectedKey] ?? [];

  const [year, month, day] = selectedKey.split("-").map(Number);
  const selectedDate = new Date(year, month, day);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <h3 className="text-lg font-bold leading-6 text-[rgba(0,0,0,0.85)]">
        {dayLabel(selectedDate)}
      </h3>
      {events.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg bg-[#f9f9f9] p-4 text-sm text-[#6a7282]">
          No events on this date.
        </div>
      ) : (
        <div className="rounded-lg bg-[#f9f9f9] p-4">
          <div className="flex flex-col gap-3">
            {events.map((event, index) =>
              event.type === "corporate-action" ? (
                <CorporateActionCard
                  key={`${selectedKey}-action-${index}`}
                  action={event.action}
                  symbol={event.symbol}
                />
              ) : (
                <MeetingEventCard key={`${selectedKey}-meeting-${index}`} event={event} />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CompanyEventsSection({ symbol }: { symbol: string }) {
  const data = useMemo(() => getStockCompanyEvents(symbol), [symbol]);
  const [selectedKey, setSelectedKey] = useState(data.initialDayKey);

  return (
    <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
      <CompanyEventsCalendar
        symbol={symbol}
        selectedKey={selectedKey}
        onSelectDay={setSelectedKey}
      />
      <CompanyEventDetailPanel symbol={symbol} selectedKey={selectedKey} />
    </div>
  );
}

export function StockCompanyTab({ symbol }: { symbol: string }) {
  const [subTab, setSubTab] = useState<CompanySubTab>("Company Events");

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {COMPANY_SUB_TABS.map((tab) => (
          <Chip
            key={tab}
            type="single"
            size="small"
            label={tab}
            selected={subTab === tab}
            onClick={() => setSubTab(tab)}
          />
        ))}
      </div>

      {subTab === "Company Events" ? (
        <CompanyEventsSection symbol={symbol} />
      ) : (
        <CompanySubTabPlaceholder label={subTab} />
      )}
    </section>
  );
}
