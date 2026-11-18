/**
 * Loading skeletons for the Product Catalog's full-page detail views.
 *
 * One component per page here, each mirroring that page's real layout closely
 * enough that the swap from loading to loaded doesn't shift anything. The
 * section-level and card-level pieces they build on live in
 * `ProductCatalogSkeletons.tsx` and `@/components/ui/detail-skeletons`.
 */
import { Skeleton, TabsSkeleton } from "@/components/ui/skeleton";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
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
      <div className="flex flex-col gap-6 w-full">
        <div className="flex gap-2 items-center w-full pb-2 border-b border-black/10">
          <Skeleton className="h-4 flex-1 max-w-xs" />
          <Skeleton className="size-5 rounded shrink-0" />
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="flex gap-3 items-center w-full">
            <Skeleton className="size-12 rounded-md shrink-0" />
            <div className="flex flex-1 min-w-0 flex-col gap-1">
              <Skeleton className="h-5 w-32" />
              <div className="flex gap-2 items-center">
                <Skeleton className="h-5 w-14 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end shrink-0">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>

          <div className="flex flex-col gap-3 items-center w-full">
            <KeyValueTableSkeleton rows={12} />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 items-center w-full">
        <Skeleton className="h-12 w-full max-w-[343px] rounded-xl" />
      </div>
    </ProductDetailPageSkeleton>
  );
}

/** Mirrors FixedIncomeCompanyDetail's hero: logo+title, description, asset-tag pills. */
function CompanyHeroSkeleton() {
  return (
    <div className="relative flex flex-col gap-6 p-8 rounded-xl overflow-hidden bg-[var(--fill-gray-100)]">
      <div className="flex flex-col gap-4 w-full">
        <div className="flex gap-4 items-center w-full">
          <Skeleton className="size-14 rounded-xl shrink-0 bg-[var(--fill-gray-300)]" />
          <Skeleton className="h-9 flex-1 max-w-md bg-[var(--fill-gray-300)]" />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Skeleton className="h-4 w-full max-w-xl bg-[var(--fill-gray-300)]" />
          <Skeleton className="h-4 w-2/3 max-w-md bg-[var(--fill-gray-300)]" />
        </div>
      </div>
      <div className="flex flex-col gap-4 w-full">
        <Skeleton className="h-4 w-40 bg-[var(--fill-gray-300)]" />
        <div className="flex flex-wrap gap-3 items-start">
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
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-0.5 w-full">
        <Skeleton className="h-9 w-48" />
        <div className="flex items-center justify-between w-full">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <ColumnTableSkeleton columns={columns} rows={6} rowHeightClass="h-[52px]" firstColWide />
    </div>
  );
}

