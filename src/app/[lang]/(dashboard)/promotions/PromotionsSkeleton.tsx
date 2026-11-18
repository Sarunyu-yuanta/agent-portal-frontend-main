"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { PROMOTIONS_GRID_CSS } from "./promotions-grid-css";

/**
 * Mirrors the list page's shape, so it doesn't jump when the data arrives.
 *
 * Bound to `useCampaigns().isLoading`, which is `false` today and starts going
 * `true` the moment that hook is given a real endpoint — see `@/hooks/use-api`
 * for why the resource carries the flag rather than the screen owning one.
 */
export function PromotionsSkeleton() {
  return (
    <div className="flex flex-col gap-4 xl:gap-5">
      {/* Its own copy rather than the page's: this also serves as the Suspense
          fallback, which renders before the page component exists. */}
      <style>{PROMOTIONS_GRID_CSS}</style>
      {/* The toolbar: tabs left, search and the filter button right. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <div className="flex items-center gap-2.5 md:ml-auto md:shrink-0">
          <Skeleton className="h-[38px] flex-1 rounded-lg md:w-[320px] md:flex-none" />
          <Skeleton className="h-9 w-[116px] shrink-0 rounded-lg" />
        </div>
      </div>

      <div className="promotions-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[386px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
