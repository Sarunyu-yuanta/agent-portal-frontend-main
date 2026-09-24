"use client";

import { useState } from "react";
import Image from "next/image";
import { ChartLineUpIcon, FunnelSimpleIcon } from "@phosphor-icons/react";
import { StockLargeAssetCard } from "./StockLargeAssetCard";
import { StockCrossSellFilterModal } from "./StockCrossSellFilterModal";
import {
  CatalogDetailBackHeader,
  CATALOG_DETAIL_WIDTH,
  useCatalogDetailScrollTop,
} from "./ProductCatalogTabbedDetailLayout";
import {
  STOCK_CROSS_SELL_DETAIL,
  STOCK_CROSS_SELL_DETAIL_ROWS,
  STOCK_FILTER_ISSUERS,
  MARKET_LATEST_UPDATE,
  type StockCrossSellKind,
} from "./stock-data";

// Same 996px column every other product-catalog drill-in page uses (SET
// Industry Sector, mutual-fund theme detail, …) — not this page's own
// invention, so its side padding matches its siblings' at every breakpoint.
const NARROW = CATALOG_DETAIL_WIDTH.narrow;

/**
 * Figma "3.4 DR_detail" / "3.5 DR_filter" / "3.6 ETF_detail" / "3.7 ETF_filter"
 * (nodes 23228:37812, 23228:41356, 23228:38277, 23228:38758) — the page a
 * DR or ETF cross-sell card's arrow opens into: hero banner, asset count +
 * Filter button, and the full asset-card grid. DR and ETF differ only in
 * copy/gradient/filter options, so one component serves both `kind`s.
 */
export function StockCrossSellDetail({
  kind,
  onBack,
}: {
  kind: StockCrossSellKind;
  onBack: () => void;
}) {
  const config = STOCK_CROSS_SELL_DETAIL[kind];
  const rows = STOCK_CROSS_SELL_DETAIL_ROWS;

  const [filterOpen, setFilterOpen] = useState(false);
  const [issuerIds, setIssuerIds] = useState<string[]>(config.defaultIssuerIds);
  const [countryIds, setCountryIds] = useState<string[]>(config.defaultCountryIds);

  useCatalogDetailScrollTop([kind]);

  const filterCount = issuerIds.length + countryIds.length;

  return (
    // No column `gap` here on purpose: Figma's "Warp" column (node 23228:37813)
    // gaps the header and the hero banner by 16px, and a container gap would
    // apply that spacing *below* the hero too — leaving a white strip between
    // the banner and the list panel, which is meant to sit flush against it.
    <div className="flex w-full flex-col bg-white">
      <CatalogDetailBackHeader title={config.title} onBack={onBack} className="!pt-8 !pb-4" />

      <div className="relative w-full overflow-hidden" style={{ background: config.gradient }}>
        <div className={`relative flex items-center gap-6 py-10 ${NARROW}`}>
          <div
            className="flex shrink-0 items-center justify-center rounded-full p-2"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%)" }}
          >
            <ChartLineUpIcon size={48} weight="regular" className="text-white" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-2xl font-bold leading-9 text-white [text-shadow:0px_1px_3px_rgba(0,0,0,0.05),0px_1px_2px_rgba(0,0,0,0.1)]">
              {config.title}
            </p>
            <p className="whitespace-pre-line text-base leading-5 text-white">{config.description}</p>
          </div>
          <div
            className="pointer-events-none absolute right-0 top-[18px] hidden size-[237px] rounded-full bg-white/20 md:block"
            aria-hidden
          />
          <div className="pointer-events-none absolute right-[34px] top-[34px] hidden h-[132px] w-[169px] md:block" aria-hidden>
            <Image
              src={config.heroImage}
              alt=""
              fill
              sizes="169px"
              unoptimized={Boolean(config.heroImageBlend)}
              className="object-contain"
              style={config.heroImageBlend ? { mixBlendMode: config.heroImageBlend } : undefined}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-t-3xl bg-[#f9fafb] pt-6 pb-16">
        <div className={`flex flex-col gap-4 ${NARROW}`}>
          <div className="flex w-full items-center gap-2 border-b border-black/10 py-3">
            <p className="flex-1 text-base" style={{ color: "#4a5565" }}>
              100 Lists
            </p>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              // Brand-light tint on hover, the same `#eff6ff` the sort
              // dropdown marks its selected row with. Trailing `!` because
              // system-one ships its base utilities unlayered, where they
              // outrank a plain `hover:` variant.
              className="relative flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-black/10 bg-[#f9fafb] py-2 pr-3.5 pl-2.5 transition-colors hover:border-[#0a6ee7]/25! hover:bg-[#eff6ff]!"
            >
              <FunnelSimpleIcon size={20} style={{ color: "#0a6ee7" }} />
              <span className="text-sm font-semibold" style={{ color: "#0a6ee7" }}>
                Filter
              </span>
              {filterCount > 0 && (
                <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-[#0a6ee7] text-[10px] font-medium text-white">
                  {filterCount}
                </span>
              )}
            </button>
          </div>
          <p className="w-full text-xs" style={{ color: "#6a7282" }}>
            {MARKET_LATEST_UPDATE}
          </p>
          <div className="grid w-full grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            {[...rows, ...rows].map((row, i) => (
              <StockLargeAssetCard
                key={`${row.symbol}-${i}`}
                symbol={row.symbol}
                subtitle={row.subtitle}
                price={row.price}
                currency={row.currency}
                changeAmount={row.changeAmount}
                changePercent={row.changePercent}
                trend={row.trend}
                series={row.series}
              />
            ))}
          </div>
        </div>
      </div>

      {filterOpen && (
        <StockCrossSellFilterModal
          showIssuerFilter={config.showIssuerFilter}
          issuers={STOCK_FILTER_ISSUERS}
          countries={config.countries}
          initialIssuerIds={issuerIds}
          initialCountryIds={countryIds}
          onClose={() => setFilterOpen(false)}
          onConfirm={(nextIssuers, nextCountries) => {
            setIssuerIds(nextIssuers);
            setCountryIds(nextCountries);
            setFilterOpen(false);
          }}
        />
      )}
    </div>
  );
}