/** Mirrors FixedIncomeCompanyDetail: hero card, primary bond table, optional gray secondary band. */
export function FixedIncomeCompanyDetailSkeleton({ hasSecondary = false }: { hasSecondary?: boolean }) {
  return (
    <div
      className="flex flex-col items-stretch w-full pt-6 pb-20 px-4 md:px-8 lg:px-20"
      style={{ backgroundColor: "#f9fafb" }}
    >
      <DetailHeaderSkeleton maxWidth="max-w-[1280px]" />

      <div className="flex flex-col gap-8 w-full max-w-[1280px] mx-auto">
        <CompanyHeroSkeleton />

        <CompanyBondSectionSkeleton columns={12} />

        {hasSecondary && (
          <div className="-mx-[9999px] px-[9999px] bg-[#f9fafb] py-8">
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
    <div className="flex flex-col items-stretch w-full pt-4 pb-10 px-4 md:pt-6 md:pb-20 md:px-8 lg:px-20 bg-gradient-to-b from-white from-[43.451%] to-transparent">
      <DetailHeaderSkeleton maxWidth="max-w-[1280px]" />

      <div className="flex flex-col gap-4 md:gap-8 w-full max-w-[1280px] mx-auto">
        {/* Mirrors GlobalBondDetailHero: logo + title + tags, description, then the two filter pill groups inside the banner. */}
        <div className="flex flex-col gap-6 px-4 py-6 md:p-8 rounded-xl overflow-hidden bg-[var(--fill-gray-100)]">
          <div className="flex flex-col gap-2 md:gap-1.5 lg:min-h-[83px] lg:justify-between w-full">
            <div className="flex flex-col gap-2 lg:pb-[9px] w-full">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between w-full">
                <div className="flex gap-2 items-center min-w-0">
                  <Skeleton className="size-7 md:size-8 rounded-lg shrink-0 bg-[var(--fill-gray-300)]" />
                  <Skeleton className="h-[30px] md:h-10 w-48 md:w-80 bg-[var(--fill-gray-300)]" />
                </div>
                <div className="flex flex-wrap gap-[7px] items-center">
                  <Skeleton className="h-7 w-24 rounded bg-[var(--fill-gray-300)]" />
                  <Skeleton className="h-7 w-28 rounded bg-[var(--fill-gray-300)]" />
                  <Skeleton className="h-7 w-48 lg:w-80 rounded bg-[var(--fill-gray-300)]" />
                </div>
              </div>
            </div>
            <Skeleton className="h-5 w-full max-w-sm bg-[var(--fill-gray-300)]" />
          </div>

          <div className="flex flex-col gap-3 md:gap-2 lg:flex-row lg:gap-10 lg:items-center w-full">
            {[5, 3].map((pills, g) => (
              <div key={g} className="flex flex-col gap-2 min-w-0">
                <Skeleton className="h-5 w-32 shrink-0 bg-[var(--fill-gray-300)]" />
                <div className="flex gap-1 items-center p-1 rounded-lg bg-[var(--fill-gray-300)]/50 overflow-hidden">
                  {Array.from({ length: pills }).map((_, i) => (
                    <Skeleton key={i} className="h-[38px] w-14 md:w-16 rounded-lg shrink-0 bg-[var(--fill-gray-300)]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:gap-12 w-full">
          {ORDER_BOOKING_ENABLED && <TabsSkeleton count={2} />}

          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between w-full">
              <Skeleton className="h-6 md:h-7 w-28 md:w-32" />
              <Skeleton className="h-5 md:h-6 w-40 md:w-64" />
            </div>
            <div className="lg:hidden w-full">
              <AccordionListSkeleton rows={5} />
            </div>
            <div className="hidden lg:block w-full">
              <ColumnTableSkeleton columns={9} rows={6} rowHeightClass="h-[52px]" firstColWide />
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <div className="flex gap-2 items-center">
              <Skeleton className="size-5 rounded shrink-0" />
              <Skeleton className="h-5 w-40" />
            </div>
            <StatCardRowSkeleton cards={3} className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full" cardHeightClass="h-[240px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mirrors GlobalBondAllPage: filter hero, bond list, pagination footer. */
export function GlobalBondAllPageSkeleton() {
  return (
    <div className="flex flex-col items-stretch w-full pt-4 pb-10 px-4 md:pt-6 md:pb-20 md:px-8 lg:px-20 bg-gradient-to-b from-white from-[43.451%] to-transparent">
      <DetailHeaderSkeleton maxWidth="max-w-[1280px]" />

      <div className="flex flex-col gap-4 md:gap-8 w-full max-w-[1280px] mx-auto">
        {/* Mirrors the real hero: big title + description, then (desktop) the 4 filter dropdowns + clear button inside the banner. */}
        <div className="flex w-full flex-col gap-4 rounded-xl px-4 py-6 md:gap-6 md:p-8 bg-[var(--fill-gray-100)]">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 lg:h-12 w-56 lg:w-[420px] bg-[var(--fill-gray-300)]" />
            <Skeleton className="h-5 lg:h-6 w-64 lg:w-[540px] bg-[var(--fill-gray-300)]" />
          </div>
          <Skeleton className="h-[46px] w-40 rounded-lg lg:hidden bg-[var(--fill-gray-300)]" />
          <div className="hidden lg:flex w-full flex-nowrap items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-11 flex-1 min-w-0 rounded-lg bg-[var(--fill-gray-300)]" />
              ))}
            </div>
            <Skeleton className="h-11 w-36 shrink-0 rounded-lg bg-[var(--fill-gray-300)]" />
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:gap-4 w-full items-center">
          <div className="flex items-center justify-between w-full">
            <Skeleton className="h-6 md:h-7 w-32 md:w-36" />
            <Skeleton className="h-5 md:h-6 w-40 md:w-64" />
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
    <div className="flex flex-col items-center gap-8 w-full pt-6 pb-20 bg-gradient-to-b from-white from-[43.451%] to-transparent">
      {/* Same box as the real header (h-[46px], px-4/8/20) so the back button and title don't shift. */}
      <div className="flex gap-2 items-center h-[46px] py-2 w-full max-w-[1280px] px-4 md:px-8 lg:px-20">
        <Skeleton className="size-7 rounded-md shrink-0" />
        <Skeleton className="h-6 w-28" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-[1280px] px-4 md:px-8 lg:px-20">
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
        <div className="relative flex w-full items-center -mb-6 min-h-[100px] pt-3 pb-10 md:pt-4 md:pb-10 lg:min-h-[155px] lg:pt-8 lg:pb-14" style={{ backgroundColor: "#f3f4f6" }}>
          <div className="relative z-[1] flex flex-1 gap-2 lg:gap-4 items-center w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-20">
            <div className="flex flex-1 gap-2 lg:gap-4 items-center min-w-0">
              <Skeleton className="size-6 md:size-8 lg:size-10 rounded-md shrink-0" />
              <div className="flex flex-1 flex-col gap-0.5 md:gap-1 lg:gap-2 min-w-0">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5 lg:gap-2 items-end shrink-0">
              <Skeleton className="h-7 w-24 lg:h-[34px] lg:w-[112px] rounded-md" />
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
        <div className="relative flex w-full items-center min-h-[100px] lg:h-[146px] -mb-6 overflow-hidden" style={{ backgroundColor: "#f3f4f6" }}>
          <div className="relative z-[1] flex items-center gap-4 w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-20">
            <Skeleton className="size-8 lg:size-10 rounded-full shrink-0" />
            <div className="flex flex-1 flex-col gap-1 md:gap-2 min-w-0">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="flex flex-col gap-1 md:gap-2 items-end shrink-0">
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
    <div className="flex flex-col items-center w-full pt-4 pb-10 lg:pt-6 lg:pb-20">
      <div className="flex flex-col gap-4 lg:gap-6 w-full max-w-[1280px] px-4 md:px-8 lg:px-20">
        <DetailHeaderSkeleton maxWidth="max-w-[1280px]" />

        {/* Hero banner's background-image variant, without the logo chip. */}
        <div className="relative flex w-full flex-col gap-2 items-start overflow-hidden rounded-xl p-4 h-32 lg:h-36 lg:p-8 bg-[var(--fill-gray-100)]">
          <Skeleton className="h-6 lg:h-9 w-48 lg:w-72" />
          <Skeleton className="h-4 lg:h-5 w-60 lg:w-96 max-w-full" />
        </div>

        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:gap-4 w-full">
          <div className="flex items-center justify-between w-full">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>

          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4 w-full">
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
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex gap-2 items-center w-full">
            <div className="flex flex-1 min-w-0 gap-1 items-center">
              <Skeleton className="size-8 rounded shrink-0" />
              <Skeleton className="size-8 rounded shrink-0" />
            </div>
            <Skeleton className="h-6 w-28 rounded shrink-0" />
          </div>

          <div className="flex gap-2 items-center w-full">
            <div className="flex flex-1 min-w-0 flex-col gap-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex flex-col gap-1 items-end shrink-0">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 items-center w-full">
          <KeyValueTableSkeleton rows={9} />
          <div
            className="grid grid-cols-2 w-full rounded-md overflow-hidden"
            style={{ border: `1px solid ${BORDER_COLOR}` }}
          >
            <div
              className="flex flex-col gap-1 px-4 py-3 items-center bg-[#f9fafb]"
              style={{ borderRight: `1px solid ${BORDER_COLOR}` }}
            >
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex flex-col gap-1 px-4 py-3 items-center bg-[#f9fafb]">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
      </div>

      <div className="flex flex-col gap-3 items-center w-full">
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
          <div className="flex flex-col gap-1 items-end shrink-0">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        <KeyValueTableSkeleton rows={12} />
      </div>

      <div className="flex flex-col gap-3 items-center w-full">
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
              <Skeleton className="size-7 rounded-lg shrink-0 lg:hidden" />
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
