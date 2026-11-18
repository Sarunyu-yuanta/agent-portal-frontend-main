import { Skeleton } from "@/components/ui/skeleton";
import { CompactCardSkeleton } from "../InsightsSkeletons";

/** Mirrors the PDF report card: icon + two-line blurb on the left, a button on the right. */
function PdfButtonSkeleton() {
  return (
    <div className="rounded-2xl border border-border p-6 flex items-center justify-between gap-4">
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-6 rounded shrink-0" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-10 w-32 rounded-lg shrink-0" />
    </div>
  );
}

/** Mirrors the gradient-bordered AI Summary card: icon chip + title, then a few text lines. */
function AiSummarySkeleton() {
  return (
    <div className="rounded-2xl border border-border p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-9 rounded-xl shrink-0" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

/** Mirrors one article section: heading + body lines, optionally an inline chart image. */
function ArticleSectionSkeleton({ withImage = false }: { withImage?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      {withImage && <Skeleton className="h-48 w-full rounded-xl" />}
    </div>
  );
}

/** Mirrors a related-product card: logo/name/value row, then a 3-column stat strip. */
function RelatedProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-border p-4 flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-12 shrink-0" />
      </div>
      <div className="flex bg-[#f9fafb] rounded-lg p-2 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <Skeleton className="h-2.5 w-10" />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mirrors RelatedProductsCard: icon + title header, then two product card rows. */
function RelatedProductsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-6 rounded shrink-0" />
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="flex flex-col gap-3">
        <RelatedProductCardSkeleton />
        <RelatedProductCardSkeleton />
      </div>
    </div>
  );
}

/** Mirrors the "บทวิเคราะห์โดย" analysts list: heading, then photo + name/title rows. */
function AnalystsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 min-w-0">
            <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Mirrors InsightDetail's real layout: a flexible main column (back button,
 * category + title, subtitle/date, article sections, "other analyses" grid)
 * next to a fixed 400px sidebar (PDF button, AI Summary, Related Products,
 * Analysts) that collapses into the main column on mobile/tablet.
 */
export function InsightDetailSkeleton() {
  return (
    <div
      className="flex flex-col gap-8 lg:grid lg:gap-6"
      style={{ gridTemplateColumns: "1fr 400px" }}
    >
      <div className="flex flex-col gap-6 pb-12 min-w-0 max-lg:max-w-xl max-lg:mx-auto max-lg:w-full">
        <Skeleton className="h-8 w-16 rounded-lg hidden xl:block" />

        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-8 sm:h-10 w-3/4" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-24 sm:shrink-0" />
        </div>
        <div className="border-t border-border" />

        <div className="lg:hidden flex flex-col gap-4">
          <PdfButtonSkeleton />
          <AiSummarySkeleton />
        </div>

        <ArticleSectionSkeleton withImage />
        <ArticleSectionSkeleton />
        <ArticleSectionSkeleton />

        <div className="lg:hidden border-t border-border mt-4" />
        <div className="lg:hidden">
          <AnalystsSkeleton />
        </div>

        <div className="lg:hidden border-t border-border mt-4" />
        <div className="lg:hidden">
          <RelatedProductsSkeleton />
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <div className="border-t border-border" />
          <Skeleton className="h-5 w-56 mt-2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CompactCardSkeleton />
            <CompactCardSkeleton />
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="flex flex-col gap-5">
          <PdfButtonSkeleton />
          <AiSummarySkeleton />
          <div className="border-t border-border mt-3 pt-6">
            <RelatedProductsSkeleton />
          </div>
          <div className="border-t border-border mt-3 pt-6">
            <AnalystsSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
