"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button, Chip } from "@sarunyu/system-one";
import {
  ArrowLeftIcon,
  CaretDownIcon,
  CaretUpIcon,
  ClockIcon,
  HeartIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
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
  MARKET_STATUS_STYLE,
  type MarketStatusValue,
  type Trend,
} from "./stock-data";
import {
  getRelatedProducts,
  getStockQuoteHistory,
  relatedProductKinds,
  STOCK_CHART_RANGES,
  STOCK_DETAIL_TABS,
  type QuotePoint,
  type StockAdvanceData,
  type StockChartRange,
  type StockDetailTab,
  type StockProductDetail,
  type TimeSalesRow,
  type VolumeAnalysisData,
  type VolumeAnalysisRow,
  type VolumeAnalysisSegmentKind,
} from "./stock-product-detail-data";
import { CATALOG_DETAIL_WIDTH, useCatalogDetailScrollTop } from "./ProductCatalogTabbedDetailLayout";
import { StockCompanyTab } from "./StockCompanyTab";
import { StockRelatedProductTab } from "./StockRelatedProductTab";
import { setQueryState, withQuery } from "@/lib/query-state";

const LINE = "#d92d3c";
const FILL = "#f5212d";
const UP = "#2f952a";
const DOWN = "#f5212d";
const TONE: Record<"up" | "down", string> = { up: UP, down: DOWN };
const VOL_BUY = "#b7eb8f";
const VOL_SELL = "#ffa39e";
const VOL_NEUTRAL = "#595959";
const VOL_SEGMENT: Record<VolumeAnalysisSegmentKind, string> = {
  buy: VOL_BUY,
  neutral: VOL_NEUTRAL,
  sell: VOL_SELL,
};

function tabQueryValue(tab: StockDetailTab): string | null {
  if (tab === "Market Info") return null;
  if (tab === "Related Product") return "related";
  return tab.toLowerCase();
}

function tabFromQuery(value: string | null): StockDetailTab {
  if (value === "related") return "Related Product";
  const match = STOCK_DETAIL_TABS.find((tab) => tab.toLowerCase() === value);
  return match ?? "Market Info";
}

const ASSETS = {
  priceDown: "/products/stock/detail/price-down.svg",
  sparkle: "/products/stock/detail/sparkle.svg",
  setCircle: "/products/stock/detail/set-circle.svg",
  statusOpen: "/products/stock/detail/status-open.svg",
} as const;

function PriceIcon({ trend }: { trend: Trend }) {
  if (trend === "up") {
    return <CaretUpIcon size={24} weight="fill" className="shrink-0 text-[#2f952a]" aria-hidden />;
  }
  if (trend === "flat") {
    return <span className="inline-block size-6 shrink-0" aria-hidden />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ASSETS.priceDown} alt="" width={24} height={24} className="shrink-0" />
  );
}

function MarketStatusTag({ status }: { status: MarketStatusValue }) {
  const s = MARKET_STATUS_STYLE[status];
  const isOpen = status === "Open";
  return (
    <span
      className="inline-flex w-fit items-center gap-1 overflow-hidden rounded px-2 py-1 text-xs leading-4"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {isOpen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ASSETS.statusOpen} alt="" width={12} height={12} className="shrink-0" />
      ) : (
        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: s.dot }} aria-hidden />
      )}
      {status}
    </span>
  );
}

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
      <p className="text-xs leading-4 text-black/40">{label}</p>
      <p className="text-sm leading-5 text-black/75">
        {price.toFixed(2)} <span className="text-black/40">{currency}</span>
      </p>
    </div>
  );
}

function axisTick(range: StockChartRange) {
  return (value: number) => {
    const d = new Date(value);
    if (range === "1D") {
      return d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Bangkok",
      });
    }
    if (range === "5Y") {
      return d.toLocaleDateString("en-GB", { year: "numeric", timeZone: "Asia/Bangkok" });
    }
    if (range === "5D") {
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" });
    }
    return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "Asia/Bangkok" });
  };
}

