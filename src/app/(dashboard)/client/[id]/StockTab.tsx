"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Chip } from "@sarunyu/system-one";
import {
  ArrowRightIcon,
  BellIcon,
  BowlFoodIcon,
  CaretDownIcon,
  CaretRightIcon,
  CaretUpIcon,
  ChatsCircleIcon,
  ClockCountdownIcon,
  DesktopTowerIcon,
  FactoryIcon,
  FirstAidIcon,
  FireSimpleIcon,
  GlobeIcon,
  HouseLineIcon,
  LightbulbFilamentIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  MoneyWavyIcon,
  PaperPlaneTiltIcon,
  PhoneIcon,
  ShirtFoldedIcon,
  ShoppingBagIcon,
  TrendDownIcon,
  TrendUpIcon,
  WallIcon,
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
  STOCK_SCREENER_CARDS,
  type CrossSellRow,
  type HeatmapLayout,
  type MarketCatalog,
  type MarketId,
  type MarketStatusValue,
  type SectorRow,
  type ServiceCard,
  type StockRow,
  type Trend,
} from "./stock-data";
import { setIndustrySectorHref } from "./stock-industry-sector-data";
import { stockProductHref } from "./stock-product-detail-data";

/** Matches the catalog's other card shadow tokens (`MutualFundCard.tsx`'s
 *  `LIST_CARD_CLASS`), just the slightly heavier variant Figma uses here. */
const CARD_SHADOW = "shadow-[0px_0px_2px_0px_rgba(102,102,102,0.16),0px_4px_8px_0px_rgba(102,102,102,0.12)]";

const TREND_TEXT: Record<Trend, string> = { up: "#008236", down: "#c10007", flat: "#4a5565" };
const TREND_PILL_BG: Record<Trend, string> = { up: "#dbfce7", down: "#fef2f2", flat: "#f3f4f6" };

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

/** Figma "Percent Change" pill — success/danger/neutral tri-state badge used
 *  throughout the Stock tab (market boards, stock rows, sector list). Figma
 *  ships two sizes: "Large" (14px, board index cards) and "Small" (9px,
 *  compact instrument rows) — `size` picks between them. */
const PERCENT_PILL_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "text-[9px] px-1 py-0.5",
  md: "text-xs px-1.5 py-0.5",
  lg: "text-sm px-1.5 py-0.5",
};

