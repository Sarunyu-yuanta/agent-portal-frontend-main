import { Skeleton } from "@/components/ui/skeleton";

const ASSET_FILTER_COUNT = 7;

export function FilterChipsSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {Array.from({ length: ASSET_FILTER_COUNT }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
      ))}
    </div>
  );
}

/** Mirrors PlaybookCard: colored left bar + tag pill + title + rationale lines. */
function PlaybookLines({ lines = 2 }: { lines?: number }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

/** Matches the "featured + compact list" combined card used for the first period group. */
function FeaturedGroupSkeleton() {
  return (
    <div className="hidden flex-row overflow-hidden rounded-2xl border border-border bg-card lg:flex">
      <div className="flex min-w-0 flex-1 gap-4 p-6">
        <Skeleton className="w-1 shrink-0 self-stretch" />
        <PlaybookLines lines={2} />
      </div>
      <div className="flex shrink-0 flex-col divide-y divide-border border-l border-border lg:w-[45%]">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-4">
            <Skeleton className="w-1 shrink-0 self-stretch" />
            <PlaybookLines lines={1} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Matches PlaybookCardCompact, used in the plain grid for later period groups. */
export function CompactCardSkeleton() {
  return (
    <div className="flex min-h-[116px] w-full overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="w-1 shrink-0" />
      <div className="flex-1 p-4">
        <PlaybookLines lines={1} />
      </div>
    </div>
  );
}

/** Matches StrategyPlaybooks: filter chips, then period groups (featured + grid). */
export function StrategyPlaybooksSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8">
      <FilterChipsSkeleton />
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-5 w-28" />
        </div>
        <FeaturedGroupSkeleton />
        <div className="flex flex-col gap-3 lg:hidden">
          <CompactCardSkeleton />
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CompactCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Matches AIRecommendCard's dashed-border shell. */
export function AIRecommendCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-6">
      <Skeleton className="size-10 rounded-xl" />
      <div className="flex w-full flex-col items-center gap-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-3 w-20" />
    </div>
  );
}
