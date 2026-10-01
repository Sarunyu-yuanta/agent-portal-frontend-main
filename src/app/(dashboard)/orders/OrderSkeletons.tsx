import { Skeleton } from "@/components/ui/skeleton";

/**
 * The Order Management list while its books are still resolving.
 *
 * Shaped like the cards it stands in for — title, progress bar, footer line —
 * so the page doesn't reflow when the real rows land. It renders nothing today
 * (`isLoading` is permanently `false` behind the store), and is wired up so
 * that giving orders an endpoint lights it up without touching the page.
 */
export function OrderBooksSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-[8px] border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-56" />
        </div>
      ))}
    </div>
  );
}

/** One book's page while the product and its bookings resolve. */
export function OrderBookDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-[8px] border border-border bg-card p-5">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 rounded-[8px] border border-border bg-card p-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
