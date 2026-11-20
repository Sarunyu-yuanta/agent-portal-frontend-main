import { Skeleton } from "@/components/ui/skeleton";

/**
 * The month grid while notes load: the same card, toolbar, weekday header,
 * six flex rows and legend strip as `CalendarView`, so the swap to the real
 * grid doesn't move anything.
 */
export function CalendarPageSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="ml-2 h-6 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg max-sm:w-8" />
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-7 border-b border-[rgba(0,0,0,0.12)]">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex justify-center px-2 py-2">
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {Array.from({ length: 6 }).map((_, row) => (
          <div
            key={row}
            className="grid min-h-0 flex-1 grid-cols-7 border-b border-[rgba(0,0,0,0.12)] last:border-b-0"
          >
            {Array.from({ length: 7 }).map((_, col) => (
              <div
                key={col}
                className={`flex flex-col gap-1.5 p-1.5 ${col === 6 ? "" : "border-r border-[rgba(0,0,0,0.12)]"}`}
              >
                <Skeleton className="size-6 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-4 border-t border-border px-3 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
    </div>
  );
}
