"use client";

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
import {
  GlobalBondBookingContext,
  GlobalBondProposalContext,
} from "./GlobalBondDetailBondList";
import { useQuotaBooking } from "@/app/(dashboard)/orders/useQuotaBooking";
import { useSendProposal } from "@/app/(dashboard)/orders/useSendProposal";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import {
  COUPON_OPTIONS,
  FilterDropdown,
  GlobalBondAllFilterPanel,
  MATURITY_OPTIONS,
  TICKER_OPTIONS,
  YIELD_OPTIONS,
} from "./GlobalBondAllFilterPanel";
import { useOverseasBonds } from "@/hooks/use-catalog";
import { GlobalBondAllPageSkeleton } from "./ProductDetailSkeletons";
import { PAGE_SIZE_OPTIONS } from "./fixed-income-shared";

const THAI_MONTH_ABBR: Record<string, string> = {
  January: "ม.ค.",
  February: "ก.พ.",
  March: "มี.ค.",
  April: "เม.ย.",
  May: "พ.ค.",
  June: "มิ.ย.",
  July: "ก.ค.",
  August: "ส.ค.",
  September: "ก.ย.",
  October: "ต.ค.",
  November: "พ.ย.",
  December: "ธ.ค.",
};

function formatUpdatedAtMobile(dateStr: string): string {
  const match = dateStr.match(/^(\d+)\s+(\w+)\s+(\d{4})\s+-\s+(\d{2})\.(\d{2})$/);
  if (!match) return dateStr;
  const [, day, monthEn, year, hour, minute] = match;
  const thaiMonth = THAI_MONTH_ABBR[monthEn] ?? monthEn;
  return `${day} ${thaiMonth} ${Number(year) + 543} - ${hour}:${minute}`;
}

function formatUpdatedAtTablet(dateStr: string): string {
  return dateStr.replace("September", "Sep").replace("August", "Aug");
}

