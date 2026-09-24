"use client";

import Link from "next/link";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { CALENDAR_ENABLED } from "@/lib/feature-flags";
import {
  dayKey,
  isSameMonth,
  monthGrid,
  weeksOf,
  WEEKDAY_LABELS,
} from "../calendar/calendar-grid";
import type { DayDots } from "./dashboard-data";

/**
 * The month, small — and the page's day picker.
 *
 * It earns its space by doing a job the list underneath cannot: the queue is
 * sorted by urgency, which is the right order to work in and the wrong one to
 * see shape in. A month grid says at a glance that next Wednesday is stacked
 * and the week after is empty, and it reaches past the queue's own 15-day
 * horizon, where the list has nothing to show at all.
 *
 * It is a control, not a second view of the same data. Picking a day filters
 * the queue; picking it again clears the filter. The full-size Calendar, where
 * a day cell can hold readable rows instead of dots, is one link away.
 *
 * Dots are counted per source and capped at three, because past three the row
 * stops being a count and becomes a texture — the number beside them carries
 * the rest.
 */
const DOT_TONE: Record<keyof DayDots, string> = {
  // Matches the badge ramps the queue rows use: KYC on the warning scale,
  // desk-raised alerts orange, the user's own notes on the primary ramp.
  kyc: "bg-[var(--fill-orange-500)]",
  alert: "bg-[var(--fill-yellow-500)]",
  note: "bg-[var(--fill-p1-500)]",
};

const DOT_ORDER: (keyof DayDots)[] = ["kyc", "alert", "note"];
const MAX_DOTS = 3;

/** Sun–Sat, in the two-letter Thai the rest of the app's dates are set in. */
const WEEKDAY_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function monthLabelTh(date: Date): string {
  return date.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
}

export function MiniCalendar({
  viewDate,
  today,
  dots,
  selectedKey,
  onSelect,
  onMonthChange,
}: {
  /** Any day inside the month being shown. */
  viewDate: Date;
  today: Date;
  dots: Map<string, DayDots>;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  /** `+1` / `-1`, relative to the month on screen. */
  onMonthChange: (delta: number) => void;
}) {
  const weeks = weeksOf(monthGrid(viewDate));
  const todayKey = dayKey(today);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        {/* Set as a card title, not a sub-label — this card has no other
            heading above it, so the month is what names it. */}
        <p className="type-subtitle-1 font-bold text-foreground">
          {monthLabelTh(viewDate)}
        </p>
        <div className="flex items-center gap-0.5">
          <MonthNavButton label="เดือนก่อนหน้า" onClick={() => onMonthChange(-1)}>
            <CaretLeftIcon size={14} weight="bold" />
          </MonthNavButton>
          <MonthNavButton label="เดือนถัดไป" onClick={() => onMonthChange(1)}>
            <CaretRightIcon size={14} weight="bold" />
          </MonthNavButton>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7">
          {WEEKDAY_TH.map((label, i) => (
            <div
              key={WEEKDAY_LABELS[i]}
              className="pb-1.5 text-center text-[10px] font-semibold text-[var(--text-default-placeholder)]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-0.5">
          {weeks.flat().map((day) => {
            const key = dayKey(day);
            const outside = !isSameMonth(day, viewDate);
            const isToday = key === todayKey;
            const selected = key === selectedKey;
            const entry = dots.get(key);

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(selected ? null : key)}
                aria-pressed={selected}
                aria-current={isToday ? "date" : undefined}
                className="group flex flex-col items-center gap-0.5 py-0.5 cursor-pointer"
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-[12px] tabular-nums transition-colors ${
                    isToday
                      ? "bg-primary-action font-bold text-white"
                      : selected
                        ? "bg-[var(--fill-p1-100)] font-bold text-[var(--fill-p1-700)] ring-1 ring-primary-action"
                        : outside
                          ? "text-[var(--text-default-placeholder)] group-hover:bg-muted"
                          : "text-foreground group-hover:bg-muted"
                  }`}
                >
                  {day.getDate()}
                </span>
                {/* A fixed-height rail whether or not the day has dots, so the
                    rows stay on one baseline and the grid doesn't ripple as the
                    month changes. */}
                <span className="flex h-1.5 items-center justify-center gap-[3px]">
                  {entry &&
                    DOT_ORDER.flatMap((kind) =>
                      Array.from({ length: entry[kind] }, (_, i) => `${kind}-${i}`).map(
                        (id) => ({ id, kind }),
                      ),
                    )
                      .slice(0, MAX_DOTS)
                      .map(({ id, kind }) => (
                        <span
                          key={id}
                          className={`size-1 rounded-full ${DOT_TONE[kind]} ${outside ? "opacity-40" : ""}`}
                        />
                      ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Only offered while the Calendar is in phase — otherwise this would
          lead to a route that redirects straight back, the same rule the
          header bell's calendar link follows. */}
      {CALENDAR_ENABLED && (
        <Link
          href="/calendar"
          className="self-end flex items-center gap-1 text-[12px] font-medium text-primary-action no-underline hover:underline"
        >
          เปิดปฏิทินเต็ม
          <CaretRightIcon size={12} weight="bold" />
        </Link>
      )}
    </div>
  );
}

function MonthNavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
