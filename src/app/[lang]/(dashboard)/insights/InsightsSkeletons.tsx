import { Skeleton } from "@/components/ui/skeleton";

const ASSET_FILTER_COUNT = 7;

export function FilterChipsSkeleton() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Array.from({ length: ASSET_FILTER_COUNT }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
      ))}
    </div>
  );
}

/** Mirrors PlaybookCard: colored left bar + tag pill + title + rationale lines. */
function PlaybookLines({ lines = 2 }: { lines?: number }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-2">
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
    <div className="hidden lg:flex rounded-2xl border border-border bg-card overflow-hidden flex-row">
      <div className="flex-1 min-w-0 flex gap-4 p-6">
        <Skeleton className="w-1 shrink-0 self-stretch" />
        <PlaybookLines lines={2} />
      </div>
      <div className="flex flex-col border-l border-border lg:w-[45%] shrink-0 divide-y divide-border">
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
    <div className="flex w-full min-h-[116px] rounded-2xl border border-border bg-card overflow-hidden">
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
    <div className="flex flex-col gap-8 w-full">
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
      <div className="border-t border-border pt-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 flex flex-col items-center gap-3">
      <Skeleton className="size-10 rounded-xl" />
      <div className="flex flex-col items-center gap-1.5 w-full">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-3 w-20" />
    </div>
  );
}
