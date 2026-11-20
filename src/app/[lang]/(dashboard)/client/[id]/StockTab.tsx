"use client";

import { type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useAppPathname, useLocalizedRouter } from "@/i18n/navigation";
import Image from "next/image";
import { Button, Chip } from "@sarunyu/system-one";
import {
  ArrowRightIcon,
  CaretDownIcon,
  CaretUpIcon,
  GlobeIcon,
  MinusIcon,
  PaperPlaneTiltIcon,
  TrendDownIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";
import { StockMiniChart } from "./StockMiniChart";
import {
  MARKET_CATALOG,
  MARKET_LATEST_UPDATE,
  MARKET_STATUS,
  MARKET_STATUS_STYLE,
  MARKET_WATCHLIST,
  STOCK_DR_ROWS,
  STOCK_ETF_ROWS,
  type CrossSellRow,
  type MarketCatalog,
  type MarketId,
  type MarketStatusValue,
  type StockRow,
  type Trend,
} from "./stock-data";
import { stockProductHref } from "./stock-product-detail-data";
import { marketIndexHref } from "./stock-index-data";
import { SetIndustrySectorSection } from "./IndustrySectorSection";
import { CARD_SHADOW, PercentPill, StockSectionEmpty, TREND_TEXT } from "./stock-ui";
import { setQueryState, withQuery } from "@/lib/query-state";
import { useMarketCatalog } from "@/hooks/use-catalog";
import { StockTabSkeleton } from "./StockTabSkeleton";
import { useT } from "@/i18n/I18nProvider";

function TrendCaret({ trend, size = 16 }: { trend: Trend; size?: number }) {
  if (trend === "up")
    return (
      <span className="text-[#008236]">
        <CaretUpIcon size={size} weight="fill" />
      </span>
    );
  if (trend === "down")
    return (
      <span className="text-[#c10007]">
        <CaretDownIcon size={size} weight="fill" />
      </span>
    );
  return (
    <span className="text-[#99a1af]">
      <MinusIcon size={size} weight="bold" />
    </span>
  );
}

/** Figma "Market_status" tag (node 35283:560342) — all 9 status permutations
 *  (Pre-Open/Open/Pre-Close/Closed/Suspend/Halt/Expired/Intermission/Break). */
function MarketStatusTag({ status }: { status: MarketStatusValue }) {
  const t = useT();
  const s = MARKET_STATUS_STYLE[status];
  return (
    <span
      className="inline-flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-sm"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: s.dot }}
        aria-hidden
      />
      {t.stock.marketStatus[status] ?? status}
    </span>
  );
}

function SectionHeading({ icon, title, desc }: { icon?: ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-title leading-[28px] font-bold" style={{ color: "rgba(0,0,0,0.75)" }}>
          {title}
        </p>
      </div>
      {desc && (
        <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
          {desc}
        </p>
      )}
    </div>
  );
}

// ── Market watchlist chips ──────────────────────────────────────────────────

/** `?market=` — omitted from the URL while it holds its default value. */
const MARKET_PARAM = "market";
const DEFAULT_MARKET: MarketId = "th";

function normalizeMarketId(value: string | null | undefined): MarketId {
  return value && value in MARKET_CATALOG ? (value as MarketId) : DEFAULT_MARKET;
}

