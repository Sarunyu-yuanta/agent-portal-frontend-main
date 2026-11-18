import { ChipsSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton";

/**
 * Stands in for a whole Order Management panel while its records load —
 * status chips, the filter / search / create toolbar and the table, all as
 * bars, so nothing can be filtered, searched or booked before there is data.
 * Same row layout as the panels (stacked below `lg`).
 */
export function OrdersPanelSkeleton({ withCreate = false }: { withCreate?: boolean }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ChipsSkeleton count={4} />
        <div className="flex items-stretch gap-2.5 lg:shrink-0">
          <Skeleton className="h-10 w-24 shrink-0 rounded-lg" />
          <Skeleton className="h-10 min-w-0 flex-1 rounded-lg lg:w-[220px] lg:flex-none" />
          {withCreate && <Skeleton className="h-10 w-32 shrink-0 rounded-lg" />}
        </div>
      </div>
      <TableSkeleton columns={6} />
    </div>
  );
}