export function GlobalBondAllPage({ onBack }: { onBack: () => void }) {
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

  const updatedAtMobile = formatUpdatedAtMobile(ALL_OVERSEAS_BONDS_UPDATED_AT);
  const updatedAtTablet = formatUpdatedAtTablet(ALL_OVERSEAS_BONDS_UPDATED_AT);

  const filteredBonds = useMemo(
    () =>
      filterAllOverseasBonds(
        allBonds,
        tickerFilter,
        couponFilter,
        yieldFilter,
        maturityFilter,
      ),
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
    <div className="flex flex-col items-stretch w-full pt-4 pb-10 px-4 md:pt-6 md:pb-20 md:px-8 lg:px-20 bg-gradient-to-b from-white from-[43.451%] to-transparent">
      <div className="flex md:hidden w-full items-center gap-2 border-b border-[rgba(0,0,0,0.1)] -mx-4 px-4 py-3 mb-4">
        <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ" className="shrink-0">
          <ArrowLeftIcon size={24} />
        </Button>
        <h1 className="flex-1 min-w-0 text-base font-bold leading-[28px] text-[#101828] text-center truncate">
          All Overseas Bonds
        </h1>
        <div className="size-6 shrink-0" aria-hidden />
      </div>

      <div className="hidden md:flex gap-2 items-center h-[46px] py-2 w-full max-w-[1280px] mx-auto">
        <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ" className="shrink-0">
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="flex-1 min-w-0 text-lg font-bold leading-[30px] text-[#101828] truncate">
          All Overseas Bonds
        </h1>
      </div>

      <div className="flex flex-col gap-4 md:gap-8 lg:gap-8 w-full max-w-[1280px] mx-auto">
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
            className="max-w-none object-cover pointer-events-none rounded-xl"
            src="/products/global-bond/global-bond-all-hero.webp"
          />
          <div className="relative z-[1] flex w-full flex-col gap-4 md:gap-6">
            {/* Mobile banner — stacked: title → subtitle → filter button */}
            <div className="flex w-full flex-col items-start gap-4 md:hidden">
              <div className="flex w-full flex-col gap-2">
                <p className="text-2xl font-bold leading-9 text-[rgba(0,0,0,0.85)]">
                  All Overseas Bonds
                </p>
                <p className="max-w-[211px] text-sm font-semibold leading-[26px] text-[rgba(0,0,0,0.75)]">
                  รวม Overseas bonds ทั้งหมด
                  <br />
                  ที่สามารถทำการซื้อขายได้
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white py-2.5 pl-3 pr-4 text-sm font-medium leading-[26px] text-[#0a6ee7] cursor-pointer"
              >
                <FunnelSimpleIcon size={20} />
                ตัวกรอง
              </button>
            </div>

            {/* Tablet banner — title + button on same row */}
            <div className="hidden w-full flex-wrap content-end items-end gap-4 md:flex lg:hidden">
              <div className="flex min-w-[200px] flex-[1_0_0] flex-col gap-2">
                <p className="text-2xl font-bold leading-9 text-[rgba(0,0,0,0.85)]">
                  All Overseas Bonds
                </p>
                <p className="text-sm font-semibold leading-[26px] text-[rgba(0,0,0,0.75)]">
                  รวม Overseas bonds ทั้งหมด ที่สามารถทำการซื้อขายได้
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className="inline-flex shrink-0 max-w-[343px] items-center gap-1 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white py-2.5 pl-3 pr-4 text-sm font-medium leading-[26px] text-[#0a6ee7] cursor-pointer"
              >
                <FunnelSimpleIcon size={20} />
                ตัวกรอง
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
            <div className="hidden lg:flex w-full flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-[32px] font-bold leading-[48px] text-[rgba(0,0,0,0.85)]">
                  All Overseas Bonds
                </p>
                <p className="text-base font-semibold leading-[28px] text-[rgba(0,0,0,0.75)]">
                  รวม Overseas bonds ทั้งหมด ที่สามารถทำการซื้อขายได้
                </p>
              </div>
              <div className="flex w-full flex-nowrap items-center gap-3">
                <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-3">
                  <FilterDropdown value={tickerFilter} options={TICKER_OPTIONS} onChange={setTickerFilter} />
                  <FilterDropdown value={couponFilter} options={COUPON_OPTIONS} onChange={setCouponFilter} />
                  <FilterDropdown value={yieldFilter} options={YIELD_OPTIONS} onChange={setYieldFilter} />
                  <FilterDropdown value={maturityFilter} options={MATURITY_OPTIONS} onChange={setMaturityFilter} />
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="shrink-0 cursor-pointer rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3.5 py-2 text-sm font-medium leading-[26px] text-[#0a6ee7] whitespace-nowrap"
                >
                  ล้างตัวเลือกทั้งหมด
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full items-center lg:gap-4">
          <div className="flex items-center justify-between w-full gap-3">
            <p className="text-sm font-bold leading-[24px] text-[#101828] md:text-base md:leading-[28px]">
              จำนวน {displayCount} รายการ
            </p>
            <span className="text-xs leading-[20px] text-[#6a7282] whitespace-nowrap shrink-0 md:text-sm md:leading-[24px]">
              <span className="md:hidden">อัปเดตล่าสุด {updatedAtMobile}</span>
              <span className="hidden md:inline lg:hidden">อัปเดตล่าสุด {updatedAtTablet}</span>
              <span className="hidden lg:inline">อัปเดตล่าสุด {ALL_OVERSEAS_BONDS_UPDATED_AT}</span>
            </span>
          </div>
          <div className="w-full lg:hidden">
            <GlobalBondAllAccordion bonds={pagedBonds} />
          </div>
          <div className="hidden w-full lg:block">
            <GlobalBondAllTable bonds={pagedBonds} />
          </div>
          {filteredBonds.length > 0 && (
            <div className="flex w-full flex-wrap-reverse items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                <p className="text-xs text-[#6a7282] whitespace-nowrap">Show per page</p>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-[rgba(0,0,0,0.08)] bg-white px-2 py-1 text-xs text-[#101828] cursor-pointer focus:outline-none"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-[#6a7282] whitespace-nowrap">
                  Showing{" "}
                  <span className="font-medium text-[#101828]">
                    {(safePage - 1) * pageSize + 1}
                  </span>
                  {" – "}
                  <span className="font-medium text-[#101828]">
                    {Math.min(safePage * pageSize, filteredBonds.length)}
                  </span>
                  {" of "}
                  <span className="font-medium text-[#101828]">{filteredBonds.length}</span>{" "}
                  items
                </p>
                <Pagination totalPages={totalPages} currentPage={safePage} onPageChange={setCurrentPage} />
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
