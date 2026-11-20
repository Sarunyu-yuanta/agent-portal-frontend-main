"use client";

import { useMemo, useState } from "react";
import { BottomSheet, Button, Checkbox, Chip, Popover, Tooltip } from "@sarunyu/system-one";
import {
  CalendarBlankIcon,
  CalendarDotIcon,
  CaretLeftIcon,
  CaretRightIcon,
  GearSixIcon,
} from "@phosphor-icons/react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { CorporateActionDetailModal } from "@/features/calendar/components/CorporateActionDetailModal";
import { MonthPicker } from "@/features/calendar/components/MonthPicker";
import {
  ACTION_KINDS,
  actionKindName,
  actionPalette,
} from "@/features/calendar/components/market-taxonomy";
import { useVisibleRows } from "@/features/calendar/hooks/use-visible-rows";
import {
  addMonths,
  dayKey,
  dayLabel,
  dayRelation,
  isSameMonth,
  monthGrid,
  weekdayLabel,
  weeksOf,
  WEEKS_SHOWN,
} from "@/features/calendar/lib/calendar-grid";
import { useStockCompanyInfo } from "@/features/catalog/hooks/use-catalog";
import { StockTabBodySkeleton } from "./StockCatalogSkeletons";
import {
  COMPANY_SUB_TABS,
  type CompanySubTab,
  type CorporateActionKind,
  type CorporateCalendarMarker,
  type StockCompanyEvents,
} from "@/features/catalog/stock/lib/stock-company-data";
import { useLocale, useT } from "@/i18n/I18nProvider";
import { weekdayNames } from "@/i18n/format";

/**
 * Fills come from `calendar/market-taxonomy`, which the Calendar page's grid
 * reads too.
 *
 * This file used to hold its own three-entry table. Two problems with that, and
 * the shared resolver fixes both: the same XD was a different green on the two
 * month grids the moment either was touched, and a code outside the table —
 * which is every code the exchange publishes but this mock doesn't — resolved
 * to `undefined` and rendered unstyled. The three hexes that were here are now
 * the overrides in that file, so nothing on this screen has moved.
 *
 * The gear dropdown's checklist (Figma node 27745:78796) offers the whole SET
 * taxonomy rather than just the kinds the feed emits today, which is now the
 * same list the resolver sorts by.
 */
const ACTION_FILTER_KINDS = ACTION_KINDS.map((entry) => entry.kind);

/** Sun–Sat. Columns 0–2 open their panel to the right, 3–6 to the left. */
const COLUMNS_PER_WEEK = 7;

/**
 * The circle a day-list row leads with — the Calendar page's `SourceBadgeIcon`
 * in this feed's terms, carrying the kind's own fill so a row and the pill it
 * corresponds to read as the same thing.
 */
function ActionBadge({
  kind,
  size = "small",
}: {
  kind: CorporateActionKind;
  size?: "small" | "default";
}) {
  const t = useT();
  const palette = actionPalette(kind);
  return (
    <span
      role="img"
      aria-label={actionKindName(kind, t)}
      className={`flex shrink-0 items-center justify-center self-center rounded-full text-meta leading-none font-semibold ${
        size === "small" ? "size-7" : "size-8"
      }`}
      style={{ backgroundColor: palette.tint, color: palette.text }}
    >
      {kind}
    </span>
  );
}

function CompanySubTabPlaceholder({ label }: { label: string }) {
  const t = useT();
  return (
    <div className="flex min-h-[240px] items-center justify-center py-10 text-sm text-[#6a7282]">
      {t.stock.company.comingSoon(label)}
    </div>
  );
}

/**
 * One row in a day cell's stack.
 *
 * Geometry is `DayCell`'s pill on the Calendar page — same radius, padding and
 * caption size — so the two month grids read as one widget. Only the fill
 * differs, and deliberately: a corporate action's colour is its taxonomy (the
 * legend below the grid spells it out), not a status ramp, so it keeps the SET
 * palette rather than taking the Calendar's primary tint.
 */
