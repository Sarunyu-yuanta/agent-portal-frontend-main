import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading states for the mutual-fund drill-in pages (theme detail, top
 * performers, filter results, insights list, tax planning). Each one repeats
 * its page's container/padding/max-width classes so nothing shifts when the
 * data lands, and draws every content control — chips, search, filter, period
 * pills, pagination, inputs — as a plain block, so nothing that acts on the
 * rows can be pressed before there is data behind it.
 *
 * Navigation tabs (theme strip, fund-group strip) are NOT drawn here: on first
 * load the pages draw them with `TabsSkeleton`; once loaded the real tabs stay
 * live and a tab switch only swaps the body below them for these skeletons.
 */

/** The 996px column every one of these pages lays its content on. */
const COLUMN = "mx-auto w-full max-w-[996px] px-4 md:px-8 lg:px-0";

const CARD_SHADOW =
  "shadow-[0px_0px_1px_rgba(102,102,102,0.16),0px_4px_4px_rgba(102,102,102,0.12)]";

/** Back button + h1 title row. */
function BackHeaderSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 pb-2 ${className}`}>
      <Skeleton className="size-[30px] shrink-0 rounded-md" />
      <div className="flex h-8 items-center">
        <Skeleton className="h-6 w-44" />
      </div>
    </div>
  );
}

/** The 126px hero band: title, description, as-of date, and the trailing graphic. */
function HeroBandSkeleton({ innerClassName }: { innerClassName: string }) {
  return (
    <div className="w-full bg-[#f9fafb]">
      <div className={`flex h-[126px] items-center gap-2.5 py-2.5 ${innerClassName}`}>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <Skeleton className="h-7 w-48 max-w-full" />
          <Skeleton className="h-4 w-full max-w-[420px]" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="size-[88px] shrink-0 rounded-full" />
      </div>
    </div>
  );
}

/**
 * The View/Highlight chips + "ดูคำอธิบาย" row. With `search` (and `filter`)
 * the trailing controls sit on the right on desktop and wrap to their own
 * full-width line on mobile — as `MutualFundTagLegend` lays them out.
 */
function TagLegendSkeleton({
  search = false,
  filter = false,
}: {
  search?: boolean;
  filter?: boolean;
}) {
  const chips = (
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-[76px] rounded-full" />
      <Skeleton className="h-8 w-[96px] rounded-full" />
    </div>
  );
  if (!search) {
    return (
      <div className="flex w-full items-center justify-between gap-2 px-3">
        {chips}
        <Skeleton className="h-5 w-24" />
      </div>
    );
  }
  return (
    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 px-3">
      <div className="flex items-center gap-2">
        {chips}
        <Skeleton className="ml-2 h-5 w-24" />
      </div>
      <div className="flex w-full items-center gap-2 lg:ml-auto lg:w-auto">
        <Skeleton className="h-[38px] min-w-0 flex-1 rounded-lg lg:w-[320px] lg:flex-none" />
        {filter ? <Skeleton className="size-[38px] shrink-0 rounded-lg" /> : null}
      </div>
    </div>
  );
}

/** The desktop pill bar of performance periods — one block, 40px tall. */
function PeriodPillsSkeleton({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-10 w-full rounded-full ${className}`} />;
}

/** `MobilePeriodTabs`: caret, pill bar, caret. */
function MobilePeriodPillsSkeleton() {
  return (
    <div className="flex h-10 w-full items-center gap-1 px-3">
      <Skeleton className="size-6 shrink-0 rounded-md" />
      <Skeleton className="h-10 min-w-0 flex-1 rounded-full" />
      <Skeleton className="size-6 shrink-0 rounded-md" />
    </div>
  );
}

function CountSkeleton() {
  return (
    <div className="flex h-6 w-full items-center px-3">
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

/** Inner layout shared by `MutualFundListCard` and its mobile row. */
function FundCardBody() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex w-full items-start gap-2">
        <div className="flex h-[52px] min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-full max-w-[220px]" />
          <Skeleton className="h-3 w-2/3 max-w-[160px]" />
        </div>
        <Skeleton className="h-[30px] w-12 shrink-0" />
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <div className="flex h-5 w-full items-center gap-1">
        <Skeleton className="h-5 w-14 rounded" />
        <Skeleton className="h-5 w-12 rounded" />
        <Skeleton className="h-5 w-16 rounded" />
      </div>
    </div>
  );
}

/** Desktop grid card (`MutualFundListCard`). */
function FundCardSkeleton() {
  return (
    <div className={`flex w-full items-center rounded-lg bg-white px-3 py-2 ${CARD_SHADOW}`}>
      <FundCardBody />
    </div>
  );
}

