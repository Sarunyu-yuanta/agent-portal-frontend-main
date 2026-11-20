"use client";

import type { Locale } from "@/i18n/config";
import { formatDate, formatDateWith, formatTime } from "@/i18n/format";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppPathname } from "@/i18n/navigation";
import { Button, Chip } from "@sarunyu/system-one";
import { SendProposalButton } from "@/app/[lang]/(dashboard)/orders/SendProposalButton";
import { offeredProductId } from "@/app/[lang]/(dashboard)/orders/offered-products";
import {
  ArrowLeftIcon,
  CaretDownIcon,
  CaretUpIcon,
  ClockIcon,
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
  getStockQuoteHistory,
  relatedProductKinds,
  STOCK_CHART_RANGES,
  STOCK_DETAIL_TABS,
  type QuotePoint,
  type StockAdvanceData,
  type StockChartRange,
  type StockDetailTab,
  type StockProductDetail,
  type StockTabNotice,
  type TimeSalesRow,
  type VolumeAnalysisData,
  type VolumeAnalysisRow,
  type VolumeAnalysisSegmentKind,
} from "./stock-product-detail-data";
import { CATALOG_DETAIL_WIDTH, useCatalogDetailScrollTop } from "./ProductCatalogTabbedDetailLayout";
import { StockCompanyTab } from "./StockCompanyTab";
import { StockRelatedProductTab } from "./StockRelatedProductTab";
import {
  StockDetailHeaderSkeleton,
  StockMarketInfoBodySkeleton,
  StockProposalButtonSkeleton,
  StockQuoteBlockSkeleton,
  StockTabBodySkeleton,
} from "./StockCatalogSkeletons";
import { setQueryState, withQuery } from "@/lib/query-state";
import { TabsSkeleton } from "@/components/ui/skeleton";
import {
  useStockNews,
  useStockRelatedProducts,
  useStockResearch,
  useStockTechnical,
} from "@/hooks/use-catalog";
import { useLocale, useT } from "@/i18n/I18nProvider";

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
  const t = useT();
  const s = MARKET_STATUS_STYLE[status];
  const isOpen = status === "Open";
  return (
    <span
      className="inline-flex w-fit items-center gap-1 overflow-hidden rounded px-2 py-1 text-xs leading-[20px]"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {isOpen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ASSETS.statusOpen} alt="" width={12} height={12} className="shrink-0" />
      ) : (
        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: s.dot }} aria-hidden />
      )}
      {t.stock.marketStatus[status] ?? status}
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

