import { Skeleton } from "@/components/ui/skeleton";
import { CATALOG_DETAIL_WIDTH } from "@/features/catalog/components/ProductCatalogTabbedDetailLayout";

/**
 * Loading states for the Product Catalog › Stock drill-ins: market index,
 * industry sector, single ticker, and the DR / ETF "view all" pages. Each
 * keeps its screen's container, padding and max-width so nothing jumps when
 * the data lands, and none of them has a control in it — no back button, tab,
 * sort dropdown, range chip or filter can be pressed before there is data.
 */

const NARROW = CATALOG_DETAIL_WIDTH.narrow;

/** `CatalogDetailBackHeader`: 30px back button + h1, same row box. */
function BackHeaderSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`${NARROW} ${className}`}>
      <div className="flex h-[46px] items-center gap-2 py-2 lg:pt-6 lg:pb-2">
        <Skeleton className="size-[30px] shrink-0 rounded-md" />
        <Skeleton className="h-6 w-48 max-w-full" />
      </div>
    </div>
  );
}

/** One `CatalogDetailTextTabs` tab: px-3 py-2.5, 24px line, 1.5px underline. */
function TextTabSkeleton({ fill, width }: { fill: boolean; width: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-1.5 border-b-[1.5px] border-black/10 px-3 py-2.5 ${
        fill ? "min-w-0 flex-1" : "shrink-0"
      }`}
    >
      <Skeleton className="size-5 shrink-0 rounded-full" />
      <Skeleton className={`my-1 h-4 ${width}`} />
    </div>
  );
}

/** The sticky tab strip under the header. `fill` mirrors the real prop: the
 *  index board's few short codes stretch; the sector names keep their width,
 *  clip at the edge, and are flanked by the 32px scroll arrows. */
function TabStripSkeleton({ count, fill }: { count: number; fill: boolean }) {
  const tabs = (
    <div className="flex w-full overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <TextTabSkeleton key={i} fill={fill} width={fill ? "w-12" : i % 2 ? "w-24" : "w-32"} />
      ))}
    </div>
  );
  return (
    <div className="w-full bg-white">
      <div className={NARROW}>
        {fill ? (
          tabs
        ) : (
          <div className="flex w-full items-center gap-4">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">{tabs}</div>
            <Skeleton className="size-8 shrink-0 rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Hero band shared by the index and sector pages: 64px glyph, name +
 *  description, and the quote on the right (price + 220×48 sparkline for an
 *  index, just the change for a sector). */
function HeroBandSkeleton({ withChart }: { withChart: boolean }) {
  return (
    <div className="w-full bg-[var(--fill-gray-100)]">
      <div className="mx-auto flex max-w-[996px] flex-wrap items-center gap-6 px-4 py-10 md:px-8 lg:px-0">
        <Skeleton className="size-16 shrink-0 rounded-full bg-[var(--fill-gray-300)]" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="my-1.5 h-6 w-32 bg-[var(--fill-gray-300)]" />
          <Skeleton className="my-1 h-4 w-full max-w-[420px] bg-[var(--fill-gray-300)]" />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {withChart ? (
            <>
              <Skeleton className="my-1.5 h-6 w-56 bg-[var(--fill-gray-300)]" />
              <Skeleton className="h-12 w-[220px] bg-[var(--fill-gray-300)]" />
            </>
          ) : (
            <Skeleton className="my-1 h-6 w-36 bg-[var(--fill-gray-300)]" />
          )}
        </div>
      </div>
    </div>
  );
}

/** `StockLargeAssetCard`: symbol/name, 96×42 mini chart, price/change column. */
function AssetCardSkeleton() {
  return (
    <div className="flex w-full items-center gap-6 rounded-lg border-b border-black/10 bg-white p-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Skeleton className="my-1 h-4 w-16" />
          <Skeleton className="my-1 h-4 w-full max-w-[140px]" />
        </div>
        <Skeleton className="h-[42px] w-24 shrink-0" />
        <div className="flex w-[120px] shrink-0 flex-col items-end gap-0.5">
          <Skeleton className="my-1 h-4 w-24" />
          <Skeleton className="my-1 h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

/** `StockDetailList`: "N Lists" + sort dropdown, latest-update line, card grid. */
function StockDetailListSkeleton() {
  return (
    <div className="w-full flex-1 pb-16">
      <div className={`flex flex-col gap-6 pt-4 ${NARROW}`}>
        <div className="flex w-full flex-col gap-3">
          <div className="flex w-full items-center gap-2 border-b border-black/10 px-3 py-3">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-10 w-[136px] shrink-0 rounded-lg" />
          </div>
          <Skeleton className="mx-3 my-1 h-3 w-48" />
        </div>
        <div className="grid w-full grid-cols-1 gap-x-4 gap-y-6 lg:grid-cols-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <AssetCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DrillInSkeleton({
  tabs,
  fillTabs,
  heroChart,
}: {
  tabs: number;
  fillTabs: boolean;
  heroChart: boolean;
}) {
  return (
    <div aria-busy="true" className="flex min-h-full w-full flex-1 flex-col bg-neutral-50">
      <div className="bg-white pb-2">
        <BackHeaderSkeleton className="!pt-8" />
      </div>
      <TabStripSkeleton count={tabs} fill={fillTabs} />
      <HeroBandSkeleton withChart={heroChart} />
      <StockDetailListSkeleton />
    </div>
  );
}

/** Stands in for `MarketIndexDetail`. */
export function MarketIndexDetailSkeleton() {
  return <DrillInSkeleton tabs={5} fillTabs heroChart />;
}

/** Stands in for `SetIndustrySectorDetail`. */
export function SetIndustrySectorDetailSkeleton() {
  return <DrillInSkeleton tabs={8} fillTabs={false} heroChart={false} />;
}

/** Stands in for `StockCrossSellDetail` (DR / ETF): header, gradient hero,
 *  "100 Lists" + Filter row, and the two-column asset grid. */
export function StockCrossSellDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex w-full flex-col bg-white">
      <BackHeaderSkeleton className="!pt-8 !pb-4" />

      <div className="w-full bg-[var(--fill-gray-100)]">
        <div className={`flex items-center gap-6 py-10 ${NARROW}`}>
          <Skeleton className="size-16 shrink-0 rounded-full bg-[var(--fill-gray-300)]" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="my-1.5 h-6 w-40 bg-[var(--fill-gray-300)]" />
            <Skeleton className="my-1 h-4 w-full max-w-[480px] bg-[var(--fill-gray-300)]" />
            <Skeleton className="my-1 h-4 w-2/3 max-w-[320px] bg-[var(--fill-gray-300)]" />
          </div>
          <Skeleton className="hidden h-[132px] w-[169px] shrink-0 rounded-2xl bg-[var(--fill-gray-300)] md:block" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-t-3xl bg-neutral-50 pt-6 pb-16">
        <div className={`flex flex-col gap-4 ${NARROW}`}>
          <div className="flex w-full items-center gap-2 border-b border-black/10 py-3">
            <div className="flex-1">
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-10 w-[92px] shrink-0 rounded-lg" />
          </div>
          <Skeleton className="h-3 w-48" />
          <div className="grid w-full grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <AssetCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** One side of the Order Book / Time&Sales row: heading + bordered box. */
function MarketPanelSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
      <Skeleton className="my-1 h-5 w-28" />
      <div className="flex w-full flex-col gap-3 rounded-xl border border-black/10 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex w-full items-center justify-between gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── `StockProductDetail` loading parts ─────────────────────────────────────
 * The ticker screen draws these itself while its quote loads, with a
 * `TabsSkeleton` for its tab strip. Once the quote is in, `StockTabBodySkeleton`
 * also stands in for any one tab whose own resource is still loading. */

/** Symbol + name row and the market-status tag above the white card. */
export function StockDetailHeaderSkeleton() {
  return (
    <div className="flex items-center gap-2 pt-1 pr-2 pb-2 lg:pt-0">
      <Skeleton className="size-[30px] shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Skeleton className="my-1 h-5 w-56 max-w-full" />
        <Skeleton className="h-7 w-16 rounded" />
      </div>
    </div>
  );
}

/** `QuoteBlock`: price, change, timestamp, market pill, day's range, stats. */
export function StockQuoteBlockSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4 pt-3 pb-4">
      <div className="flex w-full items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Skeleton className="my-2 h-11 w-40" />
          <Skeleton className="my-0.5 h-5 w-32" />
          <Skeleton className="my-1 h-3 w-36" />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <div className="flex flex-col items-end gap-0.5">
            <Skeleton className="my-1 h-4 w-20" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-9 w-full max-w-[320px] rounded-2xl" />
    </div>
  );
}

/** `MarketInfoBody`: quote chart + range chips, then Order Book + Time&Sales. */
export function StockMarketInfoBodySkeleton() {
  return (
    <>
      <div className="flex w-full flex-col">
        <Skeleton className="h-[227px] w-full rounded-lg" />
        <div className="mt-6 w-full">
          <Skeleton className="mx-auto h-10 w-full max-w-[343px] rounded-full" />
        </div>
      </div>
      <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
        <MarketPanelSkeleton rows={8} />
        <MarketPanelSkeleton rows={8} />
      </div>
    </>
  );
}

/** Any other detail tab: a heading and a few blocks of rows. */
export function StockTabBodySkeleton() {
  return (
    <div className="flex w-full flex-col gap-6">
      {[4, 3].map((rows, i) => (
        <div key={i} className="flex w-full flex-col gap-4">
          <Skeleton className="my-1 h-5 w-40" />
          <div className="flex w-full flex-col gap-3 rounded-xl border border-black/10 p-4">
            {Array.from({ length: rows }).map((_, j) => (
              <div key={j} className="flex w-full items-center justify-between gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** `SendProposalButton`. */
export function StockProposalButtonSkeleton() {
  return (
    <div className="flex w-full flex-col items-center">
      <Skeleton className="h-12 w-full max-w-[343px] rounded-xl" />
    </div>
  );
}
