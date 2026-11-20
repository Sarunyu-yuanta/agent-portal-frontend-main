import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@sarunyu/system-one";

/** Base pulsing placeholder block — size it via `className`. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-[var(--fill-gray-200)] ${className}`}
    />
  );
}

/** Drop-in replacement for a table's row list while its data is still loading. */
export function TableRowsSkeleton({ columns, rows = 8 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} hoverable={false}>
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full max-w-[120px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/**
 * A whole table — header included — standing in for one whose data hasn't
 * arrived. Deliberately not the real table with its rows swapped out: it shows
 * only a few even columns and never scrolls, and its header has no sort
 * controls, so nothing on it can be pressed or dragged before there is data.
 */
export function TableSkeleton({ columns = 6, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div
      aria-busy="true"
      className="overflow-hidden rounded-lg border border-[var(--border-default)]"
    >
      <Table className="w-full table-fixed">
        <TableHead>
          <TableRow hoverable={false}>
            {Array.from({ length: columns }).map((_, j) => (
              <TableHeaderCell
                key={j}
                sortable={false}
                // The cell paints its own hover tint whatever `sortable` says;
                // pin it to the resting white. Trailing `!` because the design
                // system's CSS is unlayered and would otherwise win.
                className="hover:bg-[var(--bg-default-primary,white)]!"
              >
                <Skeleton className="h-4 w-20 max-w-full" />
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRowsSkeleton columns={columns} rows={rows} />
        </TableBody>
      </Table>
    </div>
  );
}

/** A row of filter chips (pill-shaped), standing in for a `Chip` group. */
export function ChipsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-busy="true" className="flex items-center gap-2 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-full" />
      ))}
    </div>
  );
}

/** The "Show per page · Showing x–y of z · ‹ 1 ›" footer under a table. */
export function PaginationSkeleton() {
  return (
    <div aria-hidden className="flex flex-wrap-reverse items-center justify-end gap-3">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-[120px] rounded-lg" />
    </div>
  );
}

/**
 * A tab strip on a page's FIRST load — before anything has arrived, nothing on
 * the page is clickable yet, tabs included. Once the page has loaded the real
 * tabs render and stay live; a tab whose own data is still coming shows a
 * skeleton in its content only. Even bars, one per tab.
 */
export function TabsSkeleton({ count, className = "" }: { count: number; className?: string }) {
  return (
    <div aria-busy="true" className={`flex h-12 items-center gap-6 overflow-hidden ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 shrink-0" />
      ))}
    </div>
  );
}