function StockQuoteChart({
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
            className={`flex min-h-8 flex-1 items-center justify-center rounded-full px-2 py-1.5 text-xs font-bold leading-[20px] transition-colors ${
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
      <div className="relative z-10 flex h-full items-center justify-between px-2 py-0.5 text-xs leading-[20px]">
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
  const t = useT();
  const ob = t.stock.detail.orderBook;
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4">
      <h2 className="text-lg font-bold leading-[28px] text-[rgba(0,0,0,0.85)]">{ob.title}</h2>
      <div className="flex w-full flex-col overflow-hidden rounded-xl border border-black/10">
        <div className="flex flex-col gap-2.5 p-4">
          <div className="flex w-full items-center text-xs leading-[20px] text-[#6a7282]">
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span>{ob.volume}</span>
              <span>{ob.bestBid}</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span>{ob.offer}</span>
              <span>{ob.volume}</span>
            </div>
          </div>
          <div className="flex w-full items-center overflow-hidden rounded">
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span className="w-[68px] text-sm leading-[24px] text-[#6a7282]">{detail.bestBid.volume}</span>
              <span className="text-sm font-bold leading-[24px] text-[#2f952a]">{detail.bestBid.price}</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span className="text-sm font-bold leading-[24px] text-[#f5212d]">{detail.bestOffer.price}</span>
              <span className="text-sm leading-[24px] text-[#6a7282]">{detail.bestOffer.volume}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 border-t border-black/10 p-4">
          <div className="flex w-full items-center text-xs leading-[20px] text-[#6a7282]">
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span>{ob.volume}</span>
              <span>{ob.bid}</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span>{ob.offer}</span>
              <span>{ob.volume}</span>
            </div>
          </div>
          <div className="flex w-full flex-col">
            {/* As many rows as the deeper side has; a side that runs out shows a
                blank level rather than reading past the end of its array. */}
            {Array.from(
              { length: Math.max(detail.bidLevels.length, detail.offerLevels.length) },
              (_, i) => i,
            ).map((i) => {
              const bid = detail.bidLevels[i] ?? EMPTY_LEVEL;
              const offer = detail.offerLevels[i] ?? EMPTY_LEVEL;
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

/** A depth row for the side that has run out of levels. */
const EMPTY_LEVEL = { volume: "", price: "", barPct: 0 };

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
        const widthPct = maxVolumeM > 0 ? (segment.volumeM / maxVolumeM) * 100 : 0;
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
              <span className="w-9 shrink-0 text-xs leading-[20px] text-[rgba(0,0,0,0.85)]">
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
              <span key={tick} className="text-xs leading-[20px] text-black/40">
                {tick}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const TIME_SALES_COLS = ["time", "price", "volume", "side"] as const;

function TimeSalesTable({ rows }: { rows: TimeSalesRow[] }) {
  const t = useT();
  const ts = t.stock.detail.timeSales;
  return (
    <div className="flex max-h-[418px] w-full flex-col overflow-hidden rounded-xl border border-black/10">
      <div className="flex w-full items-center">
        {TIME_SALES_COLS.map((col) => (
          <div
            key={col}
            className={`flex min-w-0 flex-1 items-center border-b border-black/10 px-4 py-3 text-sm leading-[24px] text-black/40 ${
              col === "side" ? "justify-center" : col === "time" ? "justify-start" : "justify-end"
            }`}
          >
            {ts.cols[col]}
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {rows.map((row, i) => (
          <div key={`${row.time}-${row.price}-${i}`} className="flex w-full items-center">
            <div className="flex min-w-0 flex-1 items-center border-b border-black/10 px-4 py-2 text-sm leading-[26px] text-[rgba(0,0,0,0.75)]">
              {row.time}
            </div>
            <div
              className="flex min-w-0 flex-1 items-center justify-end border-b border-black/10 px-4 py-2 text-sm leading-[26px]"
              style={{ color: TONE[row.priceTone] }}
            >
              {row.price}
            </div>
            <div
              className="flex min-w-0 flex-1 items-center justify-end border-b border-black/10 px-4 py-2 text-sm leading-[26px]"
              style={{ color: TONE[row.volumeTone] }}
            >
              {row.volume}
            </div>
            <div
              className="flex min-w-0 flex-1 items-center justify-center border-b border-black/10 px-4 py-2 text-sm leading-[26px]"
              style={{ color: row.side === "Buy" ? UP : DOWN }}
            >
              {ts.side[row.side]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimeAndSales({ detail }: { detail: StockProductDetail }) {
  const t = useT();
  const ts = t.stock.detail.timeSales;
  const [mode, setMode] = useState<"tick" | "volume">("tick");
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex w-full items-end justify-between gap-2">
        <h2 className="text-lg font-bold leading-[28px] text-[rgba(0,0,0,0.85)]">{ts.title}</h2>
        <div className="flex items-center gap-2">
          <Chip
            type="single"
            size="small"
            label={ts.tick}
            selected={mode === "tick"}
            onClick={() => setMode("tick")}
          />
          <Chip
            type="single"
            size="small"
            label={ts.volumeAnalysis}
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
  const t = useT();
  const adv = t.stock.detail.advance;
  const left = data.dayBarLeftPct;
  const width = data.dayBarWidthPct;
  const right = left + width;

  return (
    <div className="relative h-[91px] w-full overflow-hidden rounded-lg border border-black/10 px-2">
      <p className="pt-[7px] text-xs leading-[20px] text-[rgba(0,0,0,0.75)]">{adv.daysRange}</p>
      <div className="mt-1 flex items-start gap-1">
        <div className="flex w-10 shrink-0 flex-col">
          <span className="text-xs leading-[20px] text-[rgba(0,0,0,0.75)]">{data.rangeLow}</span>
          <span className="text-xs leading-[20px] text-black/40">{adv.week52}</span>
        </div>
        <div className="relative mt-1.5 min-h-[40px] min-w-0 flex-1">
          <div className="h-2 overflow-hidden rounded-lg bg-[#f3f3f3]">
            <div className="h-full bg-[#0a6ee7]" style={{ marginLeft: `${left}%`, width: `${width}%` }} />
          </div>
          <span
            className="absolute -top-3.5 text-micro leading-[18px] text-[#0a6ee7]"
            style={{ left: `${right}%` }}
          >
            {data.dayMarkHigh}
          </span>
          <span
            className="absolute top-3 text-micro leading-[18px] text-[#0a6ee7]"
            style={{ left: `${left}%` }}
          >
            {data.dayMarkLow}
          </span>
          <span
            className="absolute top-[5px] -translate-x-1/2 text-xs leading-[20px] text-black/40"
            style={{ left: `${left + width / 2}%` }}
          >
            1D
          </span>
          <span className="absolute top-[-3px] h-5 w-px bg-[#0a6ee7]" style={{ left: `${left}%` }} />
          <span className="absolute top-[-3px] h-5 w-px bg-[#0a6ee7]" style={{ left: `${right}%` }} />
        </div>
        <div className="flex w-10 shrink-0 flex-col items-end">
          <span className="text-xs leading-[20px] text-[rgba(0,0,0,0.75)]">{data.rangeHigh}</span>
          <span className="text-xs leading-[20px] text-black/40">{adv.week52}</span>
        </div>
      </div>
    </div>
  );
}

function AdvanceStatColumn({ rows }: { rows: StockAdvanceData["left"] }) {
  const t = useT();
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      {rows.map((row) => (
        <div
          key={row.key}
          className="flex w-full items-start justify-between border-b border-black/10 py-1.5 text-sm leading-[24px]"
        >
          <span className="text-black/40">{t.stock.detail.advance.stats[row.key] ?? row.key}</span>
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
  const t = useT();
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
        className="flex max-h-[calc(var(--vh)*90)] w-full max-w-[528px] flex-col items-center gap-6 overflow-y-auto rounded-3xl bg-white p-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex w-full flex-col gap-2">
          <h2 id="stock-advance-data-title" className="text-lg font-bold leading-[28px] text-[rgba(0,0,0,0.85)]">
            {t.stock.detail.advance.title}
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
          {t.stock.detail.advance.close}
        </Button>
      </div>
    </div>
  );
}

function QuoteBlock({ detail }: { detail: StockProductDetail }) {
  const t = useT();
  const q = t.stock.detail.quote;
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
            <span className="text-sm leading-[24px] text-black/40">{detail.currency}</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: changeColor }}>
            <span className="text-base leading-[24px]">{detail.changeAmount}</span>
            {detail.trend !== "flat" ? (
              <span
                className="inline-flex items-center overflow-hidden rounded px-1.5 py-0.5 text-sm leading-[24px]"
                style={{ backgroundColor: pillBg, color: changeColor }}
              >
                <span className="w-[9px] text-center">{sign}</span>
                <span>{detail.changePercent}</span>
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon size={16} className="shrink-0 text-[#666]" />
            <span className="text-xs leading-[20px] text-[#666]">{t.stock.detail.lastUpdated(detail.lastUpdated)}</span>
          </div>
        </div>
        <div className="flex h-full shrink-0 flex-col items-end justify-end gap-4">
          <span className="inline-flex items-center justify-center gap-1 rounded-[80px] border border-black/10 bg-white py-0.5 pl-1.5 pr-0.5">
            <span className="text-xs leading-[20px] text-[rgba(0,0,0,0.75)]">{detail.market}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detail.marketIcon}
              alt=""
              width={20}
              height={20}
              className="size-5 shrink-0 rounded-full"
            />
          </span>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm leading-[24px] text-[rgba(0,0,0,0.75)]">{q.daysRange}</span>
            <span className="inline-flex items-center gap-1 rounded-[34px] border border-black/10 px-2 py-0.5 text-sm leading-[24px] text-[rgba(0,0,0,0.75)]">
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
        <div className="flex items-center gap-[13px] text-sm leading-[24px]">
          <span className="flex items-center gap-1">
            <span className="text-black/40">{q.volume}</span>
            <span className="text-[rgba(0,0,0,0.85)]">{detail.volume}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-black/40">{q.value}</span>
            <span className="text-[rgba(0,0,0,0.85)]">{detail.value}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-black/40">{q.mktCap}</span>
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

function NoticeTabBody({
  notice,
  isLoading,
}: {
  notice: StockTabNotice | null;
  isLoading: boolean;
}) {
  const t = useT();
  // Loading and "nothing to say" were the same `null`, so a tab with no
  // notice sat on its skeleton for good.
  if (isLoading) return <StockTabBodySkeleton />;
  if (!notice) {
    return (
      <div className="flex min-h-[240px] items-center justify-center py-10 text-sm text-[#6a7282]">
        {t.stock.detail.noTabData}
      </div>
    );
  }
  return (
    <div className="flex min-h-[240px] items-center justify-center py-10 text-sm text-[#6a7282]">
      {t.stock.detail.tabNotice(t.stock.detail.tabs[notice.tab] ?? notice.tab)}
    </div>
  );
}

/* Research / Technical / News: one component per tab so each calls only its
 * own resource, and only once that tab is open. */
function StockResearchTab({ symbol }: { symbol: string }) {
  const { data, isLoading } = useStockResearch(symbol);
  return <NoticeTabBody notice={data} isLoading={isLoading} />;
}

function StockTechnicalTab({ symbol }: { symbol: string }) {
  const { data, isLoading } = useStockTechnical(symbol);
  return <NoticeTabBody notice={data} isLoading={isLoading} />;
}

function StockNewsTab({ symbol }: { symbol: string }) {
  const { data, isLoading } = useStockNews(symbol);
  return <NoticeTabBody notice={data} isLoading={isLoading} />;
}

/**
 * The ticker screen, loading included — two levels:
 *
 * 1. First load (`isLoading`, the page resource): the whole screen is skeleton,
 *    tab strip included, so nothing can be pressed before there is a quote.
 *    The body skeleton still follows `?tab=` so a deep link lands on the
 *    right shape.
 * 2. Once the quote is in, the real tabs are live and every tab but Market Info
 *    reads its own resource: a tab whose data is still loading skeletons its
 *    body only. "Related Product" is offered while its resource loads, and
 *    dropped once it resolves with nothing in it.
 */
export function StockProductDetail({
  detail: resolved,
  isLoading,
  onBack,
}: {
  detail: StockProductDetail | null;
  isLoading: boolean;
  onBack: () => void;
}) {
  const t = useT();
  const detail = isLoading ? null : resolved;
  const pathname = useAppPathname();
  const searchParams = useSearchParams();
  const symbol = detail?.symbol ?? null;
  const relatedResource = useStockRelatedProducts(symbol);
  const related = relatedResource.isLoading ? null : relatedResource.data;
  const tabs = useMemo<readonly StockDetailTab[]>(
    () =>
      !related || relatedProductKinds(related).length > 0
        ? STOCK_DETAIL_TABS
        : STOCK_DETAIL_TABS.filter((tab) => tab !== "Related Product"),
    [related],
  );
  // The URL is the source of truth; `setQueryState` keeps `useSearchParams` in sync.
  const requestedTab = tabFromQuery(searchParams.get("tab"));
  const activeTab: StockDetailTab = tabs.includes(requestedTab) ? requestedTab : "Market Info";

  useCatalogDetailScrollTop([symbol]);

  function selectTab(tab: StockDetailTab) {
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
        {!detail ? (
          <StockDetailHeaderSkeleton />
        ) : (
          <div className="flex items-center gap-2 pb-2 pr-2 pt-1 lg:pt-0">
            <Button variant="plain" size="icon-sm" onClick={onBack} aria-label={t.common.back} className="size-[30px] shrink-0 rounded-md p-[5px]">
              <ArrowLeftIcon size={18} />
            </Button>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex min-w-0 items-center gap-1">
                  <p className="shrink-0 text-lg font-bold leading-[28px] text-[rgba(0,0,0,0.8)]">{detail.symbol}</p>
                  {detail.featured ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ASSETS.sparkle} alt="" width={16} height={16} className="shrink-0" />
                  ) : null}
                  <p className="min-w-0 truncate text-base leading-[24px] text-[rgba(0,0,0,0.75)]">{detail.name}</p>
                </div>
                <MarketStatusTag status={detail.status} />
              </div>
            </div>
          </div>
        )}

        <div className="flex w-full flex-col gap-6 rounded-2xl bg-white px-4 py-8 shadow-[0px_0px_4px_rgba(0,0,0,0.02)] md:px-8 lg:px-14">
          {detail ? <QuoteBlock detail={detail} /> : <StockQuoteBlockSkeleton />}
          {/* Sticky against `<main>`, which is the page's scroller (see
              `useCatalogDetailScrollTop`). `top-0` pins it directly under the
              app header — the header is a flex sibling above the scrollport
              rather than an overlay, so there is no height to offset for.

              A direct child of the card, not of a wrapper shared with
              `QuoteBlock` as before: a sticky element can only travel inside its
              own parent's box, and that wrapper ended a few pixels below the
              tabs — the bar would have unstuck before it had moved. The card is
              the box the tabs should stay with, so the card has to be the
              parent, and `-mt-6` cancels the `gap-6` that promotion introduced
              so the bar still sits flush under the quote.

              `bg-white` earns its keep only once pinned: the tab row is
              transparent in flow and the body would otherwise scroll through
              it. */}
          {!detail ? (
            <TabsSkeleton count={tabs.length} className="-mt-6 w-full border-b border-black/10" />
          ) : (
            <div
              className="sticky top-0 z-20 -mt-6 flex w-full overflow-x-auto border-b border-black/10 bg-white"
              style={{ scrollbarWidth: "none" }}
            >
              {tabs.map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => selectTab(tab)}
                    // Matches `CatalogDetailTextTabs`: hover paint on the inactive
                    // tabs only. Trailing `!` because system-one ships its base
                    // utilities unlayered, where they outrank a `hover:` variant.
                    className={`flex shrink-0 cursor-pointer items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm font-bold leading-[24px] whitespace-nowrap transition-colors lg:min-w-[80px] lg:flex-1 ${
                      active
                        ? "border-[#0a6ee7] text-[#0a6ee7]"
                        : "border-black/10 text-black/60 hover:bg-black/[0.03]! hover:text-[#101828]!"
                    }`}
                  >
                    {t.stock.detail.tabs[tab] ?? tab}
                  </button>
                );
              })}
            </div>
          )}

          {/* Level 1 gate is `!detail` (the page resource); each branch below
              it gates on its own tab's resource. */}
          {!detail ? (
            activeTab === "Market Info" ? <StockMarketInfoBodySkeleton /> : <StockTabBodySkeleton />
          ) : activeTab === "Market Info" ? (
            <MarketInfoBody detail={detail} />
          ) : activeTab === "Related Product" ? (
            relatedResource.isLoading ? (
              <StockTabBodySkeleton />
            ) : related ? (
              <StockRelatedProductTab related={related} />
            ) : (
              <div className="flex min-h-[240px] items-center justify-center py-10 text-sm text-[#6a7282]">
                {t.stock.detail.noRelated}
              </div>
            )
          ) : activeTab === "Company" ? (
            <StockCompanyTab symbol={detail.symbol} companyName={detail.name} />
          ) : activeTab === "Research" ? (
            <StockResearchTab symbol={detail.symbol} />
          ) : activeTab === "Technical" ? (
            <StockTechnicalTab symbol={detail.symbol} />
          ) : (
            <StockNewsTab symbol={detail.symbol} />
          )}

          {/* Offered, never booked — see `SendProposalButton`. */}
          {detail ? (
            <SendProposalButton
              subject={{ id: offeredProductId("stock", detail.symbol), underlying: detail.symbol, documents: t.stock.detail.proposalDocuments }}
            />
          ) : (
            <StockProposalButtonSkeleton />
          )}
        </div>
      </div>
    </div>
  );
}
