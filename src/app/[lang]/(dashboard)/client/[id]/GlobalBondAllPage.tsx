"use client";

import type { Locale } from "@/i18n/config";
import { formatDate, formatTime } from "@/i18n/format";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button, Pagination } from "@sarunyu/system-one";
import { ArrowLeftIcon, FunnelSimpleIcon } from "@phosphor-icons/react";
import {
  ALL_OVERSEAS_BONDS_UPDATED_AT,
  filterAllOverseasBonds,
  type CouponFilter,
  type MaturityFilter,
  type TickerFilter,
  type YieldFilter,
} from "./global-bond-data";
import { GlobalBondAllAccordion } from "./GlobalBondAllAccordion";
import { GlobalBondAllTable } from "./GlobalBondAllTable";
import { GlobalBondBookingContext, GlobalBondProposalContext } from "./GlobalBondDetailBondList";
import { useQuotaBooking } from "@/app/[lang]/(dashboard)/orders/useQuotaBooking";
import { useSendProposal } from "@/app/[lang]/(dashboard)/orders/useSendProposal";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import {
  FilterDropdown,
  GlobalBondAllFilterPanel,
  globalBondFilterOptions,
} from "./GlobalBondAllFilterPanel";
import { useOverseasBonds } from "@/hooks/use-catalog";
import { GlobalBondAllPageSkeleton } from "./ProductDetailSkeletons";
import { PAGE_SIZE_OPTIONS } from "./fixed-income-shared";
import { useLocale, useT } from "@/i18n/I18nProvider";

const UPDATED_AT_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * The feed stamps its update as `"10 September 2025 - 09.00"` (English month,
 * Gregorian year, Bangkok wall-clock). Read it back into parts and print it in
 * the reader's language — a short month on the narrow layouts, the long one on
 * desktop. A stamp that doesn't match is shown as sent.
 */
function formatUpdatedAt(dateStr: string, locale: Locale, style: "short" | "long"): string {
  const match = dateStr.match(/^(\d+)\s+(\w+)\s+(\d{4})\s+-\s+(\d{2})\.(\d{2})$/);
  const month = match ? UPDATED_AT_MONTHS.indexOf(match[2]) : -1;
  if (!match || month < 0) return dateStr;
  const [, day, , year, hour, minute] = match;
  // Built in UTC and printed in UTC, so the wall-clock time survives untouched.
  const at = Date.UTC(Number(year), month, Number(day), Number(hour), Number(minute));
  return `${formatDate(locale, at, style, "UTC")} - ${formatTime(locale, at, "UTC")}`;
}

