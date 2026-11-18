import { Skeleton } from "@/components/ui/skeleton";

/** One index board (`MarketBoardCard`): code, price + change pill, mini chart. */
function MarketBoardCardSkeleton() {
  return (
    <div className="bg-white border border-black/10 rounded-lg p-3 flex flex-col gap-3 flex-1 min-w-[140px]">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <Skeleton className="size-5 rounded-full shrink-0" />
          <Skeleton className="h-5 w-14" />
        </div>
        <div className="flex gap-2 items-center">
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
    <div className="flex-1 flex flex-col bg-white rounded-lg overflow-hidden border border-black/5">
      <div className="flex gap-2 items-center px-6 py-3" style={{ backgroundColor: "#f9f9f9" }}>
        <Skeleton className="size-6 rounded-full shrink-0" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex flex-col p-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-4 ${i < 2 ? "border-b border-black/10" : ""}`}
          >
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-4 w-full max-w-[140px]" />
            </div>
            <Skeleton className="h-8 w-[72px] shrink-0" />
            <div className="flex flex-col items-end gap-2 shrink-0">
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
    <div className="flex flex-col w-full" aria-busy="true">
      {/* Market chips (MarketWatchlistRow) */}
      <div className="w-full bg-white">
        <div className="flex gap-2 items-center max-w-[1280px] mx-auto px-4 lg:px-6 py-4">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>

      {/* Status tag + index boards (MarketStatusSection) */}
      <div className="w-full bg-white">
        <div className="flex flex-col gap-4 max-w-[1280px] mx-auto px-4 lg:px-6 pb-4">
          <Skeleton className="h-7 w-16" />
          <div className="flex gap-3 items-start overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <MarketBoardCardSkeleton key={i} />
            ))}
          </div>
          <Skeleton className="h-4 w-72 max-w-full self-center" />
        </div>
      </div>

      {/* Stock Recommendation */}
      <div className="w-full bg-white py-10">
        <div className="flex flex-col gap-6 max-w-[1280px] mx-auto px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            {Array.from({ length: 3 }).map((_, i) => (
              <RecommendationCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
