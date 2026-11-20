import type { ReactNode } from "react";
import { Skeleton } from "./skeleton";

/** Matches the "back button + title" header row shared by every catalog/insight
 *  detail page: `flex items-center h-[46px] py-2`, icon-sm back button, h1 title. */
export function DetailHeaderSkeleton({
  maxWidth = "max-w-[1280px]",
  center = true,
}: {
  maxWidth?: string;
  center?: boolean;
}) {
  return (
    <div
      className={`flex h-[46px] w-full items-center gap-2 py-2 ${maxWidth} ${center ? "mx-auto" : ""}`}
    >
      <Skeleton className="size-8 shrink-0 rounded-lg" />
      <Skeleton className="h-5 w-48" />
    </div>
  );
}

/**
 * Page shell shared by the single-product detail skeletons (fixed income,
 * global/Thai structured product): gray page background, back+title header,
 * then one centered white card that all the content sits inside.
 *
 * `stretchContent` drops the card's `items-center`, for the layouts whose rows
 * are expected to fill the card's width rather than shrink to their content.
 */
export function ProductDetailPageSkeleton({
  stretchContent = false,
  children,
}: {
  stretchContent?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="flex w-full flex-col items-center px-4 pt-6 pb-20 md:px-8 lg:px-[221px]"
      style={{ backgroundColor: "#f9fafb" }}
    >
      <DetailHeaderSkeleton maxWidth="max-w-[998px]" center={false} />

      <div
        className={`flex w-full max-w-[998px] flex-col gap-14 rounded-xl bg-white px-6 py-8 md:px-10 lg:px-14 ${stretchContent ? "" : "items-center"}`}
        style={{ boxShadow: "0px 0px 4px rgba(0,0,0,0.02)" }}
      >
        {children}
      </div>
    </div>
  );
}

/** Matches `DetailTable`: bordered rounded-md box, zebra-striped label/value rows. */
export function KeyValueTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-md border border-black/10">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`flex w-full items-center gap-3 px-4 py-2.5 ${i % 2 === 0 ? "bg-[#f9fafb]" : "bg-white"}`}
        >
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 flex-1" />
        </div>
      ))}
    </div>
  );
}

/** Matches a rounded hero/banner section with a logo chip, title and description. */
export function HeroBannerSkeleton({ heightClass = "h-36" }: { heightClass?: string }) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl ${heightClass} flex flex-col justify-center gap-3 bg-[var(--fill-gray-100)] p-6`}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-lg bg-[var(--fill-gray-300)]" />
        <Skeleton className="h-6 w-48 bg-[var(--fill-gray-300)]" />
      </div>
      <Skeleton className="h-4 w-full max-w-md bg-[var(--fill-gray-300)]" />
    </div>
  );
}

/** Matches an accordion-row list: logo + name/subtitle + trailing value + caret. */
export function AccordionListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex w-full flex-col divide-y divide-black/10 overflow-hidden rounded-xl border border-black/10 bg-white">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="size-8 shrink-0 rounded" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-14 shrink-0" />
          <Skeleton className="size-5 shrink-0 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Matches a multi-column data table: header row + N body rows of equal-ish cells. */
export function ColumnTableSkeleton({
  columns = 6,
  rows = 6,
  rowHeightClass = "h-[52px]",
  firstColWide = false,
}: {
  columns?: number;
  rows?: number;
  rowHeightClass?: string;
  firstColWide?: boolean;
}) {
  // A loading table never scrolls and never shows every column: at most six
  // even columns that fit the box. The real table's width is the real
  // table's business.
  const shown = Math.min(columns, 6);
  const colClass = (i: number) => (firstColWide && i === 0 ? "w-[180px] shrink-0" : "flex-1");
  return (
    <div className="w-full overflow-hidden rounded-xl border border-black/10 bg-white">
      <div className="flex flex-col">
        <div className="flex h-11 items-center gap-4 bg-[var(--bg-default-secondary)] px-4">
          {Array.from({ length: shown }).map((_, i) => (
            <Skeleton key={i} className={`h-3 w-16 ${colClass(i)}`} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className={`flex items-center gap-4 px-4 ${rowHeightClass} border-t border-black/10`}
          >
            {Array.from({ length: shown }).map((_, i) => (
              <Skeleton key={i} className={`h-4 ${colClass(i)}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Matches a horizontal-scroll or grid row of small stat/summary cards. */
export function StatCardRowSkeleton({
  cards = 3,
  className = "grid grid-cols-1 lg:grid-cols-3 gap-4",
  cardHeightClass = "h-[132px]",
}: {
  cards?: number;
  className?: string;
  cardHeightClass?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} className={`${cardHeightClass} w-full rounded-xl`} />
      ))}
    </div>
  );
}
