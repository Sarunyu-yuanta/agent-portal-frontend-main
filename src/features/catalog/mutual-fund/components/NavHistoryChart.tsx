"use client";

import type { Locale } from "@/i18n/config";
import { formatDate, formatDateWith } from "@/i18n/format";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NavPoint } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { useLocale } from "@/i18n/I18nProvider";

export const NAV_RANGES = ["YTD", "1W", "1M", "3M", "6M", "1Y", "5Y", "MAX"] as const;

export type NavRange = (typeof NAV_RANGES)[number];

/** Line and fill, from the NAV chart's original artwork. */
const LINE = "#d92d3c";
const FILL = "#f5212d";

const DAY = 86400000;

/** How far back each range reaches from the latest priced day. */
function rangeStart(range: NavRange, latest: number): number {
  const d = new Date(latest);
  switch (range) {
    case "1W":
      return latest - 7 * DAY;
    case "1M":
      d.setMonth(d.getMonth() - 1);
      return d.getTime();
    case "3M":
      d.setMonth(d.getMonth() - 3);
      return d.getTime();
    case "6M":
      d.setMonth(d.getMonth() - 6);
      return d.getTime();
    case "1Y":
      d.setFullYear(d.getFullYear() - 1);
      return d.getTime();
    case "5Y":
      d.setFullYear(d.getFullYear() - 5);
      return d.getTime();
    case "YTD":
      return Date.UTC(d.getUTCFullYear(), 0, 1);
    case "MAX":
      return -Infinity;
  }
}

const DAY_TICK_RANGES: NavRange[] = ["1W", "1M", "3M"];
const YEAR_TICK_RANGES: NavRange[] = ["5Y", "MAX"];

/**
 * Ticks on calendar boundaries — every other day, the 1st of a month, the 1st
 * of a year — rather than wherever the chart's own spacing lands them. Left to
 * itself a six-month axis prints "Mar 26" twice, which reads as a mistake.
 */
function axisTicks(range: NavRange, from: number, to: number): number[] {
  const ticks: number[] = [];
  if (DAY_TICK_RANGES.includes(range)) {
    const step = (range === "1W" ? 2 : range === "1M" ? 7 : 14) * DAY;
    for (let t = to; t >= from; t -= step) ticks.unshift(t);
  } else if (YEAR_TICK_RANGES.includes(range)) {
    for (let y = new Date(to).getUTCFullYear(); ; y--) {
      const t = Date.UTC(y, 0, 1);
      if (t < from) break;
      ticks.unshift(t);
    }
  } else {
    // 6M, YTD and 1Y all sit on month starts; a year takes them two at a time.
    const step = range === "1Y" ? 2 : 1;
    const end = new Date(to);
    for (let i = 0; ; i += step) {
      const t = Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1);
      if (t < from) break;
      ticks.unshift(t);
    }
  }
  return ticks;
}

/**
 * Tick text per range: a week needs the day, a five-year span only needs the
 * year. In the reader's language, like the tooltip; the period chips under the
 * chart ("1W", "3M", "YTD") are codes and stay as they are.
 */
function tickFormatter(range: NavRange, locale: Locale) {
  const opts: Intl.DateTimeFormatOptions = DAY_TICK_RANGES.includes(range)
    ? { day: "numeric", month: "short" }
    : YEAR_TICK_RANGES.includes(range)
      ? { year: "numeric" }
      : { month: "short", year: "2-digit" };
  return (value: number) => formatDateWith(locale, value, opts);
}

function NavTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { payload: { t: number; nav: number } }[];
  currency: string;
}) {
  const locale = useLocale();
  if (!active || !payload?.length) return null;
  const { t, nav } = payload[0].payload;
  return (
    <div className="min-w-[48px] rounded-2xl bg-white p-1.5 text-center shadow-[0px_0px_1px_rgba(102,102,102,0.16),0px_4px_4px_rgba(102,102,102,0.12)]">
      <p className="text-xs leading-[20px] text-black/40">{formatDate(locale, t, "short")}</p>
      <p className="text-sm leading-[24px] text-black/75">
        {nav.toFixed(4)} <span className="text-black/40">{currency}</span>
      </p>
    </div>
  );
}

/**
 * NAV over time: gradient area under a 2px line, hairline grid, dates along the
 * bottom, and a crosshair that snaps to the nearest priced day.
 *
 * One series, so no legend — the fund names itself above the chart. Every
 * value the crosshair shows is also in the returns table below it, which is
 * what keeps the chart an aid rather than the only way to read the numbers.
 *
 * The y-domain is padded off the visible slice rather than anchored at zero:
 * a NAV that moves 3% in a month is a flat line against a zero baseline, and
 * the shape of the move is the whole point of this chart.
 */
export function NavHistoryChart({
  points,
  range,
  currency,
  className,
}: {
  points: NavPoint[];
  range: NavRange;
  currency: string;
  className?: string;
}) {
  const locale = useLocale();
  const data = useMemo(() => {
    const all = points.map((p) => ({ t: Date.parse(p.date), nav: p.nav }));
    if (!all.length) return all;
    const from = rangeStart(range, all[all.length - 1].t);
    const sliced = all.filter((p) => p.t >= from);
    // Every range keeps at least a line's worth of points — a fund priced
    // weekly has nothing inside a 1W window.
    return sliced.length >= 2 ? sliced : all.slice(-2);
  }, [points, range]);

  const domain = useMemo(() => {
    if (!data.length) return [0, 1] as [number, number];
    const values = data.map((p) => p.nav);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min || max * 0.02) * 0.35;
    return [min - pad, max + pad] as [number, number];
  }, [data]);

  const ticks = useMemo(
    () => (data.length ? axisTicks(range, data[0].t, data[data.length - 1].t) : []),
    [data, range],
  );

  const gradientId = `nav-fill-${range}`;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={FILL} stopOpacity={0.32} />
              <stop offset="100%" stopColor={FILL} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
          {/* A real time axis, not one slot per priced day: the series is
              weekly before last year and daily after, and only a numeric scale
              keeps five years of it in proportion. */}
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={ticks}
            tickFormatter={tickFormatter(range, locale)}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tick={{ fill: "rgba(0,0,0,0.4)", fontSize: 14 }}
            tickMargin={8}
          />
          {/* Hidden, but it still sets the scale the line is drawn against. */}
          <YAxis hide domain={domain} />
          <Tooltip
            content={<NavTooltip currency={currency} />}
            cursor={{ stroke: "rgba(0,0,0,0.18)", strokeWidth: 1 }}
            allowEscapeViewBox={{ y: true }}
          />
          <Area
            type="linear"
            dataKey="nav"
            stroke={LINE}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            // 8px so the dot is a target the pointer can find, not a pinpoint.
            activeDot={{ r: 5, fill: FILL, stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
