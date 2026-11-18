"use client";

import { Fragment } from "react";
import { Card } from "@sarunyu/system-one";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the detail page's shape, so it doesn't jump when the data arrives.
 * Bound to `useCampaign().isLoading` — see `@/hooks/use-api` for why the
 * resource carries the flag rather than the screen owning one.
 */
export function CampaignDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5 pb-12 sm:gap-6">
      <Skeleton className="hidden h-7 w-16 rounded-full xl:block" />

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-white">
        <Skeleton className="h-[200px] rounded-none sm:h-[260px] xl:h-[300px]" />
        <div className="hidden border-t border-border/50 xl:flex xl:items-stretch">
          {Array.from({ length: 4 }).map((_, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <div aria-hidden className="w-px shrink-0 self-stretch bg-border/50" />
              )}
              <div className="flex min-w-0 flex-1 items-start gap-3 p-4 sm:p-5">
                <Skeleton className="size-10 shrink-0 rounded-xl" />
                <div className="flex w-full flex-col gap-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      <div
        className="flex flex-col gap-5 lg:grid lg:gap-6"
        style={{ gridTemplateColumns: "minmax(0, 1fr) 360px", alignItems: "start" }}
      >
        <div className="flex min-w-0 flex-col gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-2xl border border-border/50 p-5 sm:p-6"
            >
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
          <Skeleton className="h-[320px] rounded-2xl" />
        </div>

        <Card variant="default" className="gap-4 rounded-2xl">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[112px] rounded-xl" />
          ))}
        </Card>
      </div>
    </div>
  );
}