/** 2-column desktop grid of fund cards. */
function FundGridSkeleton({
  cards = 8,
  className = "grid",
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <div className={`w-full grid-cols-2 gap-x-4 gap-y-6 ${className}`}>
      {Array.from({ length: cards }).map((_, i) => (
        <FundCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Mobile divider list of fund rows (`MutualFundListCardMobile`). */
function FundRowsSkeleton({ rows = 6, className = "flex" }: { rows?: number; className?: string }) {
  return (
    <div className={`w-full flex-col ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i}>
          {i > 0 ? <div className="mx-3 h-px bg-black/10" /> : null}
          <div className="flex w-full items-center px-3 py-2">
            <FundCardBody />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Theme detail and top performers, mobile page: everything below the tab
 * strip — hero band, tag legend (with search on top performers), period
 * pills, count, fund rows.
 */
export function MutualFundTabbedListMobileBodySkeleton({ search = false }: { search?: boolean }) {
  return (
    <div className="flex w-full flex-col" aria-busy="true">
      <HeroBandSkeleton innerClassName="w-full px-6" />
      <div className="flex w-full flex-col gap-3 pt-4 pb-6">
        <TagLegendSkeleton search={search} />
        <MobilePeriodPillsSkeleton />
        <CountSkeleton />
        <FundRowsSkeleton />
      </div>
    </div>
  );
}

/** Desktop hero band slot (theme detail / top performers) while loading. */
export function MutualFundTabbedListHeroSkeleton() {
  return <HeroBandSkeleton innerClassName={COLUMN} />;
}

/**
 * Desktop list-controls slot while loading: tag legend (+ search on top
 * performers, where the count sits above the period pills), period pills.
 */
export function MutualFundTabbedListControlsSkeleton({ search = false }: { search?: boolean }) {
  return (
    <>
      <TagLegendSkeleton search={search} />
      {search ? <CountSkeleton /> : null}
      <PeriodPillsSkeleton />
    </>
  );
}

/** Desktop list slot while loading: the count (when not shown with the controls) and the fund grid. */
export function MutualFundTabbedListGridSkeleton({ count = true }: { count?: boolean }) {
  return (
    <>
      {count ? <CountSkeleton /> : null}
      <FundGridSkeleton />
    </>
  );
}

/** "ผลการกรอง…": back header, tag chips + search + filter button, count, period pills, list. */
export function MutualFundFilterResultsSkeleton() {
  return (
    <div className="flex w-full flex-1 flex-col bg-white pb-20" aria-busy="true">
      <BackHeaderSkeleton className={`${COLUMN} pt-4 lg:pt-8`} />
      <div className={`${COLUMN} pt-4`}>
        <TagLegendSkeleton search filter />
      </div>
      <div className={`flex flex-col gap-3 pt-3 ${COLUMN}`}>
        <CountSkeleton />
        <PeriodPillsSkeleton />
        <FundRowsSkeleton className="flex lg:hidden" />
        <FundGridSkeleton className="hidden lg:grid" />
      </div>
    </div>
  );
}

/** One `MutualFundInsightCard` in its `list` form: title, date, rule, recommended funds. */
function InsightCardSkeleton() {
  return (
    <div
      className={`flex h-[174px] w-full flex-col gap-2.5 rounded-lg border border-black/10 bg-white p-3 ${CARD_SHADOW}`}
    >
      <div className="flex h-12 flex-col gap-2 pt-1">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </div>
      <Skeleton className="h-3 w-24" />
      <div className="h-px w-full bg-black/10" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** "บทวิเคราะห์ทั้งหมด": back header, white panel with the 2-column card grid and centred pagination. */
export function MutualFundInsightsPageSkeleton() {
  return (
    <div className="flex w-full flex-1 flex-col bg-[#f9fafb] pb-20" aria-busy="true">
      <BackHeaderSkeleton className={`${COLUMN} pt-8`} />
      <div className={COLUMN}>
        <div className="flex flex-col items-center gap-8 rounded-2xl bg-white px-4 py-8 shadow-[0px_0px_4px_rgba(0,0,0,0.02)] lg:px-14">
          <div className="mx-auto grid w-full max-w-[884px] grid-cols-1 gap-6 lg:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <InsightCardSkeleton key={i} />
            ))}
          </div>
          <div className="flex w-full justify-center px-2.5">
            <Skeleton className="h-10 w-full max-w-[320px] rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** One per-tax-type tile: type + max investment, then the recommended-fund strip. */
function TaxFundTypeCardSkeleton() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg border border-black/10">
      <div className="flex w-full items-center justify-between gap-2 p-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>
      <div className="h-px w-full bg-black/10" />
      <div className="flex w-full flex-col gap-2 bg-[#f9fafb] p-4">
        <div className="flex w-full items-center justify-between gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex w-full gap-2 overflow-hidden pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[112px] w-[132px] shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * "วางแผนภาษี": back header, white card holding the income box (input,
 * calculate button, disclaimer) and — when a calculation is being restored —
 * the per-fund-type result tiles.
 */
export function MutualFundTaxPlanningSkeleton({
  fundTypes,
  showResults,
}: {
  fundTypes: number;
  showResults: boolean;
}) {
  return (
    <div className="flex w-full flex-1 flex-col bg-[#f9fafb] pb-20" aria-busy="true">
      <BackHeaderSkeleton className={`${COLUMN} pt-4 lg:pt-8`} />
      <div className={`${COLUMN} py-4`}>
        <div className={`flex w-full flex-col gap-6 rounded-xl bg-white p-6 ${CARD_SHADOW}`}>
          <div className="flex w-full flex-col gap-3 rounded-xl border border-black/10 bg-[#f9fafb] p-4">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-44" />
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-start">
              <Skeleton className="h-12 min-w-0 flex-1 rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg sm:w-[160px]" />
            </div>
            <div className="flex w-full flex-col gap-2 px-2 py-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          {showResults ? (
            <div className="flex w-full flex-col gap-3">
              <Skeleton className="h-6 w-28" />
              {Array.from({ length: fundTypes }).map((_, i) => (
                <TaxFundTypeCardSkeleton key={i} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
