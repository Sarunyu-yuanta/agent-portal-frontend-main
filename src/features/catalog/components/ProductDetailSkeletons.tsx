/**
 * Loading skeletons for the Product Catalog's full-page detail views.
 *
 * One component per page here, each mirroring that page's real layout closely
 * enough that the swap from loading to loaded doesn't shift anything. The
 * section-level and card-level pieces they build on live in
 * `ProductCatalogSkeletons.tsx` and `@/components/ui/detail-skeletons`.
 */
import { Skeleton, TabsSkeleton } from "@/components/ui/skeleton";
import { ORDER_BOOKING_ENABLED } from "@/config/feature-flags";
import {
  DetailHeaderSkeleton,
  ProductDetailPageSkeleton,
  KeyValueTableSkeleton,
  AccordionListSkeleton,
  ColumnTableSkeleton,
  StatCardRowSkeleton,
} from "@/components/ui/detail-skeletons";
import {
  ProductGridDetailSkeleton,
  StructuredProductCardSkeleton,
  TopIdeaCardSkeleton,
} from "./ProductCatalogSkeletons";

const BORDER_COLOR = "rgba(0,0,0,0.1)";

/* ── Fixed income ──────────────────────────────────────────────────────────── */

/** Mirrors FixedIncomeDetail: company breadcrumb, hero row, 12-row key/value table, CTA button. */
export function FixedIncomeDetailSkeleton() {
  return (
    <ProductDetailPageSkeleton>
      <div className="flex w-full flex-col gap-6">
        <div className="flex w-full items-center gap-2 border-b border-black/10 pb-2">
          <Skeleton className="h-4 max-w-xs flex-1" />
          <Skeleton className="size-5 shrink-0 rounded" />
        </div>

        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full items-center gap-3">
            <Skeleton className="size-12 shrink-0 rounded-md" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Skeleton className="h-5 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-14 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-3">
            <KeyValueTableSkeleton rows={12} />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <Skeleton className="h-12 w-full max-w-[343px] rounded-xl" />
      </div>
    </ProductDetailPageSkeleton>
  );
}

/** Mirrors FixedIncomeCompanyDetail's hero: logo+title, description, asset-tag pills. */
function CompanyHeroSkeleton() {
  return (
    <div className="relative flex flex-col gap-6 overflow-hidden rounded-xl bg-[var(--fill-gray-100)] p-8">
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full items-center gap-4">
          <Skeleton className="size-14 shrink-0 rounded-xl bg-[var(--fill-gray-300)]" />
          <Skeleton className="h-9 max-w-md flex-1 bg-[var(--fill-gray-300)]" />
        </div>
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-4 w-full max-w-xl bg-[var(--fill-gray-300)]" />
          <Skeleton className="h-4 w-2/3 max-w-md bg-[var(--fill-gray-300)]" />
        </div>
      </div>
      <div className="flex w-full flex-col gap-4">
        <Skeleton className="h-4 w-40 bg-[var(--fill-gray-300)]" />
        <div className="flex flex-wrap items-start gap-3">
          <Skeleton className="h-7 w-32 rounded bg-[var(--fill-gray-300)]" />
          <Skeleton className="h-7 w-40 rounded bg-[var(--fill-gray-300)]" />
          <Skeleton className="h-7 w-36 rounded bg-[var(--fill-gray-300)]" />
        </div>
      </div>
    </div>
  );
}

/** Mirrors FixedIncomeCompanyDetail's BondSection: title bar + count/updated row + bond table. */
function CompanyBondSectionSkeleton({ columns }: { columns: number }) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-0.5">
        <Skeleton className="h-9 w-48" />
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <ColumnTableSkeleton columns={columns} rows={6} rowHeightClass="h-[52px]" firstColWide />
    </div>
  );
}

