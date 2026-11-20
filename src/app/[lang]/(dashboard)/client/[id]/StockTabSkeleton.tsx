import { Skeleton } from "@/components/ui/skeleton";

/** One index board (`MarketBoardCard`): code, price + change pill, mini chart. */
function MarketBoardCardSkeleton() {
  return (
    <div className="flex min-w-[140px] flex-1 flex-col gap-3 rounded-lg border border-black/10 bg-white p-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-14" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
      </div>
      <Skeleton className="h-[42px] w-full" />
    </div>
  );
}

/** One `RecommendationCard`: tinted header, then three instrument rows. */
function RecommendationCardSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-black/5 bg-white">
      <div className="flex items-center gap-2 px-6 py-3" style={{ backgroundColor: "#f9f9f9" }}>
        <Skeleton className="size-6 shrink-0 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex flex-col p-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-4 ${i < 2 ? "border-b border-black/10" : ""}`}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-4 w-full max-w-[140px]" />
            </div>
            <Skeleton className="h-8 w-[72px] shrink-0" />
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Stands in for `StockTab` while its market's data is loading. Covers the
 * market chips, status tag, index boards and the recommendation cards — the
 * part above the fold. Nothing in it is a control: the market can't be switched
 * and no card can be opened before there is data behind it.
 */
export function StockTabSkeleton() {
  return (
    <div className="flex w-full flex-col" aria-busy="true">
      {/* Market chips (MarketWatchlistRow) */}
      <div className="w-full bg-white">
        <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-4 lg:px-6">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>

      {/* Status tag + index boards (MarketStatusSection) */}
      <div className="w-full bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pb-4 lg:px-6">
          <Skeleton className="h-7 w-16" />
          <div className="flex items-start gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <MarketBoardCardSkeleton key={i} />
            ))}
          </div>
          <Skeleton className="h-4 w-72 max-w-full self-center" />
        </div>
      </div>

      {/* Stock Recommendation */}
      <div className="w-full bg-white py-10">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <RecommendationCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