function PercentPill({ trend, value, size = "md" }: { trend: Trend; value: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded font-normal whitespace-nowrap ${PERCENT_PILL_SIZE[size]}`}
      style={{ backgroundColor: TREND_PILL_BG[trend], color: TREND_TEXT[trend] }}
    >
      {value}
    </span>
  );
}

/** Figma "Market_status" tag (node 35283:560342) — all 9 status permutations
 *  (Pre-Open/Open/Pre-Close/Closed/Suspend/Halt/Expired/Intermission/Break). */
function MarketStatusTag({ status }: { status: MarketStatusValue }) {
  const s = MARKET_STATUS_STYLE[status];
  return (
    <span
      className="inline-flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-sm"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: s.dot }} aria-hidden />
      {status}
    </span>
  );
}

function SectionHeading({ icon, title, desc }: { icon?: ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-bold text-[18px] leading-6" style={{ color: "rgba(0,0,0,0.75)" }}>
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

function MarketWatchlistRow({
  activeId,
  onChange,
}: {
  activeId: MarketId;
  onChange: (id: MarketId) => void;
}) {
  return (
    <div className="w-full" style={{ backgroundColor: "white" }}>
      <div
        className="flex gap-2 items-center overflow-x-auto hide-scrollbar max-w-[1280px] mx-auto px-4 lg:px-6"
        style={{ scrollbarWidth: "none", paddingTop: 16, paddingBottom: 16 }}
      >
        {MARKET_WATCHLIST.map((m) => (
          <Chip
            key={m.id}
            size="medium"
            label={`${m.flag} ${m.label}`}
            selected={activeId === m.id}
            onClick={() => onChange(m.id as MarketId)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Market status + index boards ────────────────────────────────────────────

function MarketBoardCard({ code, icon, price, changePercent, trend, series }: MarketCatalog["indices"][number]) {
  return (
    <div className="bg-white border border-black/10 rounded-lg p-3 flex flex-col gap-3 flex-1 min-w-[140px]">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex gap-2 items-center">
          <Image src={icon} alt="" width={20} height={20} className="size-5 shrink-0 rounded-full" />
          <p className="font-bold text-base" style={{ color: "#101828" }}>
            {code}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <p className="text-base" style={{ color: "#4a5565" }}>
            {price}
          </p>
          <div className="flex gap-1 items-center">
            <TrendCaret trend={trend} />
            <PercentPill trend={trend} value={changePercent} size="lg" />
          </div>
        </div>
      </div>
      <StockMiniChart series={series} trend={trend} width={166} height={42} className="w-full h-[42px]" />
    </div>
  );
}

function MarketStatusSection({
  indices,
  updatedAt,
}: {
  indices: MarketCatalog["indices"];
  updatedAt: string;
}) {
  return (
    <div className="w-full" style={{ backgroundColor: "white" }}>
      <div className="flex flex-col gap-4 max-w-[1280px] mx-auto px-4 lg:px-6" style={{ paddingBottom: 16 }}>
        <MarketStatusTag status={MARKET_STATUS} />
        <div className="flex gap-3 items-start overflow-x-auto hide-scrollbar" style={{ scrollbarWidth: "none" }}>
          {indices.map((idx) => (
            <MarketBoardCard key={idx.code} {...idx} />
          ))}
        </div>
        <div className="flex gap-2 items-center justify-center w-full">
          <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
            30-Day Data Chart
          </p>
          <span className="h-3 w-px bg-black/10" aria-hidden />
          <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
            {updatedAt}
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
  const className = `flex gap-4 items-center py-4 px-3 w-full text-left ${showBorder ? "border-b border-black/10" : ""} ${onSelect ? "hover:bg-black/[0.02]" : ""}`;
  const inner = (
    <>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex gap-2 items-center h-6">
          {logo && (
            <Image src={logo} alt="" width={24} height={24} className="size-6 shrink-0 object-contain" />
          )}
          <p className="font-bold text-sm truncate" style={{ color: "#101828" }}>
            {symbol}
          </p>
          {featured && (
            <Image src="/products/stock/sparkle-gradient-sm.svg" alt="" width={12} height={12} className="shrink-0" />
          )}
        </div>
        <p className="text-xs truncate" style={{ color: "#6a7282" }}>
          {subtitle}
        </p>
      </div>
      <StockMiniChart series={series} trend={trend} width={48} height={30} className="shrink-0 w-12 h-[30px]" />
      <div className="flex flex-col items-end w-24 shrink-0">
        <div className="flex gap-1 items-baseline font-bold text-sm" style={{ color: "#101828" }}>
          <span>{price}</span>
          <span>{currency}</span>
        </div>
        <div className="flex gap-1 items-center">
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
  const router = useRouter();
  return (
    <div className={`flex-1 flex flex-col bg-white rounded-lg overflow-hidden ${CARD_SHADOW}`}>
      <div className="flex gap-2 items-center px-6 py-3 shrink-0" style={{ backgroundColor: "#f9f9f9" }}>
        <span style={{ color: iconColor }}>{icon}</span>
        <p className="font-bold text-base" style={{ color: "rgba(0,0,0,0.75)" }}>
          {title}
        </p>
      </div>
      <div className="flex flex-col p-3 w-full">
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
  return (
    <div className="relative w-full overflow-hidden" style={{ paddingTop: 40, paddingBottom: 40 }}>
      {/* Figma "Recommend" frame background (asset 86090.png) + white→transparent
       *  fade so the bokeh photo only shows through toward the bottom. */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
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
      <div className="relative z-10 flex flex-col gap-6 max-w-[1280px] mx-auto px-4 lg:px-6">
        <SectionHeading
          icon={<Image src="/products/stock/thumbs-up-gradient.svg" alt="" width={20} height={20} />}
          title="Stock Recommendation"
          desc="Stay on top of all the movements in the capital market."
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <RecommendationCard
            title="Top Gain"
            icon={<TrendUpIcon size={24} weight="fill" />}
            iconColor="#0092b8"
            rows={topGain}
            currency={currency}
          />
          <RecommendationCard
            title="Top Loss"
            icon={<TrendDownIcon size={24} weight="fill" />}
            iconColor="#fb2c36"
            rows={topLoss}
            currency={currency}
          />
          <RecommendationCard
            title="Top Pick"
            icon={<Image src="/products/stock/sparkle-gradient-lg.svg" alt="" width={24} height={24} />}
            iconColor="transparent"
            rows={topPick}
            currency={currency}
          />
        </div>
        <div className="flex gap-2 items-center justify-center w-full">
          <p className="text-xs text-white">30-Day Data Chart</p>
          <span className="h-3 w-px bg-white" aria-hidden />
          <p className="text-xs text-white">{updatedAt}</p>
        </div>
      </div>
    </div>
  );
}

// ── Stock Screener ───────────────────────────────────────────────────────────

const SCREENER_ICONS: Record<string, ReactNode> = {
  trending: <MagnifyingGlassIcon size={24} />,
  highlight: <FireSimpleIcon size={24} />,
  "talk-of-the-town": <ChatsCircleIcon size={24} />,
  realtime: <ClockCountdownIcon size={24} />,
};

function StockScreenerSection() {
  return (
    <div className="w-full bg-white" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div className="flex flex-col gap-4 max-w-[1280px] mx-auto px-4 lg:px-6">
        <div className="flex gap-2 items-center">
          <p className="font-bold text-lg" style={{ color: "#101828" }}>
            Stock Screener
          </p>
          <ArrowRightIcon size={20} style={{ color: "#4a5565" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          {STOCK_SCREENER_CARDS.map((card) => (
            <div
              key={card.id}
              className={`relative flex flex-col gap-2 bg-white rounded-lg p-3 overflow-hidden h-[108px] ${CARD_SHADOW}`}
            >
              <div className="flex gap-1.5 items-center">
                <span
                  className="flex items-center justify-center rounded-full p-1 shrink-0"
                  style={{ backgroundColor: "#fbdfcc", color: "#eb6101" }}
                >
                  {SCREENER_ICONS[card.id]}
                </span>
                <p className="font-bold text-base truncate" style={{ color: "#eb6101" }}>
                  {card.title}
                </p>
              </div>
              <p className="text-sm line-clamp-2" style={{ color: "#4a5565" }}>
                {card.desc}
              </p>
              {/* Figma "Symbol_Text" watermark (asset 9bbbe.svg) — faint brand
               *  mark peeking from the bottom-right corner, clipped by the
               *  card's overflow-hidden. */}
              <Image
                src="/products/stock/screener-watermark.svg"
                alt=""
                width={72}
                height={72}
                aria-hidden
                className="absolute -right-[19px] -bottom-[19px] pointer-events-none"
              />
            </div>
          ))}
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
}) {
  return (
    <div
      className={`flex gap-6 items-center py-6 px-6 w-full ${showBorder ? "border-b border-black/10" : ""}`}
    >
      <div className="flex gap-4 items-center flex-1 min-w-0">
        <div className="flex flex-col flex-1 min-w-0 gap-0.5">
          <p className="font-bold text-sm truncate" style={{ color: "#101828" }}>
            {symbol}
          </p>
          <p className="text-sm truncate" style={{ color: "#6a7282" }}>
            {subtitle}
          </p>
        </div>
        <StockMiniChart series={series} trend={trend} width={96} height={42} className="shrink-0 w-24 h-[42px]" />
        <div className="flex flex-col items-end w-[120px] shrink-0 gap-0.5">
          <div className="flex gap-1 items-baseline font-bold text-sm" style={{ color: "#101828" }}>
            <span>{price}</span>
            <span>{currency}</span>
          </div>
          {trend === "flat" ? (
            <span className="text-sm" style={{ color: "#6a7282" }}>
              {changeAmount}
            </span>
          ) : (
            <div className="flex gap-1.5 items-center">
              <span className="text-sm" style={{ color: TREND_TEXT[trend] }}>
                {changeAmount}
              </span>
              <PercentPill trend={trend} value={changePercent} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
  const header = (
    <div
      className="flex gap-2 items-center justify-between px-6 py-4"
      style={{ background: `linear-gradient(to bottom, ${headerFrom}, #ffffff)` }}
    >
      <div className="flex gap-2 items-center">
        {icon}
        <p className="font-bold text-base" style={{ color: "#101828" }}>
          {title}
        </p>
      </div>
      <ArrowRightIcon size={20} style={{ color: "#4a5565" }} className="shrink-0" />
    </div>
  );
  return (
    <div className={`flex flex-col bg-white rounded-lg overflow-hidden ${CARD_SHADOW}`}>
      {onNavigate ? (
        <button type="button" onClick={onNavigate} className="text-left w-full hover:brightness-[0.98] transition-[filter]">
          {header}
        </button>
      ) : (
        header
      )}
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
          />
        ))}
      </div>
      <div className="flex gap-2 items-center justify-center px-3 py-4 text-xs" style={{ color: "#6a7282" }}>
        <span>30-Day Data Chart</span>
        <span className="h-3 w-px bg-black/10" aria-hidden />
        <span>{MARKET_LATEST_UPDATE}</span>
      </div>
    </div>
  );
}