function CalendarMarker({
  marker,
  onOpen,
}: {
  marker: CorporateCalendarMarker;
  /** Absent on a phone, where the pill is only a label — see `CompanyDayCell`. */
  onOpen?: () => void;
}) {
  const palette = actionPalette(marker.kind);
  const shell = `flex w-full shrink-0 items-center overflow-hidden rounded-[3px] px-1 py-0.5 type-caption leading-tight ${
    marker.muted ? "opacity-40" : ""
  }`;
  const fill = { backgroundColor: palette.tint, color: palette.text };

  if (!onOpen) {
    return (
      <span className={shell} style={fill} title={marker.label}>
        <span className="truncate">{marker.label}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        // Keep the click off the cell behind it: landing on a day panel you
        // would only have to click through again is a wasted step when the pill
        // already named the action you want.
        e.stopPropagation();
        onOpen();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      title={marker.label}
      className={`${shell} cursor-pointer text-left transition-[filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--fill-p1-600)]`}
      style={fill}
    >
      <span className="truncate">{marker.label}</span>
    </button>
  );
}

function CalendarLegend() {
  const kinds: CorporateActionKind[] = ["XT", "XW", "XD"];

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[rgba(0,0,0,0.12)] px-3 py-2">
      {kinds.map((kind) => (
        <div
          key={kind}
          className="flex items-center gap-2 rounded border border-black/10 bg-card py-1 pr-3 pl-1.5"
        >
          {/* A filled block rather than Figma's 2px rule: the pill's fill is a
              pale tint, and two pixels of it against a white tag would have been
              the swatch you cannot see. A hairline keeps it reading as a sample
              of a colour rather than a gap in the tag. */}
          <span
            className="size-3.5 shrink-0 rounded-[3px] border border-black/10"
            style={{ backgroundColor: actionPalette(kind).tint }}
            aria-hidden
          />
          <span className="type-caption text-[rgba(0,0,0,0.85)]">{kind}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * What a day cell opens into — the detail that used to sit in a permanent
 * right-hand column.
 *
 * Header / scrolling list, the same shape as the Calendar page's
 * `DayPopoverContent`, minus its footer action: everything here is exchange data
 * off the feed, so there is nothing for the user to add to a day.
 *
 * `markers` are the cell's own, already filtered by the gear, so opening a day
 * can never reveal a kind the grid is currently hiding.
 */
function CompanyDayPanel({
  day,
  markers,
  symbol,
  variant,
  isToday,
  onOpenDetail,
}: {
  day: Date;
  markers: CorporateCalendarMarker[];
  symbol: string;
  variant: "popover" | "sheet";
  isToday: boolean;
  onOpenDetail: (marker: CorporateCalendarMarker) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const isSheet = variant === "sheet";

  return (
    <div className={`flex min-h-0 flex-col ${isSheet ? "w-full" : "w-[344px]"}`}>
      <header
        className={`flex shrink-0 items-start justify-between gap-3 px-3.5 ${
          isSheet ? "pt-1 pb-3" : "pt-3 pb-2.5"
        }`}
      >
        <div className="min-w-0">
          <p className="type-body-1 font-semibold text-foreground">{dayLabel(day, locale)}</p>
          {/* Weekday and count share a line, as on the Calendar page: both are
              context for the list below, and stacking them would push the first
              card out of view. No count when there is nothing — "Nothing
              scheduled" is about to say so in bigger type. */}
          <p className="type-caption text-muted-foreground">
            {weekdayLabel(day, locale)}
            {markers.length > 0 && ` · ${t.stock.company.actionCount(markers.length)}`}
          </p>
        </div>
        {/* Only "Today" earns a badge here. The Calendar page's other one,
            "Overdue", describes work still owed — an XD that has already gone ex
            is settled fact, not a slipped deadline. */}
        {isToday && (
          <span className="bg-primary-action type-caption shrink-0 rounded-full px-2 py-0.5 font-medium text-white">
            {t.stock.company.today}
          </span>
        )}
      </header>

      {markers.length === 0 ? (
        // `border-y` matches the list's, so nothing below sits under a different
        // number of rules depending on which branch rendered.
        <div className="flex flex-col items-center gap-2 border-y border-border/60 px-3.5 py-8 text-center">
          <CalendarBlankIcon size={28} className="text-muted-foreground/40" />
          <p className="type-body-2 text-muted-foreground">{t.stock.company.nothingScheduled}</p>
        </div>
      ) : (
        <ul
          className={`flex flex-col divide-y divide-border/60 overflow-y-auto border-y border-border/60 ${
            // The sheet is already capped by its own height and flexes; a second
            // cap here would leave dead space under a short list.
            isSheet ? "min-h-0 flex-1" : "max-h-80"
          }`}
        >
          {/* Kind over symbol, split across the two lines the Calendar page's
              row gives them, rather than the pill's own "XD : BBL" on one. The
              action is what the reader is scanning a day's list for and the
              symbol only says which holding it lands on — the same order the
              detail sheet leads with. */}
          {markers.map((marker, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => onOpenDetail(marker)}
                className={`group flex w-full cursor-pointer items-start gap-2.5 px-3.5 text-left transition-colors hover:bg-[var(--bg-default-secondary)]! ${
                  isSheet ? "py-3.5" : "py-2.5"
                }`}
              >
                <ActionBadge kind={marker.kind} size={isSheet ? "default" : "small"} />

                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={`type-body-2 truncate font-medium ${
                      marker.muted ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {marker.kind}
                  </span>
                  <span className="type-caption truncate text-muted-foreground">{symbol}</span>
                </span>

                {/* `self-center`: the caret stands for the whole row, so it
                    centres against both lines. In the layout at all times so a
                    row does not reflow on hover; only its opacity changes.
                    Always on in the sheet — there is no hover on a phone. */}
                <CaretRightIcon
                  size={14}
                  className={`shrink-0 self-center text-muted-foreground transition-opacity ${
                    isSheet ? "opacity-40" : "opacity-0 group-hover:opacity-100"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * One day of the Company Events grid.
 *
 * Deliberately `DayCell`'s twin — same rules, same muted out-of-month fill, same
 * measured pill stack with a "+N more" counter, same popover-on-a-pointer /
 * sheet-on-a-phone split. A stock's events are a different feed, not a different
 * kind of calendar, and a second dialect of the same grid would read as one.
 */
function CompanyDayCell({
  day,
  viewMonth,
  today,
  symbol,
  markers,
  columnIndex,
  rowIndex,
  onOpenDetail,
}: {
  day: Date;
  viewMonth: Date;
  today: Date;
  symbol: string;
  markers: CorporateCalendarMarker[];
  columnIndex: number;
  rowIndex: number;
  /** Raised to the calendar rather than handled here: the detail is a page-level
   *  dialog, and a cell is one square of a grid that re-renders under it. */
  onOpenDetail: (marker: CorporateCalendarMarker) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const inMonth = isSameMonth(day, viewMonth);
  const isToday = dayRelation(day, today) === "today";

  const { stackRef, rows } = useVisibleRows();
  const capped = markers.length > rows;
  const visible = capped ? markers.slice(0, Math.max(0, rows - 1)) : markers;
  const overflow = markers.length - visible.length;

  const side = columnIndex >= COLUMNS_PER_WEEK / 2 ? "left" : "right";
  const align = rowIndex === 0 ? "start" : rowIndex === WEEKS_SHOWN - 1 ? "end" : "center";

  /** Both hand-offs dismiss this cell's own layer first — the dialog they open
   *  is portalled at the same `z-50` and mounts after it, so a popover or sheet
   *  left up would paint over the detail the user just asked for. */
  const openDetail = (marker: CorporateCalendarMarker) => {
    setOpen(false);
    onOpenDetail(marker);
  };

  const panel = (
    <CompanyDayPanel
      day={day}
      markers={markers}
      symbol={symbol}
      isToday={isToday}
      variant={isMobile ? "sheet" : "popover"}
      onOpenDetail={openDetail}
    />
  );

  return (
    <>
      {/* The `Popover` wrapper stays mounted on a phone even though it never
          opens there — same reason as `DayCell`: Radix's `asChild` trigger
          writes its own attributes onto the div below, so dropping the wrapper
          would change the markup between the server render and the client. */}
      <Popover
        open={!isMobile && open}
        onOpenChange={setOpen}
        side={side}
        align={align}
        sideOffset={8}
        className="overflow-hidden p-0 shadow-lg"
        content={!isMobile && open ? panel : null}
      >
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
          className={`flex h-full min-h-0 cursor-pointer flex-col gap-1 overflow-hidden p-1.5 text-left transition-colors ${
            columnIndex === COLUMNS_PER_WEEK - 1 ? "" : "border-r border-[rgba(0,0,0,0.12)]"
          } ${
            isToday && inMonth
              ? "bg-[var(--fill-p1-200)] hover:bg-[var(--fill-p1-300)]!"
              : `${inMonth ? "bg-card" : "bg-[var(--bg-default-secondary)]/60"} hover:bg-[rgba(0,0,0,0.045)]!`
          }`}
        >
          <span
            className={`type-caption flex size-6 shrink-0 items-center justify-center rounded-full font-semibold ${
              isToday
                ? "bg-primary-action text-white"
                : inMonth
                  ? "text-foreground"
                  : "text-muted-foreground/50"
            }`}
          >
            {day.getDate()}
          </span>
          {/* On a pointer device a pill goes straight to its action's record.
              On a phone it is only a label: a ~14px strip inside a cell is well
              under any thumb, so the cell is the one target there and the sheet
              it opens lists the same actions as cards worth tapping — the split
              `DayCell` makes, for the same reason. */}
          <div ref={stackRef} className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
            {visible.map((marker, index) => (
              <CalendarMarker
                key={`${dayKey(day)}-${index}`}
                marker={marker}
                onOpen={isMobile ? undefined : () => openDetail(marker)}
              />
            ))}
            {overflow > 0 && (
              <span className="type-caption shrink-0 truncate px-1 py-0.5 leading-tight font-medium text-muted-foreground">
                {t.stock.company.more(overflow)}
              </span>
            )}
          </div>
        </div>
      </Popover>

      {/* Mounted for as long as the viewport is a phone, not only while open:
          `BottomSheet` plays its own slide-out off the `open` prop, so
          unmounting on close would cut the animation. */}
      {isMobile && (
        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          showHeader={false}
          title={dayLabel(day, locale)}
          className="px-0 pb-0"
          contentClassName="flex min-h-0 flex-col pt-0"
        >
          {panel}
        </BottomSheet>
      )}
    </>
  );
}

function CompanyEventsSection({
  data,
  symbol,
  companyName,
}: {
  data: StockCompanyEvents;
  symbol: string;
  companyName: string;
}) {
  const t = useT();
  const locale = useLocale();
  /** The mock feed hangs off April 2026, so "today" is pinned there too —
   *  otherwise the grid would open on a real month with nothing in it. */
  const today = useMemo(() => new Date(2026, 3, 30), []);
  const [viewDate, setViewDate] = useState(
    () => new Date(data.initialMonth.year, data.initialMonth.month, 1),
  );

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

  const weeks = useMemo(() => weeksOf(monthGrid(viewDate)), [viewDate]);

  /** The action whose record sheet is open, or `null`. Held here rather than in
   *  the cell that raised it — see `onOpenDetail` on `CompanyDayCell`. */
  const [detailMarker, setDetailMarker] = useState<CorporateCalendarMarker | null>(null);

  const visibleMarkers = (key: string) =>
    (data.markersByDay[key] ?? []).filter((marker) => !hiddenKinds.has(marker.kind));

  return (
    <div className="flex w-full flex-col">
      {/* Same card the Calendar page draws — border, rounded corners, its own
          rules inside — rather than a bare grid, now that this is the whole
          width of the tab instead of one column beside a detail panel.
          A fixed height rather than `h-full`: the tab scrolls with the rest of
          the product page, so there is no viewport height to claim, and the six
          `basis-0` week rows need a definite one to split evenly. */}
      <div className="flex h-[620px] flex-col overflow-hidden rounded-xl border border-border bg-card max-sm:h-[520px]">
        {/* Navigation left, filter right — the toolbar arrangement `CalendarView`
            uses. Today / ‹ / › sit together because they are one control (move
            the view) and the month label reads as their readout.

            `!` on the responsive gap for the reason that file documents:
            `@sarunyu/system-one` ships a plain `.gap-1` and loads after
            `globals.css`, so it wins the tie against a Tailwind variant. */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-1 max-sm:gap-2.5!">
            <Tooltip content={t.stock.company.goToToday(dayLabel(today, locale))} side="bottom">
              <Button
                variant="plain"
                size="sm"
                className="shrink-0"
                leftIcon={<CalendarDotIcon size={15} />}
                onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
              >
                {t.stock.company.today}
              </Button>
            </Tooltip>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label={t.stock.company.previousMonth}
                onClick={() => setViewDate((d) => addMonths(d, -1))}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[var(--bg-default-secondary)] hover:text-foreground"
              >
                <CaretLeftIcon size={16} />
              </button>
              <button
                type="button"
                aria-label={t.stock.company.nextMonth}
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
              the arrows opposite it rather than Figma's 34px, which would make
              it the one odd height in the bar. */}
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
                          className={`text-sm leading-[24px] ${shown ? "text-[#0a6ee7]" : "text-[rgba(0,0,0,0.35)]"}`}
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
              aria-label={t.stock.company.filterActions}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-[var(--bg-default-secondary)] hover:text-foreground"
            >
              <GearSixIcon size={18} />
            </button>
          </Popover>
        </div>

        <div className="grid shrink-0 grid-cols-7 border-b border-[rgba(0,0,0,0.12)]">
          {weekdayNames(locale, "short").map((label) => (
            <div key={label} className="type-caption px-2 py-2 text-center text-muted-foreground">
              {label}
            </div>
          ))}
        </div>

        {/* `overflow-hidden` + `basis-0` weeks, not a scroller: the month has to
            fit the card, so the six rows split the leftover height evenly and
            each cell clips its own overflow. `basis-0` matters — with the
            default `auto` basis a cell's marker stack would set its row's height
            and the rows would come out uneven. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="grid min-h-0 flex-1 basis-0 grid-cols-7 border-b border-[rgba(0,0,0,0.12)] last:border-b-0"
            >
              {week.map((day, dayIndex) => {
                const key = dayKey(day);
                return (
                  <CompanyDayCell
                    key={key}
                    day={day}
                    viewMonth={viewDate}
                    today={today}
                    symbol={symbol}
                    markers={visibleMarkers(key)}
                    columnIndex={dayIndex}
                    rowIndex={weekIndex}
                    onOpenDetail={setDetailMarker}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <CalendarLegend />
      </div>

      {detailMarker && (
        <CorporateActionDetailModal
          kind={detailMarker.kind}
          symbol={symbol}
          companyName={companyName}
          rows={detailMarker.detail}
          onClose={() => setDetailMarker(null)}
        />
      )}
    </div>
  );
}

export function StockCompanyTab({
  symbol,
  companyName,
}: {
  symbol: string;
  /** The issuer's legal name — the detail sheet prints it beside the symbol. */
  companyName: string;
}) {
  const t = useT();
  const [subTab, setSubTab] = useState<CompanySubTab>("events");
  // The tab's own resource: while it loads, only this body is a skeleton —
  // the ticker header, quote and detail tab strip stay up around it.
  const { data, isLoading } = useStockCompanyInfo(symbol);

  if (isLoading) return <StockTabBodySkeleton />;
  // Loaded with nothing: say so, rather than a skeleton that never resolves.
  if (!data) {
    return (
      <div className="flex min-h-[240px] items-center justify-center py-10 text-sm text-[#6a7282]">
        {t.stock.company.noData}
      </div>
    );
  }

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {COMPANY_SUB_TABS.map((tab) => (
          <Chip
            key={tab}
            type="single"
            size="small"
            label={t.stock.company.subTabs[tab] ?? tab}
            selected={subTab === tab}
            onClick={() => setSubTab(tab)}
          />
        ))}
      </div>

      {subTab === "events" ? (
        <CompanyEventsSection data={data} symbol={symbol} companyName={companyName} />
      ) : (
        <CompanySubTabPlaceholder label={t.stock.company.subTabs[subTab] ?? subTab} />
      )}
    </section>
  );
}