function StockQuoteChart({
  points,
  range,
  currency,
}: {
  points: QuotePoint[];
  range: StockChartRange;
  currency: string;
}) {
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
            tickFormatter={axisTick(range)}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tick={{ fill: "rgba(0,0,0,0.4)", fontSize: 12 }}
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

function ChartRangeSelector({
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
            className={`flex min-h-8 flex-1 items-center justify-center rounded-full px-2 py-1.5 text-xs font-bold leading-4 transition-colors ${
              selected
                ? "bg-white text-[#101828] shadow-[0px_4px_8px_0px_rgba(28,25,23,0.03),0px_8px_16px_0px_rgba(28,25,23,0.02)]"
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

function DepthSide({
  volume,
  price,
  priceColor,
  barPct,
  barColor,
  align,
}: {
  volume: string;
  price: string;
  priceColor: string;
  barPct: number;
  barColor: string;
  align: "bid" | "offer";
}) {
  return (
    <div className="relative h-[26px] min-w-0 flex-1 overflow-hidden">
      <div
        className="absolute inset-y-0"
        style={
          align === "bid"
            ? { right: 0, width: `${barPct}%`, backgroundColor: barColor }
            : { left: 0, width: `${barPct}%`, backgroundColor: barColor }
        }
      />
      <div className="relative z-10 flex h-full items-center justify-between px-2 py-0.5 text-xs leading-4">
        {align === "bid" ? (
          <>
            <span className="w-[68px] shrink-0 text-[rgba(0,0,0,0.75)]">{volume}</span>
            <span className="text-right whitespace-nowrap" style={{ color: priceColor }}>
              {price}
            </span>
          </>
        ) : (
          <>
            <span className="whitespace-nowrap" style={{ color: priceColor }}>
              {price}
            </span>
            <span className="text-right text-[rgba(0,0,0,0.75)]">{volume}</span>
          </>
        )}
      </div>
    </div>
  );
}

function OrderBook({ detail }: { detail: StockProductDetail }) {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4">
      <h2 className="text-lg font-bold leading-6 text-[rgba(0,0,0,0.85)]">Order Book</h2>
      <div className="flex w-full flex-col overflow-hidden rounded-xl border border-black/10">
        <div className="flex flex-col gap-2.5 p-4">
          <div className="flex w-full items-center text-xs leading-4 text-[#6a7282]">
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span>Volume</span>
              <span>Best Bid</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span>Offer</span>
              <span>Volume</span>
            </div>
          </div>
          <div className="flex w-full items-center overflow-hidden rounded">
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span className="w-[68px] text-sm leading-5 text-[#6a7282]">{detail.bestBid.volume}</span>
              <span className="text-sm font-bold leading-5 text-[#2f952a]">{detail.bestBid.price}</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span className="text-sm font-bold leading-5 text-[#f5212d]">{detail.bestOffer.price}</span>
              <span className="text-sm leading-5 text-[#6a7282]">{detail.bestOffer.volume}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 border-t border-black/10 p-4">
          <div className="flex w-full items-center text-xs leading-4 text-[#6a7282]">
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span>Volume</span>
              <span>Bid</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span>Offer</span>
              <span>Volume</span>
            </div>
          </div>
          <div className="flex w-full flex-col">
            {detail.bidLevels.map((bid, i) => {
              const offer = detail.offerLevels[i];
              return (
                <div key={`depth-${i}`} className="flex w-full items-center overflow-hidden">
                  <DepthSide
                    volume={bid.volume}
                    price={bid.price}
                    priceColor={UP}
                    barPct={bid.barPct}
                    barColor="#effce1"
                    align="bid"
                  />
                  <DepthSide
                    volume={offer.volume}
                    price={offer.price}
                    priceColor={DOWN}
                    barPct={offer.barPct}
                    barColor="#fff0f0"
                    align="offer"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function VolumeAnalysisBar({
  segments,
  maxVolumeM,
}: {
  segments: VolumeAnalysisRow["segments"];
  maxVolumeM: number;
}) {
  return (
    <div className="flex h-3.5 min-w-0 flex-1 items-center">
      {segments.map((segment, index) => {
        const widthPct = (segment.volumeM / maxVolumeM) * 100;
        const isLast = index === segments.length - 1;
        return (
          <div
            key={`${segment.kind}-${index}`}
            className={`h-full shrink-0 ${isLast ? "rounded-br rounded-tr" : ""}`}
            style={{
              width: `${widthPct}%`,
              backgroundColor: VOL_SEGMENT[segment.kind],
            }}
          />
        );
      })}
    </div>
  );
}

function VolumeAnalysisChart({ data }: { data: VolumeAnalysisData }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-black/10 px-4 py-6">
      <div className="relative w-full">
        <div className="flex flex-col gap-[11px]">
          {data.rows.map((row, index) => (
            <div key={`${row.price}-${index}`} className="flex h-3.5 w-full items-center gap-1">
              <span className="w-9 shrink-0 text-xs leading-4 text-[rgba(0,0,0,0.85)]">
                {row.showPrice ? row.price : ""}
              </span>
              <div className="relative min-w-0 flex-1 border-l border-black/10 pl-1">
                <VolumeAnalysisBar segments={row.segments} maxVolumeM={data.maxVolumeM} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex w-full items-start gap-1">
          <span className="w-9 shrink-0" aria-hidden />
          <div className="flex min-w-0 flex-1 items-center justify-between border-t border-black/10 pt-1 pl-1">
            {data.axisTicks.map((tick) => (
              <span key={tick} className="text-xs leading-4 text-black/40">
                {tick}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeSalesTable({ rows }: { rows: TimeSalesRow[] }) {
  return (
    <div className="flex max-h-[418px] w-full flex-col overflow-hidden rounded-xl border border-black/10">
      <div className="flex w-full items-center">
        {["Time", "Price", "Volume", "Side"].map((label) => (
          <div
            key={label}
            className={`flex min-w-0 flex-1 items-center border-b border-black/10 px-4 py-3 text-sm leading-5 text-black/40 ${
              label === "Side" ? "justify-center" : label === "Time" ? "justify-start" : "justify-end"
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {rows.map((row, i) => (
          <div key={`${row.time}-${row.price}-${i}`} className="flex w-full items-center">
            <div className="flex min-w-0 flex-1 items-center border-b border-black/10 px-4 py-2 text-sm leading-[22px] text-[rgba(0,0,0,0.75)]">
              {row.time}
            </div>
            <div
              className="flex min-w-0 flex-1 items-center justify-end border-b border-black/10 px-4 py-2 text-sm leading-[22px]"
              style={{ color: TONE[row.priceTone] }}
            >
              {row.price}
            </div>
            <div
              className="flex min-w-0 flex-1 items-center justify-end border-b border-black/10 px-4 py-2 text-sm leading-[22px]"
              style={{ color: TONE[row.volumeTone] }}
            >
              {row.volume}
            </div>
            <div
              className="flex min-w-0 flex-1 items-center justify-center border-b border-black/10 px-4 py-2 text-sm leading-[22px]"
              style={{ color: row.side === "Buy" ? UP : DOWN }}
            >
              {row.side}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimeAndSales({ detail }: { detail: StockProductDetail }) {
  const [mode, setMode] = useState<"tick" | "volume">("tick");
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex w-full items-end justify-between gap-2">
        <h2 className="text-lg font-bold leading-6 text-[rgba(0,0,0,0.85)]">{`Time&Sales`}</h2>
        <div className="flex items-center gap-2">
          <Chip
            type="single"
            size="small"
            label="Tick by Tick"
            selected={mode === "tick"}
            onClick={() => setMode("tick")}
          />
          <Chip
            type="single"
            size="small"
            label="Volume Analysis"
            selected={mode === "volume"}
            onClick={() => setMode("volume")}
          />
        </div>
      </div>
      {mode === "tick" ? (
        <TimeSalesTable rows={detail.trades} />
      ) : (
        <VolumeAnalysisChart data={detail.volumeAnalysis} />
      )}
    </section>
  );
}

function DaysRangeMeter({ data }: { data: StockAdvanceData }) {
  const left = data.dayBarLeftPct;
  const width = data.dayBarWidthPct;
  const right = left + width;

  return (
    <div className="relative h-[91px] w-full overflow-hidden rounded-lg border border-black/10 px-2">
      <p className="pt-[7px] text-xs leading-4 text-[rgba(0,0,0,0.75)]">Day&apos;s Range</p>
      <div className="mt-1 flex items-start gap-1">
        <div className="flex w-10 shrink-0 flex-col">
          <span className="text-xs leading-4 text-[rgba(0,0,0,0.75)]">{data.rangeLow}</span>
          <span className="text-xs leading-4 text-black/40">52wk.</span>
        </div>
        <div className="relative mt-1.5 min-h-[40px] min-w-0 flex-1">
          <div className="h-2 overflow-hidden rounded-lg bg-[#f3f3f3]">
            <div className="h-full bg-[#0a6ee7]" style={{ marginLeft: `${left}%`, width: `${width}%` }} />
          </div>
          <span
            className="absolute -top-3.5 text-[9px] leading-[14px] text-[#0a6ee7]"
            style={{ left: `${right}%` }}
          >
            {data.dayMarkHigh}
          </span>
          <span
            className="absolute top-3 text-[9px] leading-[14px] text-[#0a6ee7]"
            style={{ left: `${left}%` }}
          >
            {data.dayMarkLow}
          </span>
          <span
            className="absolute top-[5px] -translate-x-1/2 text-xs leading-4 text-black/40"
            style={{ left: `${left + width / 2}%` }}
          >
            1D
          </span>
          <span className="absolute top-[-3px] h-5 w-px bg-[#0a6ee7]" style={{ left: `${left}%` }} />
          <span className="absolute top-[-3px] h-5 w-px bg-[#0a6ee7]" style={{ left: `${right}%` }} />
        </div>
        <div className="flex w-10 shrink-0 flex-col items-end">
          <span className="text-xs leading-4 text-[rgba(0,0,0,0.75)]">{data.rangeHigh}</span>
          <span className="text-xs leading-4 text-black/40">52wk.</span>
        </div>
      </div>
    </div>
  );
}

function AdvanceStatColumn({ rows }: { rows: StockAdvanceData["left"] }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex w-full items-start justify-between border-b border-black/10 py-1.5 text-sm leading-5"
        >
          <span className="text-black/40">{row.label}</span>
          <span className="text-right text-[rgba(0,0,0,0.75)]">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function StockAdvanceDataModal({
  data,
  onClose,
}: {
  data: StockAdvanceData;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-6 backdrop-blur-[2px]"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="stock-advance-data-title"
        className="flex max-h-[90vh] w-full max-w-[528px] flex-col items-center gap-6 overflow-y-auto rounded-3xl bg-white p-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex w-full flex-col gap-2">
          <h2 id="stock-advance-data-title" className="text-lg font-bold leading-6 text-[rgba(0,0,0,0.85)]">
            Advance Data
          </h2>
          <div className="flex w-full flex-col gap-4">
            <DaysRangeMeter data={data} />
            <div className="flex w-full items-start gap-3 px-1">
              <AdvanceStatColumn rows={data.left} />
              <AdvanceStatColumn rows={data.right} />
            </div>
          </div>
        </div>
        <Button variant="primary" className="w-full max-w-[343px]" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

function QuoteBlock({ detail }: { detail: StockProductDetail }) {
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const changeColor = detail.trend === "up" ? "#2f952a" : detail.trend === "down" ? "#cf1421" : "#6a7282";
  const pillBg = detail.trend === "up" ? "#dbfce7" : detail.trend === "down" ? "#fff0f0" : "#f3f4f6";
  const sign = detail.trend === "up" ? "+" : detail.trend === "down" ? "-" : "";

  return (
    <div className="flex w-full flex-col gap-4 pb-4 pt-3">
      <div className="flex w-full items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-1">
            <PriceIcon trend={detail.trend} />
            <span className="text-[40px] font-bold leading-[60px] text-[rgba(0,0,0,0.85)]">{detail.price}</span>
            <span className="text-sm leading-5 text-black/40">{detail.currency}</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: changeColor }}>
            <span className="text-base leading-5">{detail.changeAmount}</span>
            {detail.trend !== "flat" ? (
              <span
                className="inline-flex items-center overflow-hidden rounded px-1.5 py-0.5 text-sm leading-5"
                style={{ backgroundColor: pillBg, color: changeColor }}
              >
                <span className="w-[9px] text-center">{sign}</span>
                <span>{detail.changePercent}</span>
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon size={16} className="shrink-0 text-[#666]" />
            <span className="text-xs leading-4 text-[#666]">{detail.lastUpdated}</span>
          </div>
        </div>
        <div className="flex h-full shrink-0 flex-col items-end justify-end gap-4">
          <span className="inline-flex items-center justify-center gap-1 rounded-[80px] border border-black/10 bg-white py-0.5 pl-1.5 pr-0.5">
            <span className="text-xs leading-4 text-[rgba(0,0,0,0.75)]">{detail.market}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASSETS.setCircle} alt="" width={20} height={20} className="size-5 shrink-0" />
          </span>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm leading-5 text-[rgba(0,0,0,0.75)]">Day&apos;s Range</span>
            <span className="inline-flex items-center gap-1 rounded-[34px] border border-black/10 px-2 py-0.5 text-sm leading-5 text-[rgba(0,0,0,0.75)]">
              {detail.dayLow}
              <span className="inline-block h-px w-5 bg-black/20" aria-hidden />
              {detail.dayHigh}
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-expanded={advanceOpen}
        aria-haspopup="dialog"
        onClick={() => setAdvanceOpen(true)}
        className="inline-flex w-fit cursor-pointer items-center gap-4 rounded-2xl bg-[#f9f9f9] py-1.5 pl-3 pr-2 transition-colors hover:bg-[#ececec] active:bg-[#e4e4e4] aria-expanded:bg-[#ececec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7] focus-visible:ring-offset-2"
      >
        <div className="flex items-center gap-[13px] text-sm leading-5">
          <span className="flex items-center gap-1">
            <span className="text-black/40">Volume</span>
            <span className="text-[rgba(0,0,0,0.85)]">{detail.volume}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-black/40">Value</span>
            <span className="text-[rgba(0,0,0,0.85)]">{detail.value}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-black/40">Mkt Cap</span>
            <span className="text-[rgba(0,0,0,0.85)]">{detail.marketCap}</span>
          </span>
        </div>
        <CaretDownIcon
          size={16}
          className={`shrink-0 text-[#6a7282] transition-transform ${advanceOpen ? "rotate-180" : ""}`}
        />
      </button>
      {advanceOpen ? <StockAdvanceDataModal data={detail.advance} onClose={() => setAdvanceOpen(false)} /> : null}
    </div>
  );
}

function MarketInfoBody({ detail }: { detail: StockProductDetail }) {
  const [range, setRange] = useState<StockChartRange>("1D");
  const points = useMemo(() => getStockQuoteHistory(detail, range), [detail, range]);

  return (
    <>
      <div className="flex w-full flex-col">
        <StockQuoteChart points={points} range={range} currency={detail.currency} />
        <div className="mt-6 w-full">
          <ChartRangeSelector active={range} onChange={setRange} />
        </div>
      </div>
      <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
        <OrderBook detail={detail} />
        <TimeAndSales detail={detail} />
      </div>
    </>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center py-10 text-sm text-[#6a7282]">
      {label} details will be available soon.
    </div>
  );
}

export function StockProductDetail({
  detail,
  onBack,
}: {
  detail: StockProductDetail;
  onBack: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [favorited, setFavorited] = useState(false);
  const related = useMemo(() => getRelatedProducts(detail.symbol), [detail.symbol]);
  const tabs = useMemo<readonly StockDetailTab[]>(
    () =>
      relatedProductKinds(related).length > 0
        ? STOCK_DETAIL_TABS
        : STOCK_DETAIL_TABS.filter((tab) => tab !== "Related Product"),
    [related],
  );
  const requestedTab = tabFromQuery(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<StockDetailTab>("Market Info");

  useCatalogDetailScrollTop([detail.symbol]);

  useEffect(() => {
    setFavorited(false);
  }, [detail.symbol]);

  useEffect(() => {
    setActiveTab(tabs.includes(requestedTab) ? requestedTab : "Market Info");
  }, [requestedTab, tabs]);

  function selectTab(tab: StockDetailTab) {
    setActiveTab(tab);
    setQueryState(
      withQuery(pathname, searchParams, {
        tab: tabQueryValue(tab),
        related: tab === "Related Product" ? searchParams.get("related") : null,
      }),
    );
  }

  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-[#f9fafb] pb-20 pt-4 md:pt-6 lg:pt-8">
      <div className={`flex flex-col gap-2 ${CATALOG_DETAIL_WIDTH.narrow}`}>
        <div className="flex items-center gap-2 pb-2 pr-2 pt-1 lg:pt-0">
          <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ" className="size-[30px] shrink-0 rounded-md p-[5px]">
            <ArrowLeftIcon size={18} />
          </Button>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex min-w-0 items-center gap-1">
                <p className="shrink-0 text-lg font-bold leading-6 text-[rgba(0,0,0,0.8)]">{detail.symbol}</p>
                {detail.featured ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ASSETS.sparkle} alt="" width={16} height={16} className="shrink-0" />
                ) : null}
                <p className="min-w-0 truncate text-base leading-5 text-[rgba(0,0,0,0.75)]">{detail.name}</p>
              </div>
              <MarketStatusTag status={detail.status} />
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button type="button" aria-label="ค้นหา" className="flex size-6 items-center justify-center text-[#4a5565]">
                <MagnifyingGlassIcon size={24} />
              </button>
              <button
                type="button"
                aria-label={favorited ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
                aria-pressed={favorited}
                onClick={() => setFavorited((v) => !v)}
                className="flex size-6 items-center justify-center text-[#4a5565]"
              >
                <HeartIcon size={24} weight={favorited ? "fill" : "regular"} className={favorited ? "text-[#cf1421]" : undefined} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-6 rounded-2xl bg-white px-4 py-8 shadow-[0px_0px_4px_rgba(0,0,0,0.02)] md:px-8 lg:px-14">
          <div className="flex w-full flex-col">
            <QuoteBlock detail={detail} />
            <div className="flex w-full overflow-x-auto border-b border-black/10" style={{ scrollbarWidth: "none" }}>
              {tabs.map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => selectTab(tab)}
                    className={`flex shrink-0 items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm font-bold leading-5 whitespace-nowrap lg:min-w-[80px] lg:flex-1 ${
                      active ? "border-[#0a6ee7] text-[#0a6ee7]" : "border-black/10 text-black/60"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "Market Info" ? (
            <MarketInfoBody detail={detail} />
          ) : activeTab === "Related Product" ? (
            <StockRelatedProductTab related={related} />
          ) : activeTab === "Company" ? (
            <StockCompanyTab symbol={detail.symbol} />
          ) : (
            <PlaceholderTab label={activeTab} />
          )}
        </div>
      </div>
    </div>
  );
}
