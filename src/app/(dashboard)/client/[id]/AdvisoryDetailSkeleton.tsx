import { Skeleton } from "@/components/ui/skeleton";
import { PLAN_CARD_SHADOW, SECTION_SHADOW } from "./portfolio-advisory-ui";

/**
 * Stands in for a Portfolio Advisory detail page (Robo Advisory / Definit)
 * while its plans or the client list are loading: breadcrumb (mobile/tablet),
 * back header (desktop), hero copy, client bar, plan count + optional filter
 * button, and the plan cards — every control a placeholder, so neither the
 * client picker nor a plan can be opened before there is data behind them.
 * Wrappers reuse the real page's classes so nothing jumps when data lands.
 */
export function AdvisoryDetailSkeleton({
  cards,
  stats,
  cardMinHeightClass,
  showFilterButton = false,
}: {
  /** How many plan cards the page shows once loaded. */
  cards: number;
  /** Stat columns per card (Robo 4, Definit 3). */
  stats: number;
  /** Min height matching the real card (Robo 302px; Definit runs taller). */
  cardMinHeightClass: string;
  showFilterButton?: boolean;
}) {
  const card = (key: number, desktop = false) => (
    <PlanCardSkeleton
      key={key}
      stats={stats}
      minHeightClass={cardMinHeightClass}
      className={desktop ? "min-w-0 flex-[1_0_0]" : ""}
    />
  );

  return (
    <div
      aria-busy="true"
      className="flex w-full flex-1 flex-col max-lg:min-h-[calc(var(--dvh)*100-60px)] max-lg:overflow-x-clip max-lg:bg-white lg:bg-[#f9fafb] lg:pb-20 lg:pt-2"
    >
      {/* Mobile + tablet */}
      <div className="flex min-h-[calc(var(--dvh)*100-60px)] w-full flex-1 flex-col lg:hidden">
        <div className="shrink-0 bg-white px-4 pt-4 pb-3 md:px-8">
          <Skeleton className="h-5 w-56 max-w-full" />
        </div>

        <div className="flex w-full flex-1 flex-col gap-3 pb-20">
          <HeroCopySkeleton className="h-[170px] py-4 pl-5 pr-4 md:px-8 md:py-6" />
          <div className="flex w-full flex-col gap-3 px-4 md:gap-4 md:px-8">
            <ClientBarSkeleton />
            <PlanCountSkeleton showFilterButton={showFilterButton} />
            <div className="flex w-full flex-col gap-3 max-md:mx-auto max-md:w-[343px] max-md:max-w-full md:gap-4">
              {Array.from({ length: cards }).map((_, i) => card(i))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden w-full max-w-[996px] flex-col gap-2 px-4 md:px-8 lg:flex lg:px-0">
        <div className="flex w-full items-center gap-3 rounded-lg p-2">
          <Skeleton className="size-[34px] shrink-0 rounded-lg" />
          <Skeleton className="h-6 w-40" />
        </div>

        <div className="w-full overflow-clip rounded-xl bg-white" style={{ boxShadow: SECTION_SHADOW }}>
          <div className="flex w-full flex-col items-center px-14 pb-12">
            <HeroCopySkeleton className="px-10 py-8" illustrationClassName="h-[153px] w-[101px]" />
            <div className="flex w-full flex-col gap-4">
              <ClientBarSkeleton />
              <PlanCountSkeleton showFilterButton={showFilterButton} />
              <div className="flex w-full items-stretch gap-3">
                {Array.from({ length: cards }).map((_, i) => card(i, true))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCopySkeleton({
  className,
  illustrationClassName = "h-[138px] w-[98px]",
}: {
  className: string;
  illustrationClassName?: string;
}) {
  return (
    <div className={`flex w-full shrink-0 items-center gap-2 lg:gap-6 ${className}`}>
      <Skeleton className={`shrink-0 rounded-lg ${illustrationClassName}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-full max-w-[480px]" />
        <Skeleton className="h-4 w-2/3 max-w-[320px]" />
      </div>
    </div>
  );
}

/** Same box as `AdvisoryClientBar`: avatar, name + risk/tag line, change button. */
function ClientBarSkeleton() {
  return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-black/10 bg-white px-3 py-2">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-36 max-w-full" />
        <Skeleton className="h-3 w-48 max-w-full" />
      </div>
      <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />
    </div>
  );
}

function PlanCountSkeleton({ showFilterButton }: { showFilterButton: boolean }) {
  return (
    <div className="flex h-7 w-full items-center justify-between">
      <Skeleton className="h-5 w-36" />
      {showFilterButton ? <Skeleton className="size-8 shrink-0 rounded-lg" /> : null}
    </div>
  );
}

function PlanCardSkeleton({
  stats,
  minHeightClass,
  className,
}: {
  stats: number;
  minHeightClass: string;
  className: string;
}) {
  return (
    <div
      className={`box-border flex w-full flex-col gap-4 rounded-lg bg-white p-4 ${minHeightClass} ${className}`}
      style={{ boxShadow: PLAN_CARD_SHADOW }}
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="ml-auto h-4 w-28" />
      </div>
      <div className="flex w-full items-end">
        {Array.from({ length: stats }).map((_, i) => (
          <div key={i} className="flex min-w-0 flex-1 items-end">
            {i > 0 ? <div className="h-[58px] w-px shrink-0 bg-black/10" /> : null}
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto flex w-full items-center justify-between gap-2">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