function CrossSellSection({
  onViewAll,
  catalog,
}: {
  onViewAll?: () => void;
  catalog: MarketCatalog;
}) {
  const isUsEtf = catalog.crossSell === "etf-gain-loss";
  const router = useRouter();
  return (
    <div className="relative w-full overflow-hidden" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <Image
        src="/products/stock/crosssell-bg.jpg"
        alt=""
        fill
        aria-hidden
        className="object-cover pointer-events-none"
        sizes="100vw"
      />
      <div className="relative flex flex-col gap-6 max-w-[1280px] mx-auto px-4 lg:px-6">
        {isUsEtf ? (
          <div className="flex gap-2 items-center w-full">
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <p className="font-bold text-[18px] leading-6" style={{ color: "rgba(0,0,0,0.75)" }}>
                ETF (Exchange Traded Fund)
              </p>
              <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
                Index funds can be traded in the same way as stocks
              </p>
            </div>
            <ArrowRightIcon size={20} style={{ color: "#4a5565" }} className="shrink-0" />
          </div>
        ) : (
          <SectionHeading
            title="Open up opportunities in other assets through the Thai market."
            desc="Accessing other investments has become more convenient."
          />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          {isUsEtf ? (
            <>
              <div className={`flex flex-col bg-white rounded-lg overflow-hidden ${CARD_SHADOW}`}>
                <div className="flex gap-2 items-center px-6 py-3" style={{ backgroundColor: "#f9f9f9" }}>
                  <TrendUpIcon size={24} weight="fill" className="text-[#0092b8]" />
                  <p className="font-bold text-base" style={{ color: "rgba(0,0,0,0.75)" }}>
                    Top Gain
                  </p>
                </div>
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
                    />
                  ))}
                </div>
              </div>
              <div className={`flex flex-col bg-white rounded-lg overflow-hidden ${CARD_SHADOW}`}>
                <div className="flex gap-2 items-center px-6 py-3" style={{ backgroundColor: "#f9f9f9" }}>
                  <TrendDownIcon size={24} weight="fill" className="text-[#fb2c36]" />
                  <p className="font-bold text-base" style={{ color: "rgba(0,0,0,0.75)" }}>
                    Top Loss
                  </p>
                </div>
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
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <CrossSellCard
                title="DR (Depositary Receipt)"
                icon={<PaperPlaneTiltIcon size={24} className="text-[#0084d1]" />}
                headerFrom="#e7f3fb"
                rows={STOCK_DR_ROWS}
                onNavigate={() => router.push("/product-catalog/stock/dr")}
              />
              <CrossSellCard
                title="ETF (Exchange Traded Fund)"
                icon={<GlobeIcon size={24} className="text-[#d08700]" />}
                headerFrom="#faf3e5"
                rows={STOCK_ETF_ROWS}
                onNavigate={() => router.push("/product-catalog/stock/etf")}
              />
            </>
          )}
        </div>
        <div className="flex flex-col gap-3 items-center w-full">
          <div className="flex gap-2 items-center justify-center">
            <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
              30-Day Data Chart
            </p>
            <span className="h-3 w-px bg-black/10" aria-hidden />
            <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
              {MARKET_LATEST_UPDATE}
            </p>
          </div>
          <Button variant="plain" size="sm" onClick={onViewAll}>
            See More
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── SET Industry Sector (list + heatmap) ────────────────────────────────────

const SECTOR_ICON = {
  resources: LightningIcon,
  services: BellIcon,
  industrials: FactoryIcon,
  "consumer-products": ShoppingBagIcon,
  "agro-food": BowlFoodIcon,
  financials: MoneyWavyIcon,
  technology: DesktopTowerIcon,
  "property-construction": HouseLineIcon,
  energy: LightningIcon,
  material: WallIcon,
  "consumer-discretionary": ShoppingBagIcon,
  "consumer-staples": ShirtFoldedIcon,
  "health-care": FirstAidIcon,
  "information-technology": DesktopTowerIcon,
  "communication-services": PhoneIcon,
  utilities: LightbulbFilamentIcon,
  "real-estate": HouseLineIcon,
} as const;

function SectorGlyph({ id, size }: { id: string; size: number }) {
  const Icon = SECTOR_ICON[id as keyof typeof SECTOR_ICON];
  return Icon ? <Icon size={size} weight="fill" /> : null;
}

function SectorListRow({
  sector,
  showBorder,
  onNavigate,
}: {
  sector: SectorRow;
  showBorder: boolean;
  onNavigate?: () => void;
}) {
  const inner = (
    <>
      <div className="flex gap-4 items-center flex-1 min-w-0">
        {/* Figma "Sector_list" row icons render solid brand blue regardless of
         *  the sector's own trend color (node 26739:57814 family). */}
        <span style={{ color: "#0a6ee7" }}>
          <SectorGlyph id={sector.id} size={20} />
        </span>
        <p className="flex-1 text-base truncate" style={{ color: "#4a5565" }}>
          {sector.name}
        </p>
      </div>
      {sector.trend === "flat" ? (
        <span className="text-sm" style={{ color: "rgba(0,0,0,0.35)" }}>
          {sector.changePercent}
        </span>
      ) : sector.listAccent === "teal" ? (
        <div className="flex gap-2 items-center justify-end">
          <span className="text-sm" style={{ color: "#00786f" }}>
            {sector.changeAmount}
          </span>
          <span
            className="inline-flex shrink-0 items-center rounded font-normal whitespace-nowrap text-xs px-1.5 py-0.5"
            style={{ backgroundColor: "#f0fdfa" }}
          >
            <span style={{ color: "#008236" }}>+</span>
            <span style={{ color: "#00786f" }}>
              {sector.changePercent.replace(/^[+-]/, "")}
            </span>
          </span>
        </div>
      ) : (
        <div className="flex gap-2 items-center justify-end">
          <span className="text-sm" style={{ color: TREND_TEXT[sector.trend] }}>
            {sector.changeAmount}
          </span>
          <PercentPill trend={sector.trend} value={sector.changePercent} />
        </div>
      )}
      <CaretRightIcon size={24} className="text-[#4a5565] shrink-0" />
    </>
  );
  const className = `flex gap-4 items-center px-6 py-4 w-full ${showBorder ? "border-b border-black/10" : ""}`;
  if (onNavigate) {
    return (
      <button type="button" onClick={onNavigate} className={`${className} text-left w-full hover:bg-black/[0.02] transition-colors`}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

const HEATMAP_TILE_BG: Record<Trend, string> = { up: "#f0fdf4", down: "#fef2f2", flat: "#f9fafb" };
const HEATMAP_TILE_BORDER: Record<Trend, string> = { up: "#b9f8cf", down: "#ffe2e2", flat: "#e5e7eb" };
/** Figma's "Heat map เมื่อมีแค่ 2 Sectors" permutation (node 25177:23062) uses
 *  a bolder green/300 & red/400 palette for its two hero tiles instead of the
 *  soft pastel one the crowded 8-sector grid uses. */
const HEATMAP_TILE_BG_BOLD: Record<Trend, string> = { up: "#b9f8cf", down: "#ffa2a2", flat: "#e5e7eb" };
const HEATMAP_TILE_BORDER_BOLD: Record<Trend, string> = { up: "#7bf1a8", down: "#ff6467", flat: "#d1d5dc" };
const HEATMAP_TILE_BG_MID: Record<Trend, string> = { up: "#dbfce7", down: "#ffe2e2", flat: "#f3f3f3" };
const HEATMAP_TILE_BORDER_MID: Record<Trend, string> = { up: "#b9f8cf", down: "#ffc9c9", flat: "rgba(0,0,0,0.08)" };
const HEATMAP_TEXT: Record<Trend, string> = { up: "#008236", down: "#c10007", flat: "#6a7282" };

/** Figma "Sector_list" heatmap tile (node 22907:32081 family) has 3 distinct
 *  typographic tiers, not just a size split: "lg" (Resources/Services/
 *  Industrials — 24px icon, 14px label+value, 14px pill), "md" (Consumer
 *  Products/Agro & Food — 20px icon, 12px caption label+value, 9px pill),
 *  and "xs" (Financials/Technology/Property — 16px icon, plain 9px gray
 *  label+value, no pill). */
function HeatmapTile({
  sector,
  variant,
  palette = "soft",
  style,
}: {
  sector: SectorRow;
  variant: "lg" | "md" | "sm" | "xs";
  palette?: "soft" | "mid" | "bold";
  style?: CSSProperties;
}) {
  const trend = sector.heatmapTrend ?? sector.trend;
  const changeAmount = sector.heatmapChangeAmount ?? sector.changeAmount;
  const changePercent = sector.heatmapChangePercent ?? sector.changePercent;
  const bg = palette === "bold" ? HEATMAP_TILE_BG_BOLD : palette === "mid" ? HEATMAP_TILE_BG_MID : HEATMAP_TILE_BG;
  const border = palette === "bold" ? HEATMAP_TILE_BORDER_BOLD : palette === "mid" ? HEATMAP_TILE_BORDER_MID : HEATMAP_TILE_BORDER;
  const iconSize = variant === "lg" ? 24 : variant === "xs" ? 16 : 20;
  const label = sector.heatmapName ?? sector.name;
  const wrap = label.includes("\n");
  const iconColor = variant === "xs" || trend === "flat" ? "#6a7282" : HEATMAP_TEXT[trend];
  const keepIconInline = variant === "sm" && wrap;

  return (
    <div
      className={`flex rounded-lg p-2 min-h-0 min-w-0 w-full self-stretch ${
        keepIconInline ? "items-start" : "flex-wrap items-center"
      } ${
        variant === "lg" ? "gap-2 content-start" : variant === "xs" ? "gap-1.5 content-center" : "gap-1.5 content-start"
      }`}
      style={{
        backgroundColor: bg[trend],
        border: `1px solid ${border[trend]}`,
        ...style,
      }}
    >
      <span className="shrink-0" style={{ color: iconColor }}>
        <SectorGlyph id={sector.id} size={iconSize} />
      </span>
      {variant === "lg" && (
        <>
          <span className={`text-sm shrink-0 ${wrap ? "whitespace-pre" : "whitespace-nowrap"}`} style={{ color: "#101828" }}>
            {label}
          </span>
          <span className="text-sm" style={{ color: HEATMAP_TEXT[trend] }}>
            {changeAmount}
          </span>
          {trend !== "flat" && <PercentPill trend={trend} value={changePercent} size="lg" />}
        </>
      )}
      {variant === "md" && (
        <>
          <span className={`text-sm min-w-10 shrink-0 ${wrap ? "whitespace-pre" : ""}`} style={{ color: "#4a5565" }}>
            {label}
          </span>
          <span className="text-sm" style={{ color: HEATMAP_TEXT[trend] }}>
            {changeAmount}
          </span>
          {trend !== "flat" && <PercentPill trend={trend} value={changePercent} size="lg" />}
        </>
      )}
      {variant === "sm" && wrap && (
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs leading-4 whitespace-pre" style={{ color: "#101828" }}>
            {label}
          </span>
          <div className="flex gap-1 items-center">
            <span className="text-xs" style={{ color: HEATMAP_TEXT[trend] }}>
              {changeAmount}
            </span>
            {trend !== "flat" && <PercentPill trend={trend} value={changePercent} size="sm" />}
          </div>
        </div>
      )}
      {variant === "sm" && !wrap && (
        <>
          <span className="text-xs shrink-0 leading-4" style={{ color: "#101828" }}>
            {label}
          </span>
          <span className="text-xs" style={{ color: HEATMAP_TEXT[trend] }}>
            {changeAmount}
          </span>
          {trend !== "flat" && <PercentPill trend={trend} value={changePercent} size="sm" />}
        </>
      )}
      {variant === "xs" && (
        <>
          <span className="text-[9px] flex-1 min-w-10 truncate" style={{ color: "#4a5565" }}>
            {label}
          </span>
          <span className="text-[9px] shrink-0" style={{ color: "#6a7282" }}>
            {changePercent}
          </span>
        </>
      )}
    </div>
  );
}

function UsSectorHeatmap({ byId }: { byId: Record<string, SectorRow> }) {
  return (
    <div className="hidden lg:flex gap-1.5 w-[556px] shrink-0 self-stretch">
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <HeatmapTile sector={byId.energy} variant="lg" palette="bold" style={{ flex: "1 1 0%" }} />
        <HeatmapTile sector={byId.material} variant="lg" palette="bold" style={{ flex: "1 1 0%" }} />
      </div>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex flex-col gap-1.5 flex-1 min-h-0">
          <HeatmapTile sector={byId.industrials} variant="lg" palette="mid" style={{ flex: "1 1 0%" }} />
          <div className="flex gap-1.5 min-h-0" style={{ flex: "1 1 0%" }}>
            <HeatmapTile sector={byId["consumer-discretionary"]} variant="md" />
            <HeatmapTile sector={byId["consumer-staples"]} variant="md" palette="mid" />
          </div>
          <div className="flex gap-1.5 shrink-0">
            <HeatmapTile sector={byId["health-care"]} variant="sm" palette="mid" style={{ flex: "1 1 0%" }} />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <HeatmapTile
                sector={byId["communication-services"]}
                variant="sm"
                style={{ flex: "1 1 0%" }}
              />
              <HeatmapTile sector={byId.utilities} variant="sm" />
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0" style={{ height: 50 }}>
          <HeatmapTile sector={byId.financials} variant="sm" palette="mid" style={{ flex: "1 1 0%" }} />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <HeatmapTile sector={byId["information-technology"]} variant="xs" />
            <HeatmapTile sector={byId["real-estate"]} variant="xs" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Figma ships three heatmap permutations:
 *  - "Heat map เมื่อมีแค่ 2 Sectors" (node 25177:23062) — stacked hero tiles.
 *  - The full 8-sector Thai treemap (node 22907:295581).
 *  - US GICS treemap (node 23219:37166) — Energy/Material heroes plus a denser
 *    right column that also packs Health Care, Communication, Utilities.
 */
function SectorHeatmap({ sectors, layout }: { sectors: SectorRow[]; layout: HeatmapLayout }) {
  const tiles = sectors.filter((s) => s.inHeatmap !== false);
  if (tiles.length === 0) return null;
  const byId = Object.fromEntries(tiles.map((s) => [s.id, s])) as Record<string, SectorRow>;

  if (layout === "treemap-us") {
    return <UsSectorHeatmap byId={byId} />;
  }

  if (layout === "compact-2" || tiles.length <= 2) {
    return (
      <div className="hidden lg:flex gap-1.5 w-[556px] shrink-0 self-stretch">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0 h-full">
          <HeatmapTile sector={tiles[0]} variant="lg" palette="bold" style={{ flex: "235 1 0%" }} />
          {tiles[1] && (
            <HeatmapTile sector={tiles[1]} variant="lg" palette="bold" style={{ flex: "207 1 0%" }} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex gap-1.5 flex-1 min-w-0 self-stretch">
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <HeatmapTile sector={byId.resources} variant="lg" style={{ flex: "235 1 0%" }} />
        <HeatmapTile sector={byId.services} variant="lg" style={{ flex: "207 1 0%" }} />
      </div>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex flex-col gap-1.5 flex-1 min-h-0">
          <HeatmapTile sector={byId.industrials} variant="lg" style={{ flex: "118 1 0%" }} />
          <div className="flex gap-1.5 min-h-0" style={{ flex: "94 1 0%" }}>
            <div className="w-[108px] shrink-0">
              <HeatmapTile sector={byId["consumer-products"]} variant="md" />
            </div>
            <div className="flex-1 min-w-0">
              <HeatmapTile sector={byId["agro-food"]} variant="md" />
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-1 min-h-0">
          <div className="flex-1 min-w-0">
            <HeatmapTile sector={byId.financials} variant="xs" />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex-1 min-h-0">
              <HeatmapTile sector={byId.technology} variant="xs" />
            </div>
            <div className="flex-1 min-h-0">
              <HeatmapTile sector={byId["property-construction"]} variant="xs" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SetIndustrySectorSection({
  sectors,
  layout,
  linkSectors,
}: {
  sectors: SectorRow[];
  layout: HeatmapLayout;
  /** When true, list rows open the SET Industry Sector detail route (Thai catalog). */
  linkSectors?: boolean;
}) {
  const router = useRouter();
  return (
    <div className={`flex flex-col gap-4 bg-white rounded-xl p-6 w-full ${CARD_SHADOW}`}>
      <div className="flex gap-4 items-center justify-between w-full flex-wrap">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-lg" style={{ color: "#101828" }}>
            SET Industry Sector
          </p>
          <p className="text-sm" style={{ color: "#4a5565" }}>
            Select stocks with strong fundamentals from sectors you like.
          </p>
        </div>
        <p className="text-xs shrink-0" style={{ color: "#6a7282" }}>
          {MARKET_LATEST_UPDATE}
        </p>
      </div>
      <div className="flex gap-10 items-stretch w-full">
        <div className="flex-1 min-w-0">
          {sectors.map((s, i) => (
            <SectorListRow
              key={s.id}
              sector={s}
              showBorder={i < sectors.length - 1}
              onNavigate={
                linkSectors ? () => router.push(setIndustrySectorHref(s.id)) : undefined
              }
            />
          ))}
        </div>
        <SectorHeatmap sectors={sectors} layout={layout} />
      </div>
    </div>
  );
}

// ── Essential Investment Services ───────────────────────────────────────────

function ServiceCardTile({ service }: { service: ServiceCard }) {
  const blob =
    service.blob === null
      ? null
      : (service.blob ?? "/products/stock/services/bg-blob.svg");
  const bottom = service.mockupBottom ?? (service.gradient ? -15 : -10);
  const right = service.mockupRight ?? (service.gradient ? 13 : -15);
  return (
    <div
      className={`relative flex flex-1 min-w-[327px] max-w-[389px] flex-col gap-1 rounded-lg px-4 py-3 overflow-hidden h-[120px] ${CARD_SHADOW}`}
      style={{ background: service.gradient ?? "#ffffff" }}
    >
      {blob && (
        <Image
          src={blob}
          alt=""
          width={208}
          height={208}
          aria-hidden
          className="absolute pointer-events-none"
          style={{ bottom: -122, right: -62 }}
        />
      )}
      <div className="flex gap-3 items-center w-full relative z-10">
        <p className="flex-1 font-bold text-sm" style={{ color: "rgba(0,0,0,0.75)" }}>
          {service.title}
        </p>
        <ArrowRightIcon size={20} style={{ color: "#4a5565" }} className="shrink-0" />
      </div>
      <p className="text-xs w-[220px] relative z-10" style={{ color: "rgba(0,0,0,0.6)" }}>
        {service.desc}
      </p>
      <Image
        src={service.mockup}
        alt=""
        width={service.mockupWidth}
        height={service.mockupHeight}
        aria-hidden
        unoptimized={Boolean(service.mockupMixBlend)}
        className="absolute pointer-events-none object-cover"
        style={{
          bottom,
          right,
          mixBlendMode: service.mockupMixBlend,
          opacity: service.mockupOpacity,
        }}
      />
    </div>
  );
}

function EssentialServicesSection({
  title,
  desc,
  services,
}: {
  title: string;
  desc: string;
  services: ServiceCard[];
}) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1">
        <p className="font-bold text-lg" style={{ color: "#101828" }}>
          {title}
        </p>
        <p className="text-sm" style={{ color: "#4a5565" }}>
          {desc}
        </p>
      </div>
      <div className="flex flex-wrap gap-4 w-full">
        {services.map((service) => (
          <ServiceCardTile key={service.id} service={service} />
        ))}
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
export function StockTab({ onCrossSellViewAll }: { onCrossSellViewAll?: () => void } = {}) {
  const [marketId, setMarketId] = useState<MarketId>("th");
  const catalog = MARKET_CATALOG[marketId] ?? MARKET_CATALOG.th;
  return (
    <div className="flex flex-col w-full">
      <MarketWatchlistRow activeId={marketId} onChange={setMarketId} />
      <MarketStatusSection indices={catalog.indices} updatedAt={catalog.indicesUpdatedAt} />
      <StockRecommendationSection
        topGain={catalog.topGain}
        topLoss={catalog.topLoss}
        topPick={catalog.topPick}
        currency={catalog.currency}
        updatedAt={MARKET_LATEST_UPDATE}
      />
      <StockScreenerSection />
      <CrossSellSection onViewAll={onCrossSellViewAll} catalog={catalog} />
      <div className="w-full bg-white" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="flex flex-col gap-6 max-w-[1280px] mx-auto px-4 lg:px-6">
          <SetIndustrySectorSection
            sectors={catalog.sectors}
            layout={catalog.heatmapLayout}
            linkSectors={marketId === "th"}
          />
          <EssentialServicesSection
            title={catalog.servicesTitle}
            desc={catalog.servicesDesc}
            services={catalog.services}
          />
        </div>
      </div>
    </div>
  );
}
