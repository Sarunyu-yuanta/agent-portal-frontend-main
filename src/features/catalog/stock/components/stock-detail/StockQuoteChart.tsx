"use client";

import type { Locale } from "@/i18n/config";
import { formatDate, formatDateWith, formatTime } from "@/i18n/format";

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
import {
  STOCK_CHART_RANGES,
  type QuotePoint,
  type StockChartRange,
} from "@/features/catalog/stock/lib/stock-product-detail-data";
import { useLocale } from "@/i18n/I18nProvider";

const LINE = "#d92d3c";
const FILL = "#f5212d";

function QuoteTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { payload: QuotePoint }[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const { t, price } = payload[0].payload;
  const date = new Date(t).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  });
  // "3 May 2025, 14:28" → "3 May 2025 - 14:28"
  const label = date.replace(", ", " - ");
  return (
    <div className="min-w-[48px] rounded-2xl bg-white p-1.5 text-center shadow-[0px_0px_1px_rgba(102,102,102,0.16),0px_4px_4px_rgba(102,102,102,0.12)]">
      <p className="text-xs leading-[20px] text-black/40">{label}</p>
      <p className="text-sm leading-[24px] text-black/75">
        {price.toFixed(2)} <span className="text-black/40">{currency}</span>
      </p>
    </div>
  );
}

function axisTick(range: StockChartRange, locale: Locale) {
  return (value: number) => {
    if (range === "1D") return formatTime(locale, value);
    if (range === "5Y") return formatDateWith(locale, value, { year: "numeric" });
    if (range === "5D") return formatDate(locale, value, "dayMonth");
    return formatDateWith(locale, value, { month: "short", year: "2-digit" });
  };
}

export function StockQuoteChart({
  points,
  range,
  currency,
}: {
  points: QuotePoint[];
  range: StockChartRange;
  currency: string;
}) {
  const locale = useLocale();
  const domain = useMemo(() => {
    if (!points.length) return [0, 1] as [number, number];
    const values = points.map((p) => p.price);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min || max * 0.02) * 0.35;
    return [min - pad, max + pad] as [number, number];
  }, [points]);

  const defaultIndex = useMemo(() => {
    if (range !== "1D") return undefined;
    const target = Date.parse("2025-05-03T14:28:00+07:00");
    let best = 0;
    let dist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.t - target);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    return best;
  }, [points, range]);

  const ticks = useMemo(() => {
    if (range !== "1D" || points.length < 2) return undefined;
    const start = points[0].t;
    const end = points[points.length - 1].t;
    const step = (end - start) / 6;
    return Array.from({ length: 7 }, (_, i) => start + i * step);
  }, [points, range]);

  const gradientId = `stock-quote-fill-${range}`;

  return (
    <div className="h-[227px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 28, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={FILL} stopOpacity={0.32} />
              <stop offset="100%" stopColor={FILL} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={ticks}
            tickFormatter={axisTick(range, locale)}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tick={{ fill: "rgba(0,0,0,0.4)", fontSize: 14 }}
            tickMargin={8}
          />
          <YAxis hide domain={domain} />
          <Tooltip
            content={<QuoteTooltip currency={currency} />}
            cursor={{ stroke: "rgba(0,0,0,0.18)", strokeWidth: 1 }}
            defaultIndex={defaultIndex}
            allowEscapeViewBox={{ y: true }}
          />
          <Area
            type="linear"
            dataKey="price"
            stroke={LINE}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 5, fill: FILL, stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartRangeSelector({
  active,
  onChange,
}: {
  active: StockChartRange;
  onChange: (range: StockChartRange) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[343px] rounded-full bg-[#f3f3f3] p-1">
      {STOCK_CHART_RANGES.map((range) => {
        const selected = active === range;
        return (
          <button
            key={range}
            type="button"
            onClick={() => onChange(range)}
            className={`flex min-h-8 flex-1 items-center justify-center rounded-full px-2 py-1.5 text-xs leading-[20px] font-bold transition-colors ${
              selected
                ? "bg-white text-neutral-900 shadow-[0px_4px_8px_0px_rgba(28,25,23,0.03),0px_8px_16px_0px_rgba(28,25,23,0.02)]"
                : "text-black/75"
            }`}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}