export function GlobalBondAllPage({ onBack }: { onBack: () => void }) {
  const locale = useLocale();
  const t = useT();
  const labels = t.products.globalBond.all;
  const options = globalBondFilterOptions(t);
  const booking = useQuotaBooking();
  // Its own stack: the page mounts no toaster of its own, and a send has to
  // be able to report. See `useSendProposal`.
  const proposal = useSendProposal();
  const { data: allBonds, isLoading } = useOverseasBonds();
  const [tickerFilter, setTickerFilter] = useState<TickerFilter>("all");
  const [couponFilter, setCouponFilter] = useState<CouponFilter>("all");
  const [yieldFilter, setYieldFilter] = useState<YieldFilter>("all");
  const [maturityFilter, setMaturityFilter] = useState<MaturityFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const updatedAtShort = formatUpdatedAt(ALL_OVERSEAS_BONDS_UPDATED_AT, locale, "short");
  const updatedAtLong = formatUpdatedAt(ALL_OVERSEAS_BONDS_UPDATED_AT, locale, "long");

  const filteredBonds = useMemo(
    () => filterAllOverseasBonds(allBonds, tickerFilter, couponFilter, yieldFilter, maturityFilter),
    [allBonds, tickerFilter, couponFilter, yieldFilter, maturityFilter],
  );

  const hasActiveFilters =
    tickerFilter !== "all" ||
    couponFilter !== "all" ||
    yieldFilter !== "all" ||
    maturityFilter !== "all";

  // `allBonds.length` rather than the `ALL_OVERSEAS_BONDS_COUNT` constant: the
  // two are equal today (the mock list is generated to that length) but only
  // the former stays right once this list comes from an endpoint.
  const displayCount = hasActiveFilters ? filteredBonds.length : allBonds.length;
  const totalPages = Math.max(1, Math.ceil(filteredBonds.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const pagedBonds = useMemo(
    () => filteredBonds.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredBonds, safePage, pageSize],
  );

  const clearFilters = () => {
    setTickerFilter("all");
    setCouponFilter("all");
    setYieldFilter("all");
    setMaturityFilter("all");
    setCurrentPage(1);
  };
  // The empty card offers to clear only when a filter is what emptied it;
  // with no bonds at all there is nothing to clear.
  const clearFiltersIfNarrowed = hasActiveFilters && allBonds.length > 0 ? clearFilters : undefined;

  // Reset to page 1 whenever the active filter set changes.
  const [prevFilterKey, setPrevFilterKey] = useState({
    tickerFilter,
    couponFilter,
    yieldFilter,
    maturityFilter,
  });
  if (
    prevFilterKey.tickerFilter !== tickerFilter ||
    prevFilterKey.couponFilter !== couponFilter ||
    prevFilterKey.yieldFilter !== yieldFilter ||
    prevFilterKey.maturityFilter !== maturityFilter
  ) {
    setPrevFilterKey({ tickerFilter, couponFilter, yieldFilter, maturityFilter });
    setCurrentPage(1);
  }

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  if (isLoading) return <GlobalBondAllPageSkeleton />;

  return (
    <GlobalBondBookingContext.Provider value={ORDER_BOOKING_ENABLED ? booking.book : null}>
      <GlobalBondProposalContext.Provider value={ORDER_BOOKING_ENABLED ? proposal.send : null}>
        {booking.ui}
        {proposal.ui}
        <div className="flex w-full flex-col items-stretch bg-gradient-to-b from-white from-[43.451%] to-transparent px-4 pt-4 pb-10 md:px-8 md:pt-6 md:pb-20 lg:px-20">
          <div className="-mx-4 mb-4 flex w-full items-center gap-2 border-b border-[rgba(0,0,0,0.1)] px-4 py-3 md:hidden">
            <Button
              variant="plain"
              size="icon-sm"
              onClick={onBack}
              aria-label={t.products.common.back}
              className="shrink-0"
            >
              <ArrowLeftIcon size={24} />
            </Button>
            <h1 className="min-w-0 flex-1 truncate text-center text-base leading-[28px] font-bold text-[#101828]">
              {labels.title}
            </h1>
            <div className="size-6 shrink-0" aria-hidden />
          </div>

          <div className="mx-auto hidden h-[46px] w-full max-w-[1280px] items-center gap-2 py-2 md:flex">
            <Button
              variant="plain"
              size="icon-sm"
              onClick={onBack}
              aria-label={t.products.common.back}
              className="shrink-0"
            >
              <ArrowLeftIcon size={20} />
            </Button>
            <h1 className="min-w-0 flex-1 truncate text-lg leading-[30px] font-bold text-[#101828]">
              {labels.title}
            </h1>
          </div>

          <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 md:gap-8 lg:gap-8">
            <div className="relative flex w-full flex-col gap-4 overflow-hidden rounded-xl px-4 py-6 md:gap-6 md:p-8">
              {/* `fill` renders exactly the `absolute inset-0 size-full` this used
              to set by hand; `priority` keeps it eager, the way a plain <img>
              loaded it, since the banner is above the fold. */}
              <Image
                alt=""
                aria-hidden
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="pointer-events-none max-w-none rounded-xl object-cover"
                src="/products/global-bond/global-bond-all-hero.webp"
              />
              <div className="relative z-[1] flex w-full flex-col gap-4 md:gap-6">
                {/* Mobile banner — stacked: title → subtitle → filter button */}
                <div className="flex w-full flex-col items-start gap-4 md:hidden">
                  <div className="flex w-full flex-col gap-2">
                    <p className="text-2xl leading-9 font-bold text-[rgba(0,0,0,0.85)]">
                      {labels.title}
                    </p>
                    <p className="max-w-[211px] text-sm leading-[26px] font-semibold text-[rgba(0,0,0,0.75)]">
                      {labels.subtitleLines[0]}
                      <br />
                      {labels.subtitleLines[1]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white py-2.5 pr-4 pl-3 text-sm leading-[26px] font-medium text-[#0a6ee7]"
                  >
                    <FunnelSimpleIcon size={20} />
                    {t.products.common.filter}
                  </button>
                </div>

                {/* Tablet banner — title + button on same row */}
                <div className="hidden w-full flex-wrap content-end items-end gap-4 md:flex lg:hidden">
                  <div className="flex min-w-[200px] flex-[1_0_0] flex-col gap-2">
                    <p className="text-2xl leading-9 font-bold text-[rgba(0,0,0,0.85)]">
                      {labels.title}
                    </p>
                    <p className="text-sm leading-[26px] font-semibold text-[rgba(0,0,0,0.75)]">
                      {labels.subtitleLines.join(" ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    className="inline-flex max-w-[343px] shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white py-2.5 pr-4 pl-3 text-sm leading-[26px] font-medium text-[#0a6ee7]"
                  >
                    <FunnelSimpleIcon size={20} />
                    {t.products.common.filter}
                  </button>
                </div>
                {filtersOpen && (
                  <div className="lg:hidden">
                    <GlobalBondAllFilterPanel
                      tickerFilter={tickerFilter}
                      couponFilter={couponFilter}
                      yieldFilter={yieldFilter}
                      maturityFilter={maturityFilter}
                      onTickerChange={setTickerFilter}
                      onCouponChange={setCouponFilter}
                      onYieldChange={setYieldFilter}
                      onMaturityChange={setMaturityFilter}
                      onClear={() => {
                        clearFilters();
                        setFiltersOpen(false);
                      }}
                    />
                  </div>
                )}
                {/* Desktop banner — title + filters in one block */}
                <div className="hidden w-full flex-col gap-4 lg:flex">
                  <div className="flex flex-col gap-2">
                    <p className="text-[32px] leading-[48px] font-bold text-[rgba(0,0,0,0.85)]">
                      {labels.title}
                    </p>
                    <p className="text-base leading-[28px] font-semibold text-[rgba(0,0,0,0.75)]">
                      {labels.subtitleLines.join(" ")}
                    </p>
                  </div>
                  <div className="flex w-full flex-nowrap items-center gap-3">
                    <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-3">
                      <FilterDropdown
                        value={tickerFilter}
                        options={options.ticker}
                        onChange={setTickerFilter}
                      />
                      <FilterDropdown
                        value={couponFilter}
                        options={options.coupon}
                        onChange={setCouponFilter}
                      />
                      <FilterDropdown
                        value={yieldFilter}
                        options={options.yield}
                        onChange={setYieldFilter}
                      />
                      <FilterDropdown
                        value={maturityFilter}
                        options={options.maturity}
                        onChange={setMaturityFilter}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="shrink-0 cursor-pointer rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3.5 py-2 text-sm leading-[26px] font-medium whitespace-nowrap text-[#0a6ee7]"
                    >
                      {t.products.common.clearAllSelection}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-center gap-3 lg:gap-4">
              <div className="flex w-full items-center justify-between gap-3">
                <p className="text-sm leading-[24px] font-bold text-[#101828] md:text-base md:leading-[28px]">
                  {t.products.common.itemCount(displayCount)}
                </p>
                <span className="shrink-0 text-xs leading-[20px] whitespace-nowrap text-[#6a7282] md:text-sm md:leading-[24px]">
                  <span className="lg:hidden">{t.products.common.updatedAt(updatedAtShort)}</span>
                  <span className="hidden lg:inline">
                    {t.products.common.updatedAt(updatedAtLong)}
                  </span>
                </span>
              </div>
              <div className="w-full lg:hidden">
                <GlobalBondAllAccordion
                  bonds={pagedBonds}
                  onClearFilters={clearFiltersIfNarrowed}
                />
              </div>
              <div className="hidden w-full lg:block">
                <GlobalBondAllTable bonds={pagedBonds} onClearFilters={clearFiltersIfNarrowed} />
              </div>
              {filteredBonds.length > 0 && (
                <div className="flex w-full flex-wrap-reverse items-center justify-end gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs whitespace-nowrap text-[#6a7282]">
                      {t.products.pagination.perPage}
                    </p>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="cursor-pointer rounded-md border border-[rgba(0,0,0,0.08)] bg-white px-2 py-1 text-xs text-[#101828] focus:outline-none"
                    >
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs whitespace-nowrap text-[#6a7282]">
                      {t.products.pagination.showing(
                        {
                          from: (safePage - 1) * pageSize + 1,
                          to: Math.min(safePage * pageSize, filteredBonds.length),
                          total: filteredBonds.length,
                        },
                        (n) => (
                          <span className="font-medium text-[#101828]">{n}</span>
                        ),
                      )}
                    </p>
                    <Pagination
                      totalPages={totalPages}
                      currentPage={safePage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlobalBondProposalContext.Provider>
    </GlobalBondBookingContext.Provider>
  );
}
