import type { ReactNode } from "react";
import { PaginationSkeleton, Skeleton } from "@/components/ui/skeleton";
import { AccordionListSkeleton, ColumnTableSkeleton } from "@/components/ui/detail-skeletons";

/** Mirrors TopIdeaCard's fixed size (171×98, 200px on md+). Pass `fullWidth` for the
 *  `fullWidth` card variant used in grids (TopIdeaAllPage) instead of the horizontal strip. */
export function TopIdeaCardSkeleton({ fullWidth = false }: { fullWidth?: boolean } = {}) {
  return (
    <Skeleton
      className={
        fullWidth
          ? "h-[98px] w-full rounded-[8px]"
          : "h-[98px] w-[171px] shrink-0 rounded-[8px] md:w-[200px]"
      }
    />
  );
}

/** Matches TopIdeaStrip: header + horizontal scroll row of fixed-size cards. */
function TopIdeaStripSkeleton() {
  return (
    <div
      className="flex w-full shrink-0 flex-col items-start gap-4"
      style={{ backgroundColor: "white", paddingTop: 16, paddingBottom: 16 }}
    >
      <div className="mx-auto flex w-full max-w-[1280px] shrink-0 items-center justify-between gap-2 px-4 lg:px-6">
        <Skeleton className="h-[30px] w-28" />
        <Skeleton className="h-5 w-16 shrink-0" />
      </div>
      <div
        className="w-full overflow-hidden pb-3"
        style={{ paddingLeft: "max(1rem, calc((100% - 1280px) / 2 + 1.5rem))" }}
      >
        <div className="flex min-w-max gap-3.5 pr-4 lg:pr-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <TopIdeaCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mirrors InvestmentCard's rounded pill shape, ~120-132px tall, 3 across on desktop. */
function InvestmentCardSkeleton() {
  return <Skeleton className="h-[104px] w-full flex-1 rounded-xl md:h-[120px] lg:h-[132px]" />;
}

/** Matches InvestmentSolutionSection: header + 3 cards (stacked on mobile, row on desktop). */
function InvestmentSolutionSkeleton() {
  return (
    <div className="w-full" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div className="mx-auto flex w-full max-w-[1280px] shrink-0 flex-col items-start gap-4 px-4 md:px-8 lg:px-6">
        <Skeleton className="h-[30px] w-44" />
        <div className="flex w-full shrink-0 flex-col gap-4 lg:flex-row">
          {Array.from({ length: 3 }).map((_, i) => (
            <InvestmentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mirrors StructuredProductCard's grid variant: logo row, name/coupon row, stats bar.
 *  Reused wherever `StructuredProductCard` renders (catalog tabs, product/top-idea/
 *  investment-solution detail grids, view-all pages). */
export function StructuredProductCardSkeleton() {
  return (
    <div
      className="flex w-full flex-col items-center gap-3 rounded-[12px] p-5"
      style={{ backgroundColor: "white", border: "1px solid rgba(0,0,0,0.1)" }}
    >
      <div className="flex w-full flex-col items-start gap-2">
        <div className="flex w-full items-center gap-1">
          <Skeleton className="size-8 shrink-0 rounded" />
          <Skeleton className="size-8 shrink-0 rounded" />
        </div>
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

/** Matches TopPickSection / StructuredProductGridSection: header (+ optional button) + 3-col grid. */
function ProductGridSkeleton({
  cards = 3,
  bgColor = "white",
  showFooterButton = false,
}: {
  cards?: number;
  bgColor?: string;
  showFooterButton?: boolean;
}) {
  return (
    <div
      className="flex w-full flex-col items-center gap-4"
      style={{ backgroundColor: bgColor, paddingTop: 24, paddingBottom: 24 }}
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-2 px-4 lg:px-6">
        <Skeleton className="h-[30px] w-32" />
      </div>
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        {Array.from({ length: cards }).map((_, i) => (
          <StructuredProductCardSkeleton key={i} />
        ))}
      </div>
      {showFooterButton && <Skeleton className="h-8 w-24" />}
    </div>
  );
}

/** Matches ThaiStructuredProductTable's 12-column flex header + rows. */
const THAI_TABLE_COL_WIDTHS = [
  "w-[160px]",
  "w-[90px]",
  "w-[70px]",
  "w-[110px]",
  "w-[110px]",
  "w-[110px]",
  "w-[130px]",
  "w-[110px]",
  "w-[120px]",
  "w-[100px]",
  "w-[100px]",
  "w-[90px]",
];

function ThaiStructuredTableSkeleton() {
  return (
    <div className="w-full" style={{ backgroundColor: "white", paddingTop: 24, paddingBottom: 24 }}>
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 lg:px-6">
        <Skeleton className="h-[30px] w-40" />
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex h-11 shrink-0 items-center gap-3 bg-[var(--bg-default-secondary)] px-3">
            {THAI_TABLE_COL_WIDTHS.map((w, i) => (
              <Skeleton key={i} className={`h-3 ${w} shrink-0`} />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, r) => (
            <div key={r} className="flex h-12 items-center gap-3 border-t border-border px-3">
              {THAI_TABLE_COL_WIDTHS.map((w, i) => (
                <Skeleton key={i} className={`h-4 ${w} shrink-0`} />
              ))}
            </div>
          ))}
        </div>
        <PaginationSkeleton />
      </div>
    </div>
  );
}

/** Mirrors FixedIncomeCard: statustag+symbol+YTM row, 3 detail rows, hr, logo+company+button footer. */
function FixedIncomeCardSkeleton() {
  return (
    <div
      className="flex w-full flex-col items-start gap-2 rounded-xl bg-white p-3"
      style={{ border: "1px solid rgba(0,0,0,0.1)" }}
    >
      <div className="flex w-full items-start gap-2">
        <Skeleton className="h-5 w-12 shrink-0 rounded" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-14 shrink-0" />
      </div>
      <div className="flex w-full items-center gap-2">
        <Skeleton className="h-3 flex-1" />
        <Skeleton className="h-3 w-16 shrink-0" />
      </div>
      <div className="flex w-full items-center gap-2">
        <Skeleton className="h-3 flex-1" />
        <Skeleton className="h-3 w-16 shrink-0" />
      </div>
      <div className="flex w-full items-center gap-2">
        <Skeleton className="h-5 w-20 shrink-0 rounded" />
        <Skeleton className="ml-auto h-3 w-16 shrink-0" />
      </div>
      <hr className="w-full border-black/10" />
      <div className="flex w-full items-center gap-3">
        <Skeleton className="size-8 shrink-0 rounded" />
        <Skeleton className="h-3 flex-1" />
        <Skeleton className="h-9 w-24 shrink-0 rounded-lg" />
      </div>
    </div>
  );
}

/** Matches FixedIncomeTab: mobile card grid (lg:hidden) + desktop 11-col table (hidden lg:block). */
function FixedIncomeTabSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-6 px-4 pt-6 pb-10 md:px-8 lg:px-6">
      {/* Filter bar: Primary/Secondary switcher + Filter badge, centred at
          704px like the real one, then the "updated" line. */}
      <div className="flex w-full justify-center">
        <div className="flex w-full max-w-[704px] items-center gap-3 md:gap-4">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg md:w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-48 self-end" />
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <FixedIncomeCardSkeleton key={i} />
        ))}
      </div>
      <div className="hidden w-full lg:block">
        <ColumnTableSkeleton columns={11} rows={8} rowHeightClass="h-[60px]" firstColWide />
      </div>
      <div className="w-full">
        <PaginationSkeleton />
      </div>
    </div>
  );
}

/** Matches GlobalBondTab: Top pick + Recommended sections, accordions on mobile, tables on desktop. */
function GlobalBondTabSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-6 px-4 pt-6 pb-10 md:px-8 lg:px-6">
      <Skeleton className="h-6 w-64 self-start" />

      {/* Top pick */}
      <div className="flex w-full flex-col gap-3">
        <Skeleton className="h-6 w-28 rounded-lg" />
        <div className="w-full lg:hidden">
          <AccordionListSkeleton rows={5} />
        </div>
        <div className="hidden w-full lg:block">
          <ColumnTableSkeleton columns={9} rows={5} rowHeightClass="h-[52px]" firstColWide />
        </div>
      </div>

      {/* Recommended */}
      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="w-full lg:hidden">
          <AccordionListSkeleton rows={8} />
        </div>
        <div className="hidden w-full lg:block">
          <ColumnTableSkeleton columns={5} rows={8} rowHeightClass="h-[52px]" firstColWide />
        </div>
      </div>

      <Skeleton className="h-12 w-full max-w-[343px] rounded-xl" />
    </div>
  );
}

/** Matches MutualFundTab top to bottom: quick-action tiles, the themes
 *  carousel, then Top Performers (with its group chips) beside Insights. */
function MutualFundTabSkeleton() {
  return (
    <div className="flex w-full flex-col bg-white" aria-busy="true">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-4 pt-8 md:px-8 lg:px-6 lg:pt-10">
        {/* Quick actions */}
        <div className="flex w-full gap-2.5 lg:justify-center lg:gap-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] flex-1 rounded lg:w-[260px] lg:flex-none" />
          ))}
        </div>
        {/* Themes carousel */}
        <div className="flex w-full flex-col gap-4 pt-3 pb-10">
          <Skeleton className="h-7 w-48" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[420px] w-[308px] shrink-0 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-3 w-full max-w-[1280px] px-4 pb-10 md:px-8 lg:mt-6 lg:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
          {/* Top performers: heading, group chips, ranked list */}
          <div className="flex flex-col gap-4">
            <Skeleton className="h-7 w-48" />
            <div className="flex gap-2 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
          {/* Insights: heading, lead card, two smaller */}
          <div className="flex flex-col gap-4">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="flex gap-8">
              <Skeleton className="h-[100px] flex-1 rounded-lg" />
              <Skeleton className="h-[100px] flex-1 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Shell shared by the two "hero band over a product grid" detail skeletons
 * (Top Idea, Investment Solution): back+title header, then the caller's gray
 * hero band — the two pages lay theirs out differently — then the white
 * rounded-top body with a count/filter row, an updated caption, and the grid.
 */
export function ProductGridDetailSkeleton({ hero }: { hero: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2 bg-white pt-4 md:pt-6">
      {/* Same box as the real detail header so the back button lines up with the content column. */}
      <div className="mx-auto flex h-[46px] w-full max-w-[1280px] items-center gap-2 px-4 py-2 md:px-8 lg:px-20">
        <Skeleton className="size-7 shrink-0 rounded-md" />
        <Skeleton className="h-6 w-48" />
      </div>

      {hero}

      <div className="relative z-10 w-full rounded-t-[24px] bg-white pt-4 pb-10 lg:pt-6">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-2 px-4 md:px-8 lg:px-20">
          <div className="flex w-full items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg md:w-[88px]" />
          </div>
          <Skeleton className="h-3 w-32 self-start" />

          <div className="flex w-full flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <StructuredProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The whole catalog tab body, in its loading state — one skeleton per tab. */
export function ProductCatalogTabSkeleton({ tab }: { tab: string }) {
  if (tab === "fixed-income") return <FixedIncomeTabSkeleton />;
  if (tab === "global-bond") return <GlobalBondTabSkeleton />;
  if (tab === "mutual-fund") return <MutualFundTabSkeleton />;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <TopIdeaStripSkeleton />
      <InvestmentSolutionSkeleton />
      <ProductGridSkeleton cards={3} bgColor="white" />
      {tab === "thai-structured" ? (
        <ThaiStructuredTableSkeleton />
      ) : (
        <ProductGridSkeleton cards={5} bgColor="#f9fafb" showFooterButton />
      )}
    </div>
  );
}
