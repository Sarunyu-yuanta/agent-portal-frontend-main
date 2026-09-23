"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Chip } from "@sarunyu/system-one";
import {
  ArrowRightIcon,
  CaretDownIcon,
  CaretUpIcon,
  ChatsCircleIcon,
  ClockCountdownIcon,
  FireSimpleIcon,
  GlobeIcon,
  MagnifyingGlassIcon,
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
  STOCK_SCREENER_CARDS,
  type CrossSellRow,
  type MarketCatalog,
  type MarketId,
  type MarketStatusValue,
  type ServiceCard,
  type StockRow,
  type Trend,
} from "./stock-data";
import { stockProductHref } from "./stock-product-detail-data";
import { SetIndustrySectorSection } from "./IndustrySectorSection";
import { CARD_SHADOW, PercentPill, TREND_TEXT } from "./stock-ui";

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

function CrossSellSection({ catalog }: { catalog: MarketCatalog }) {
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
            <Button
              variant="plain"
              size="icon-sm"
              onClick={() => router.push("/product-catalog/stock/etf")}
              aria-label="ดูทั้งหมด"
              className="shrink-0"
            >
              <ArrowRightIcon size={20} style={{ color: "#4a5565" }} />
            </Button>
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
        </div>
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
export function StockTab() {
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
      <CrossSellSection catalog={catalog} />
      <div className="w-full bg-white" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="flex flex-col gap-6 max-w-[1280px] mx-auto px-4 lg:px-6">
          <SetIndustrySectorSection
            title={catalog.sectorsTitle}
            sectors={catalog.sectors}
            layout={catalog.heatmapLayout}
            sectorsMarket={catalog.sectorsMarket}
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