function MarketWatchlistRow({
  activeId,
  onChange,
}: {
  activeId: MarketId;
  onChange: (id: MarketId) => void;
}) {
  const t = useT();
  return (
    <div className="w-full" style={{ backgroundColor: "white" }}>
      <div
        className="hide-scrollbar mx-auto flex max-w-[1280px] items-center gap-2 overflow-x-auto px-4 lg:px-6"
        style={{ scrollbarWidth: "none", paddingTop: 16, paddingBottom: 16 }}
      >
        {MARKET_WATCHLIST.map((m) => (
          <Chip
            key={m.id}
            size="medium"
            label={`${m.flag} ${t.stock.markets[m.id] ?? m.id}`}
            selected={activeId === m.id}
            onClick={() => onChange(m.id as MarketId)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Market status + index boards ────────────────────────────────────────────

function MarketBoardCard({
  code,
  icon,
  price,
  changePercent,
  trend,
  series,
  onSelect,
}: MarketCatalog["indices"][number] & { onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      // Same lift as `StockLargeAssetCard`, the Stock tab's other clickable
      // card. Trailing `!` on the paint properties because system-one ships its
      // base utilities unlayered, where they outrank a plain `hover:` variant.
      className="flex min-w-[140px] flex-1 cursor-pointer flex-col gap-3 rounded-lg border border-black/10 bg-white p-3 text-left transition-[background-color,border-color,box-shadow] hover:border-[#0a6ee7]/25! hover:bg-[#fafafa]! hover:shadow-[0px_2px_8px_rgba(0,0,0,0.08)] focus-visible:ring-2 focus-visible:ring-[#0a6ee7] focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center gap-2">
          <Image
            src={icon}
            alt=""
            width={20}
            height={20}
            className="size-5 shrink-0 rounded-full"
          />
          <p className="text-base font-bold" style={{ color: "#101828" }}>
            {code}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-base" style={{ color: "#4a5565" }}>
            {price}
          </p>
          <div className="flex items-center gap-1">
            <TrendCaret trend={trend} />
            <PercentPill trend={trend} value={changePercent} size="lg" />
          </div>
        </div>
      </div>
      <StockMiniChart
        series={series}
        trend={trend}
        width={166}
        height={42}
        className="h-[42px] w-full"
      />
    </button>
  );
}

function MarketStatusSection({
  indices,
  market,
  updatedAt,
}: {
  indices: MarketCatalog["indices"];
  market: MarketId;
  updatedAt: string;
}) {
  const t = useT();
  const router = useLocalizedRouter();
  return (
    <div className="w-full" style={{ backgroundColor: "white" }}>
      <div
        className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 lg:px-6"
        style={{ paddingBottom: 16 }}
      >
        <MarketStatusTag status={MARKET_STATUS} />
        {/* `py-1 -my-1` costs no layout but stops the scroller clipping the
            cards' hover shadow. */}
        {indices.length === 0 ? (
          <StockSectionEmpty title={t.stock.empty.indices} />
        ) : (
          <div
            className="hide-scrollbar -my-1 flex items-start gap-3 overflow-x-auto py-1"
            style={{ scrollbarWidth: "none" }}
          >
            {indices.map((idx) => (
              <MarketBoardCard
                key={idx.code}
                {...idx}
                onSelect={() => router.push(marketIndexHref(idx.code, market))}
              />
            ))}
          </div>
        )}
        <div className="flex w-full items-center justify-center gap-2">
          <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
            {t.stock.chart30Day}
          </p>
          <span className="h-3 w-px bg-black/10" aria-hidden />
          <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
            {t.stock.latestUpdate(updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Shared instrument row (Stock Recommendation + DR/ETF cross-sell) ───────

function InstrumentRow({
  symbol,
  subtitle,
  price,
  changeAmount,
  changePercent,
  trend,
  series,
  featured,
  showBorder,
  currency = "THB",
  logo,
  onSelect,
}: {
  symbol: string;
  subtitle: string;
  price: string;
  changeAmount: string;
  changePercent: string;
  trend: Trend;
  series: number[];
  featured?: boolean;
  showBorder: boolean;
  currency?: string;
  logo?: string;
  onSelect?: () => void;
}) {
  const className = `flex gap-4 items-center py-4 px-3 w-full text-left ${showBorder ? "border-b border-black/10" : ""} ${onSelect ? "cursor-pointer hover:bg-black/[0.02] transition-colors" : ""}`;
  const inner = (
    <>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-6 items-center gap-2">
          {logo && (
            <Image
              src={logo}
              alt=""
              width={24}
              height={24}
              className="size-6 shrink-0 object-contain"
            />
          )}
          <p className="truncate text-sm font-bold" style={{ color: "#101828" }}>
            {symbol}
          </p>
          {featured && (
            <Image
              src="/products/stock/sparkle-gradient-sm.svg"
              alt=""
              width={12}
              height={12}
              className="shrink-0"
            />
          )}
        </div>
        <p className="truncate text-xs" style={{ color: "#6a7282" }}>
          {subtitle}
        </p>
      </div>
      <StockMiniChart
        series={series}
        trend={trend}
        width={48}
        height={30}
        className="h-[30px] w-12 shrink-0"
      />
      <div className="flex w-24 shrink-0 flex-col items-end">
        <div className="flex items-baseline gap-1 text-sm font-bold" style={{ color: "#101828" }}>
          <span>{price}</span>
          <span>{currency}</span>
        </div>
        <div className="flex items-center gap-1">
          {trend === "flat" ? (
            <span className="text-xs" style={{ color: "#6a7282" }}>
              {changeAmount}
            </span>
          ) : (
            <>
              <span className="text-xs" style={{ color: TREND_TEXT[trend] }}>
                {changeAmount}
              </span>
              <PercentPill trend={trend} value={changePercent} size="sm" />
            </>
          )}
        </div>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={className}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}

// ── Stock Recommendation ────────────────────────────────────────────────────

function RecommendationCard({
  title,
  icon,
  iconColor,
  rows,
  currency,
}: {
  title: string;
  icon: ReactNode;
  iconColor: string;
  rows: StockRow[];
  currency: string;
}) {
  const t = useT();
  const router = useLocalizedRouter();
  return (
    <div className={`flex flex-1 flex-col overflow-hidden rounded-lg bg-white ${CARD_SHADOW}`}>
      <div
        className="flex shrink-0 items-center gap-2 px-6 py-3"
        style={{ backgroundColor: "#f9f9f9" }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
        <p className="text-base font-bold" style={{ color: "rgba(0,0,0,0.75)" }}>
          {title}
        </p>
      </div>
      {rows.length === 0 ? (
        <StockSectionEmpty title={t.stock.empty.stocks} />
      ) : (
        <div className="flex w-full flex-col p-3">
          {rows.map((row, i) => (
            <InstrumentRow
              key={`${row.symbol}-${i}`}
              symbol={row.symbol}
              subtitle={row.name}
              price={row.price}
              changeAmount={row.changeAmount}
              changePercent={row.changePercent}
              trend={row.trend}
              series={row.series}
              featured={row.featured}
              logo={row.logo}
              currency={currency}
              showBorder={i < rows.length - 1}
              onSelect={() => router.push(stockProductHref(row.symbol))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StockRecommendationSection({
  topGain,
  topLoss,
  topPick,
  currency,
  updatedAt,
}: {
  topGain: StockRow[];
  topLoss: StockRow[];
  topPick: StockRow[];
  currency: string;
  updatedAt: string;
}) {
  const t = useT();
  return (
    <div className="relative w-full overflow-hidden" style={{ paddingTop: 40, paddingBottom: 40 }}>
      {/* Figma "Recommend" frame background (asset 86090.png) + white→transparent
       *  fade so the bokeh photo only shows through toward the bottom. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/products/stock/recommendation-bg.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, white 0%, rgba(255,255,255,0) 50%)" }}
        />
      </div>
      <div className="relative z-10 mx-auto flex max-w-[1280px] flex-col gap-6 px-4 lg:px-6">
        <SectionHeading
          icon={
            <Image src="/products/stock/thumbs-up-gradient.svg" alt="" width={20} height={20} />
          }
          title={t.stock.tab.recommendationTitle}
          desc={t.stock.tab.recommendationDesc}
        />
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
          <RecommendationCard
            title={t.stock.tab.topGain}
            icon={<TrendUpIcon size={24} weight="fill" />}
            iconColor="#0092b8"
            rows={topGain}
            currency={currency}
          />
          <RecommendationCard
            title={t.stock.tab.topLoss}
            icon={<TrendDownIcon size={24} weight="fill" />}
            iconColor="#fb2c36"
            rows={topLoss}
            currency={currency}
          />
          <RecommendationCard
            title={t.stock.tab.topPick}
            icon={
              <Image src="/products/stock/sparkle-gradient-lg.svg" alt="" width={24} height={24} />
            }
            iconColor="transparent"
            rows={topPick}
            currency={currency}
          />
        </div>
        <div className="flex w-full items-center justify-center gap-2">
          <p className="text-xs text-white">{t.stock.chart30Day}</p>
          <span className="h-3 w-px bg-white" aria-hidden />
          <p className="text-xs text-white">{t.stock.latestUpdate(updatedAt)}</p>
        </div>
      </div>
    </div>
  );
}

// ── Open up opportunities (DR / ETF cross-sell) ─────────────────────────────

/** Figma "Asset Card" row (node 22907:35325 family) — a roomier variant of
 *  `InstrumentRow` used only in the DR/ETF cross-sell cards: bigger chart
 *  (96×42) and 24px padding. */
function CrossSellInstrumentRow({
  symbol,
  subtitle,
  price,
  changeAmount,
  changePercent,
  trend,
  series,
  showBorder,
  currency = "THB",
  onSelect,
}: {
  symbol: string;
  subtitle: string;
  price: string;
  changeAmount: string;
  changePercent: string;
  trend: Trend;
  series: number[];
  showBorder: boolean;
  currency?: string;
  /** Opens the instrument's own detail page. Optional for the same reason
   *  `InstrumentRow`'s is: a row with nothing behind it renders inert rather
   *  than looking clickable and doing nothing. */
  onSelect?: () => void;
}) {
  const className = `flex gap-6 items-center py-6 px-6 w-full text-left ${showBorder ? "border-b border-black/10" : ""} ${onSelect ? "cursor-pointer hover:bg-black/[0.02] transition-colors" : ""}`;
  const inner = (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-bold" style={{ color: "#101828" }}>
          {symbol}
        </p>
        <p className="truncate text-sm" style={{ color: "#6a7282" }}>
          {subtitle}
        </p>
      </div>
      <StockMiniChart
        series={series}
        trend={trend}
        width={96}
        height={42}
        className="h-[42px] w-24 shrink-0"
      />
      <div className="flex w-[120px] shrink-0 flex-col items-end gap-0.5">
        <div className="flex items-baseline gap-1 text-sm font-bold" style={{ color: "#101828" }}>
          <span>{price}</span>
          <span>{currency}</span>
        </div>
        {trend === "flat" ? (
          <span className="text-sm" style={{ color: "#6a7282" }}>
            {changeAmount}
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-sm" style={{ color: TREND_TEXT[trend] }}>
              {changeAmount}
            </span>
            <PercentPill trend={trend} value={changePercent} />
          </div>
        )}
      </div>
    </div>
  );

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={className}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}

function CrossSellCard({
  title,
  icon,
  headerFrom,
  rows,
  onNavigate,
}: {
  title: string;
  icon: ReactNode;
  /** Header wash fades from this color (top) to white (bottom) — matches
   *  the Figma "BG overlay" mask gradient rather than a flat pastel fill. */
  headerFrom: string;
  rows: CrossSellRow[];
  /** Opens the product's full asset-card list (Figma "3.4 DR_detail" /
   *  "3.6 ETF_detail") — omit to render the header as a plain, unclickable
   *  label. */
  onNavigate?: () => void;
}) {
  const t = useT();
  const router = useLocalizedRouter();
  // Nothing to list, nothing to open: the header stays a plain label.
  const canNavigate = !!onNavigate && rows.length > 0;
  const header = (
    <div
      className="flex items-center justify-between gap-2 px-6 py-4"
      style={{ background: `linear-gradient(to bottom, ${headerFrom}, #ffffff)` }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-base font-bold" style={{ color: "#101828" }}>
          {title}
        </p>
      </div>
      {canNavigate && (
        <ArrowRightIcon size={20} style={{ color: "#4a5565" }} className="shrink-0" />
      )}
    </div>
  );
  return (
    <div className={`flex flex-col overflow-hidden rounded-lg bg-white ${CARD_SHADOW}`}>
      {canNavigate ? (
        <button
          type="button"
          onClick={onNavigate}
          className="w-full cursor-pointer text-left transition-[filter] hover:brightness-[0.98]"
        >
          {header}
        </button>
      ) : (
        header
      )}
      {rows.length === 0 ? (
        <StockSectionEmpty title={t.stock.empty.crossSell} />
      ) : (
        <div className="flex flex-col px-6">
          {rows.map((row, i) => (
            <CrossSellInstrumentRow
              key={`${row.symbol}-${i}`}
              symbol={row.symbol}
              subtitle={row.subtitle}
              price={row.price}
              changeAmount={row.changeAmount}
              changePercent={row.changePercent}
              trend={row.trend}
              series={row.series}
              currency={row.currency ?? "THB"}
              showBorder={i < rows.length - 1}
              onSelect={() => router.push(stockProductHref(row.symbol))}
            />
          ))}
        </div>
      )}
      <div
        className="flex items-center justify-center gap-2 px-3 py-4 text-xs"
        style={{ color: "#6a7282" }}
      >
        <span>{t.stock.chart30Day}</span>
        <span className="h-3 w-px bg-black/10" aria-hidden />
        <span>{t.stock.latestUpdate(MARKET_LATEST_UPDATE)}</span>
      </div>
    </div>
  );
}

function CrossSellSection({ catalog }: { catalog: MarketCatalog }) {
  const t = useT();
  const isUsEtf = catalog.crossSell === "etf-gain-loss";
  const router = useLocalizedRouter();
  return (
    <div className="relative w-full overflow-hidden" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <Image
        src="/products/stock/crosssell-bg.jpg"
        alt=""
        fill
        aria-hidden
        className="pointer-events-none object-cover"
        sizes="100vw"
      />
      <div className="relative mx-auto flex max-w-[1280px] flex-col gap-6 px-4 lg:px-6">
        {isUsEtf ? (
          <div className="flex w-full items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p
                className="text-title leading-[28px] font-bold"
                style={{ color: "rgba(0,0,0,0.75)" }}
              >
                {t.stock.tab.etfTitle}
              </p>
              <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
                {t.stock.tab.etfDesc}
              </p>
            </div>
            <Button
              variant="plain"
              size="icon-sm"
              onClick={() => router.push("/product-catalog/stock/etf")}
              aria-label={t.stock.tab.viewAll}
              className="shrink-0"
            >
              <ArrowRightIcon size={20} style={{ color: "#4a5565" }} />
            </Button>
          </div>
        ) : (
          <SectionHeading title={t.stock.tab.crossSellTitle} desc={t.stock.tab.crossSellDesc} />
        )}
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
          {isUsEtf ? (
            <>
              <div className={`flex flex-col overflow-hidden rounded-lg bg-white ${CARD_SHADOW}`}>
                <div
                  className="flex items-center gap-2 px-6 py-3"
                  style={{ backgroundColor: "#f9f9f9" }}
                >
                  <TrendUpIcon size={24} weight="fill" className="text-[#0092b8]" />
                  <p className="text-base font-bold" style={{ color: "rgba(0,0,0,0.75)" }}>
                    {t.stock.tab.topGain}
                  </p>
                </div>
                {catalog.etfGain.length === 0 ? (
                  <StockSectionEmpty title={t.stock.empty.crossSell} />
                ) : (
                  <div className="flex flex-col">
                    {catalog.etfGain.map((row, i) => (
                      <CrossSellInstrumentRow
                        key={`${row.symbol}-${i}`}
                        symbol={row.symbol}
                        subtitle={row.subtitle}
                        price={row.price}
                        changeAmount={row.changeAmount}
                        changePercent={row.changePercent}
                        trend={row.trend}
                        series={row.series}
                        currency={row.currency ?? catalog.currency}
                        showBorder={i < catalog.etfGain.length - 1}
                        onSelect={() => router.push(stockProductHref(row.symbol))}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className={`flex flex-col overflow-hidden rounded-lg bg-white ${CARD_SHADOW}`}>
                <div
                  className="flex items-center gap-2 px-6 py-3"
                  style={{ backgroundColor: "#f9f9f9" }}
                >
                  <TrendDownIcon size={24} weight="fill" className="text-[#fb2c36]" />
                  <p className="text-base font-bold" style={{ color: "rgba(0,0,0,0.75)" }}>
                    {t.stock.tab.topLoss}
                  </p>
                </div>
                {catalog.etfLoss.length === 0 ? (
                  <StockSectionEmpty title={t.stock.empty.crossSell} />
                ) : (
                  <div className="flex flex-col">
                    {catalog.etfLoss.map((row, i) => (
                      <CrossSellInstrumentRow
                        key={`${row.symbol}-${i}`}
                        symbol={row.symbol}
                        subtitle={row.subtitle}
                        price={row.price}
                        changeAmount={row.changeAmount}
                        changePercent={row.changePercent}
                        trend={row.trend}
                        series={row.series}
                        currency={row.currency ?? catalog.currency}
                        showBorder={i < catalog.etfLoss.length - 1}
                        onSelect={() => router.push(stockProductHref(row.symbol))}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <CrossSellCard
                title={t.stock.tab.drTitle}
                icon={<PaperPlaneTiltIcon size={24} className="text-[#0084d1]" />}
                headerFrom="#e7f3fb"
                rows={STOCK_DR_ROWS}
                onNavigate={() => router.push("/product-catalog/stock/dr")}
              />
              <CrossSellCard
                title={t.stock.tab.etfTitle}
                icon={<GlobeIcon size={24} className="text-[#d08700]" />}
                headerFrom="#faf3e5"
                rows={STOCK_ETF_ROWS}
                onNavigate={() => router.push("/product-catalog/stock/etf")}
              />
            </>
          )}
        </div>
        <div className="flex w-full flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
              {t.stock.chart30Day}
            </p>
            <span className="h-3 w-px bg-black/10" aria-hidden />
            <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
              {t.stock.latestUpdate(MARKET_LATEST_UPDATE)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

/**
 * Content for the Product Catalog's "Stock" tab (Figma: "3.2 Stock - Thai",
 * node 20862:117604). Intentionally covers only the content region — the
 * search bar and category tabs above it are the shared ones every other tab
 * in `ProductCatalogTab` already renders.
 */
export function StockTab() {
  const pathname = useAppPathname();
  const searchParams = useSearchParams();
  // The market chip is view state, so it lives in the URL like the category tab
  // above it — that's what lets the breadcrumb trail (which stores whole URLs)
  // bring the user back to US Market after they drill into a product.
  const marketId = normalizeMarketId(searchParams.get(MARKET_PARAM));
  const { data: catalog, isLoading } = useMarketCatalog(marketId);
  if (isLoading) return <StockTabSkeleton />;
  return (
    <div className="flex w-full flex-col">
      <MarketWatchlistRow
        activeId={marketId}
        onChange={(id) =>
          // `push`, like the category tab: switching markets is a step the
          // browser's back button should be able to walk out of.
          setQueryState(
            withQuery(pathname, searchParams, {
              [MARKET_PARAM]: id === DEFAULT_MARKET ? null : id,
            }),
            "push",
          )
        }
      />
      <MarketStatusSection
        indices={catalog.indices}
        market={marketId}
        updatedAt={catalog.indicesUpdatedAt}
      />
      <StockRecommendationSection
        topGain={catalog.topGain}
        topLoss={catalog.topLoss}
        topPick={catalog.topPick}
        currency={catalog.currency}
        updatedAt={MARKET_LATEST_UPDATE}
      />
      <CrossSellSection catalog={catalog} />
      <div className="w-full bg-white" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SetIndustrySectorSection
            sectors={catalog.sectors}
            layout={catalog.heatmapLayout}
            sectorsMarket={catalog.sectorsMarket}
          />
        </div>
      </div>
    </div>
  );
}