/** Mirrors FixedIncomeCompanyDetail: hero card, primary bond table, optional gray secondary band. */
export function FixedIncomeCompanyDetailSkeleton({
  hasSecondary = false,
}: {
  hasSecondary?: boolean;
}) {
  return (
    <div
      className="flex w-full flex-col items-stretch px-4 pt-6 pb-20 md:px-8 lg:px-20"
      style={{ backgroundColor: "#f9fafb" }}
    >
      <DetailHeaderSkeleton maxWidth="max-w-[1280px]" />

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8">
        <CompanyHeroSkeleton />

        <CompanyBondSectionSkeleton columns={12} />

        {hasSecondary && (
          <div className="-mx-[9999px] bg-[#f9fafb] px-[9999px] py-8">
            <CompanyBondSectionSkeleton columns={11} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Global bond ───────────────────────────────────────────────────────────── */

/** Mirrors GlobalBondDetail: hero banner + filter pill rows, bond list, recommended bond cards. */
export function GlobalBondDetailSkeleton() {
  return (
    <div className="flex w-full flex-col items-stretch bg-gradient-to-b from-white from-[43.451%] to-transparent px-4 pt-4 pb-10 md:px-8 md:pt-6 md:pb-20 lg:px-20">
      <DetailHeaderSkeleton maxWidth="max-w-[1280px]" />

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 md:gap-8">
        {/* Mirrors GlobalBondDetailHero: logo + title + tags, description, then the two filter pill groups inside the banner. */}
        <div className="flex flex-col gap-6 overflow-hidden rounded-xl bg-[var(--fill-gray-100)] px-4 py-6 md:p-8">
          <div className="flex w-full flex-col gap-2 md:gap-1.5 lg:min-h-[83px] lg:justify-between">
            <div className="flex w-full flex-col gap-2 lg:pb-[9px]">
              <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <Skeleton className="size-7 shrink-0 rounded-lg bg-[var(--fill-gray-300)] md:size-8" />
                  <Skeleton className="h-[30px] w-48 bg-[var(--fill-gray-300)] md:h-10 md:w-80" />
                </div>
                <div className="flex flex-wrap items-center gap-[7px]">
                  <Skeleton className="h-7 w-24 rounded bg-[var(--fill-gray-300)]" />
                  <Skeleton className="h-7 w-28 rounded bg-[var(--fill-gray-300)]" />
                  <Skeleton className="h-7 w-48 rounded bg-[var(--fill-gray-300)] lg:w-80" />
                </div>
              </div>
            </div>
            <Skeleton className="h-5 w-full max-w-sm bg-[var(--fill-gray-300)]" />
          </div>

          <div className="flex w-full flex-col gap-3 md:gap-2 lg:flex-row lg:items-center lg:gap-10">
            {[5, 3].map((pills, g) => (
              <div key={g} className="flex min-w-0 flex-col gap-2">
                <Skeleton className="h-5 w-32 shrink-0 bg-[var(--fill-gray-300)]" />
                <div className="flex items-center gap-1 overflow-hidden rounded-lg bg-[var(--fill-gray-300)]/50 p-1">
                  {Array.from({ length: pills }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-[38px] w-14 shrink-0 rounded-lg bg-[var(--fill-gray-300)] md:w-16"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 lg:gap-12">
          {ORDER_BOOKING_ENABLED && <TabsSkeleton count={2} />}

          <div className="flex w-full flex-col gap-4">
            <div className="flex w-full items-center justify-between">
              <Skeleton className="h-6 w-28 md:h-7 md:w-32" />
              <Skeleton className="h-5 w-40 md:h-6 md:w-64" />
            </div>
            <div className="w-full lg:hidden">
              <AccordionListSkeleton rows={5} />
            </div>
            <div className="hidden w-full lg:block">
              <ColumnTableSkeleton columns={9} rows={6} rowHeightClass="h-[52px]" firstColWide />
            </div>
          </div>

          <div className="flex w-full flex-col gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 shrink-0 rounded" />
              <Skeleton className="h-5 w-40" />
            </div>
            <StatCardRowSkeleton
              cards={3}
              className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3"
              cardHeightClass="h-[240px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mirrors GlobalBondAllPage: filter hero, bond list, pagination footer. */
export function GlobalBondAllPageSkeleton() {
  return (
    <div className="flex w-full flex-col items-stretch bg-gradient-to-b from-white from-[43.451%] to-transparent px-4 pt-4 pb-10 md:px-8 md:pt-6 md:pb-20 lg:px-20">
      <DetailHeaderSkeleton maxWidth="max-w-[1280px]" />

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 md:gap-8">
        {/* Mirrors the real hero: big title + description, then (desktop) the 4 filter dropdowns + clear button inside the banner. */}
        <div className="flex w-full flex-col gap-4 rounded-xl bg-[var(--fill-gray-100)] px-4 py-6 md:gap-6 md:p-8">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-56 bg-[var(--fill-gray-300)] lg:h-12 lg:w-[420px]" />
            <Skeleton className="h-5 w-64 bg-[var(--fill-gray-300)] lg:h-6 lg:w-[540px]" />
          </div>
          <Skeleton className="h-[46px] w-40 rounded-lg bg-[var(--fill-gray-300)] lg:hidden" />
          <div className="hidden w-full flex-nowrap items-center gap-3 lg:flex">
            <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-11 min-w-0 flex-1 rounded-lg bg-[var(--fill-gray-300)]"
                />
              ))}
            </div>
            <Skeleton className="h-11 w-36 shrink-0 rounded-lg bg-[var(--fill-gray-300)]" />
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-3 lg:gap-4">
          <div className="flex w-full items-center justify-between">
            <Skeleton className="h-6 w-32 md:h-7 md:w-36" />
            <Skeleton className="h-5 w-40 md:h-6 md:w-64" />
          </div>
          <div className="w-full lg:hidden">
            <AccordionListSkeleton rows={6} />
          </div>
          <div className="hidden w-full lg:block">
            <ColumnTableSkeleton columns={9} rows={8} rowHeightClass="h-[65px]" firstColWide />
          </div>
          <div className="flex w-full items-center justify-end gap-3">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Top ideas ─────────────────────────────────────────────────────────────── */

/** Mirrors TopIdeaAllPage: back+title header and a 2/3-col grid of top idea cards. */
export function TopIdeaAllPageSkeleton() {
  return (
    <div className="flex w-full flex-col items-center gap-8 bg-gradient-to-b from-white from-[43.451%] to-transparent pt-6 pb-20">
      {/* Same box as the real header (h-[46px], px-4/8/20) so the back button and title don't shift. */}
      <div className="flex h-[46px] w-full max-w-[1280px] items-center gap-2 px-4 py-2 md:px-8 lg:px-20">
        <Skeleton className="size-7 shrink-0 rounded-md" />
        <Skeleton className="h-6 w-28" />
      </div>

      <div className="grid w-full max-w-[1280px] grid-cols-2 gap-4 px-4 md:px-8 lg:grid-cols-3 lg:px-20">
        {Array.from({ length: 15 }).map((_, i) => (
          <TopIdeaCardSkeleton key={i} fullWidth />
        ))}
      </div>
    </div>
  );
}

/** Mirrors TopIdeaDetail: hero banner with icon chip + coupon stat, over a product grid. */
export function TopIdeaDetailSkeleton() {
  return (
    <ProductGridDetailSkeleton
      hero={
        <div
          className="relative -mb-6 flex min-h-[100px] w-full items-center pt-3 pb-10 md:pt-4 md:pb-10 lg:min-h-[155px] lg:pt-8 lg:pb-14"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <div className="relative z-[1] mx-auto flex w-full max-w-[1280px] flex-1 items-center gap-2 px-4 md:px-8 lg:gap-4 lg:px-20">
            <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-4">
              <Skeleton className="size-6 shrink-0 rounded-md md:size-8 lg:size-10" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:gap-1 lg:gap-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5 lg:gap-2">
              <Skeleton className="h-7 w-24 rounded-md lg:h-[34px] lg:w-[112px]" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        </div>
      }
    />
  );
}

/* ── Investment solutions ──────────────────────────────────────────────────── */

/** Mirrors InvestmentSolutionDetail: hero banner with logo chip + AUM stat, over a product grid. */
export function InvestmentSolutionDetailSkeleton() {
  return (
    <ProductGridDetailSkeleton
      hero={
        <div
          className="relative -mb-6 flex min-h-[100px] w-full items-center overflow-hidden lg:h-[146px]"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <div className="relative z-[1] mx-auto flex w-full max-w-[1280px] items-center gap-4 px-4 md:px-8 lg:px-20">
            <Skeleton className="size-8 shrink-0 rounded-full lg:size-10" />
            <div className="flex min-w-0 flex-1 flex-col gap-1 md:gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 md:gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      }
    />
  );
}

/* ── Structured products ───────────────────────────────────────────────────── */

/** Mirrors StructuredProductAllPage: header, hero banner, filter chips, count/updated row, and 3-col product grid. */
export function StructuredProductAllPageSkeleton() {
  return (
    <div className="flex w-full flex-col items-center pt-4 pb-10 lg:pt-6 lg:pb-20">
      <div className="flex w-full max-w-[1280px] flex-col gap-4 px-4 md:px-8 lg:gap-6 lg:px-20">
        <DetailHeaderSkeleton maxWidth="max-w-[1280px]" />

        {/* Hero banner's background-image variant, without the logo chip. */}
        <div className="relative flex h-32 w-full flex-col items-start gap-2 overflow-hidden rounded-xl bg-[var(--fill-gray-100)] p-4 lg:h-36 lg:p-8">
          <Skeleton className="h-6 w-48 lg:h-9 lg:w-72" />
          <Skeleton className="h-4 w-60 max-w-full lg:h-5 lg:w-96" />
        </div>

        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
          ))}
        </div>

        <div className="flex w-full flex-col gap-3 lg:gap-4">
          <div className="flex w-full items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>

          <div className="flex w-full flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <StructuredProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mirrors StructuredProductDetail: logo row, name/coupon summary, detail table, allocation grid, caption, CTA buttons. */
export function StructuredProductDetailSkeleton() {
  return (
    <ProductDetailPageSkeleton>
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <Skeleton className="size-8 shrink-0 rounded" />
              <Skeleton className="size-8 shrink-0 rounded" />
            </div>
            <Skeleton className="h-6 w-28 shrink-0 rounded" />
          </div>

          <div className="flex w-full items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <KeyValueTableSkeleton rows={9} />
          <div
            className="grid w-full grid-cols-2 overflow-hidden rounded-md"
            style={{ border: `1px solid ${BORDER_COLOR}` }}
          >
            <div
              className="flex flex-col items-center gap-1 bg-[#f9fafb] px-4 py-3"
              style={{ borderRight: `1px solid ${BORDER_COLOR}` }}
            >
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex flex-col items-center gap-1 bg-[#f9fafb] px-4 py-3">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <Skeleton className="h-12 w-full max-w-[343px] rounded-xl" />
        <Skeleton className="h-12 w-full max-w-[343px] rounded-xl" />
      </div>
    </ProductDetailPageSkeleton>
  );
}

/** Mirrors ThaiStructuredProductDetail: name/coupon summary, 12-row detail table, CTA buttons. */
export function ThaiStructuredProductDetailSkeleton() {
  return (
    <ProductDetailPageSkeleton stretchContent>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        <KeyValueTableSkeleton rows={12} />
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <Skeleton className="h-12 w-full max-w-[343px] rounded-xl" />
        <Skeleton className="h-12 w-full max-w-[343px] rounded-xl" />
      </div>
    </ProductDetailPageSkeleton>
  );
}

/** Mirrors MutualFundDetail: header, NAV hero, tabs, chart, stat rows, CTA bar. */
export function MutualFundDetailSkeleton() {
  return (
    <div className="flex w-full flex-col pb-20 max-lg:bg-white lg:bg-[#f9fafb] lg:pt-2">
      <div className="mx-auto flex w-full max-w-[996px] flex-col gap-2 px-4 md:px-8 lg:px-0">
        <div className="hidden py-2 lg:block lg:pr-2">
          <DetailHeaderSkeleton maxWidth="w-full" center={false} />
        </div>

        <div className="flex w-full flex-col gap-6 lg:rounded-t-2xl lg:bg-white lg:px-14 lg:py-8 lg:shadow-[0px_0px_8px_0px_rgba(0,0,0,0.02)]">
          {/* Symbol and name, with the back arrow alongside only below `lg` —
              above it the arrow lives in the header bar, same as the real
              detail. */}
          <div className="flex flex-col gap-2 pt-4 lg:pt-0">
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 shrink-0 rounded-lg lg:hidden" />
              <Skeleton className="h-7 w-28" />
            </div>
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-5 w-56" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-2xl" />
              <Skeleton className="h-5 w-36 rounded-2xl" />
            </div>
          </div>
          <div className="sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-black/10 bg-white pb-2 md:overflow-visible">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 shrink-0 md:flex-1 md:shrink" />
            ))}
          </div>
          <Skeleton className="h-[227px] w-full rounded-lg" />
          <StatCardRowSkeleton cards={3} />
          <KeyValueTableSkeleton rows={8} />
        </div>
      </div>
    </div>
  );
}
