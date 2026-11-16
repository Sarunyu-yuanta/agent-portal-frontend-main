"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button, SearchInput, useIsMobile } from "@sarunyu/system-one";
import {
  ArrowLeftIcon,
  FunnelSimpleIcon,
} from "@phosphor-icons/react";
import {
  MutualFundListCard,
  MutualFundListCardMobile,
} from "./MutualFundCard";
import {
  MutualFundFilterBottomSheet,
  MutualFundFilterModal,
  EMPTY_FILTER_STATE,
  applyMutualFundFilter,
  isEmptyFilterState,
  type MutualFundFilterState,
} from "./MutualFundFilterPanel";
import { MutualFundLegendBottomSheet, MutualFundLegendModal } from "./MutualFundLegendSheet";
import { MF_ASSETS } from "./mutual-fund-assets";
import { MutualFundTagLegend } from "./mutual-fund-ui";
import { MutualFundFilterResultsSkeleton } from "./MutualFundListPageSkeletons";
import { useMutualFundUniverse } from "@/hooks/use-catalog";
import {
  filterFundsByTag,
  searchFunds,
  fundHasHighlightTag,
  fundHasViewTag,
  MUTUAL_FUND_PERFORMANCE_PERIODS,
  type MutualFundPerformancePeriod,
  type MutualFund,
} from "./mutual-fund-data";

function PeriodTabs({
  active,
  onChange,
}: {
  active: MutualFundPerformancePeriod;
  onChange: (period: MutualFundPerformancePeriod) => void;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex w-max min-w-full rounded-full bg-[#f3f3f3] p-1">
        {MUTUAL_FUND_PERFORMANCE_PERIODS.map((period) => {
          const selected = period === active;
          return (
            <button
              key={period}
              type="button"
              onClick={() => onChange(period)}
              className={`flex min-h-8 flex-1 shrink-0 cursor-pointer items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold leading-[20px] whitespace-nowrap ${
                selected
                  ? "bg-white text-[#292524] shadow-[0px_4px_8px_0px_rgba(28,25,23,0.03),0px_8px_16px_0px_rgba(28,25,23,0.02)]"
                  : "text-[#4a5565]"
              }`}
            >
              {period}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Figma 38285:289685 (generic "ตัวกรองกองทุน") / 39910:710474 (tax-planning per-type results).
 * Shared "ผลการกรอง[…]" list page: back + title + funnel-opens-filter, period tabs, list.
 */
export function MutualFundFilterResultsPage({
  title,
  funds,
  defaultPeriod = "YTD",
  initialFilterState = EMPTY_FILTER_STATE,
  onBack,
  onFundSelect,
}: {
  title: string;
  funds: MutualFund[];
  defaultPeriod?: MutualFundPerformancePeriod;
  initialFilterState?: MutualFundFilterState;
  onBack: () => void;
  onFundSelect?: (fundId: string) => void;
}) {
  const [period, setPeriod] = useState<MutualFundPerformancePeriod>(defaultPeriod);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterState, setFilterState] = useState<MutualFundFilterState>(initialFilterState);
  const [legendOpen, setLegendOpen] = useState(false);
  const [viewActive, setViewActive] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);
  const [query, setQuery] = useState("");
  const isPhone = useIsMobile();
  // `funds` is a slice of the fund universe (the whole of it, or the
  // tax-saving subset); the page waits on that.
  const { isLoading } = useMutualFundUniverse();

  const visibleFunds = useMemo(() => applyMutualFundFilter(funds, filterState), [funds, filterState]);
  const showNoMatchesState = !isEmptyFilterState(filterState) && visibleFunds.length === 0;

  const bothOrNeitherTag = viewActive === highlightActive;
  const showViewTag = bothOrNeitherTag || viewActive;
  const showHighlightTag = bothOrNeitherTag || highlightActive;
  const searchTerm = query.trim();
  const tagFunds = searchFunds(filterFundsByTag(visibleFunds, viewActive, highlightActive), query);

  const searchInput = (
    <SearchInput
      value={query}
      onChange={setQuery}
      onClear={() => setQuery("")}
      placeholder="ค้นหากองทุน"
      size="sm"
      className="w-full"
    />
  );
  const filterButton = (
    <Button
      variant="outline"
      size="icon-md"
      onClick={() => setFilterOpen(true)}
      aria-label="ตัวกรอง"
      // Match the sm SearchInput's 38px height so the pair lines up.
      className="size-[38px]! shrink-0"
    >
      <FunnelSimpleIcon size={20} />
    </Button>
  );

  if (isLoading) return <MutualFundFilterResultsSkeleton />;

  return (
    <div className="flex w-full flex-1 flex-col bg-white pb-20">
      <div className="mx-auto flex w-full max-w-[996px] items-center gap-2 px-4 pb-2 pt-4 md:px-8 lg:px-0 lg:pt-8">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={onBack}
          aria-label="กลับ"
          className="size-[30px] shrink-0 rounded-md p-[5px]"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold leading-[32px] text-[#101828]">{title}</h1>
      </div>

      {/* Tags + legend on the left, search + filter on the right. Rendered outside the
          no-matches branch so the filter stays reachable when nothing matches. */}
      <div className="mx-auto w-full max-w-[996px] px-4 pt-4 md:px-8 lg:px-0">
        <MutualFundTagLegend
          viewActive={viewActive}
          highlightActive={highlightActive}
          onToggleView={() => setViewActive((v) => !v)}
          onToggleHighlight={() => setHighlightActive((v) => !v)}
          onShowLegend={() => setLegendOpen(true)}
          trailing={
            <>
              <div className="min-w-0 flex-1 lg:w-[320px] lg:flex-none">{searchInput}</div>
              {filterButton}
            </>
          }
        />
      </div>

      {showNoMatchesState ? (
        <div className="mx-auto flex w-full max-w-[996px] flex-1 flex-col items-center justify-center gap-6 px-4 py-16 md:px-8 lg:px-0">
          <Image
            src={MF_ASSETS.filterEmptyState}
            alt=""
            width={202}
            height={120}
            className="h-[120px] w-[202px] object-contain"
          />
          <div className="flex flex-col items-center gap-3">
            <p className="text-center text-base font-bold leading-[28px] text-[#262626]">
              ไม่พบผลลัพธ์ที่ตรงกับตัวกรองที่คุณเลือก
            </p>
            <Button variant="primary" size="xl" onClick={() => setFilterState(EMPTY_FILTER_STATE)}>
              แสดงกองทุนทั้งหมด
            </Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-[996px] flex-col gap-3 px-4 pt-3 md:px-8 lg:px-0">
          <p className="w-full px-3 text-sm font-normal leading-[24px] text-[#101828]">
            {tagFunds.length} รายการ
          </p>

          <PeriodTabs active={period} onChange={setPeriod} />

          <div className="flex w-full flex-col gap-2 lg:hidden">
            {tagFunds.map((fund, index) => (
              <div key={`${fund.id}-${index}`}>
                {index > 0 ? <div className="mx-3 h-px bg-black/10" /> : null}
                <MutualFundListCardMobile
                  fund={fund}
                  onSelect={onFundSelect}
                  showView={showViewTag && fundHasViewTag(fund)}
                  showHighlight={showHighlightTag && fundHasHighlightTag(fund)}
                />
              </div>
            ))}
          </div>

          <div className="hidden w-full grid-cols-2 gap-x-4 gap-y-6 lg:grid">
            {tagFunds.map((fund, index) => (
              <div key={`${fund.id}-${index}`} className="min-w-0">
                <MutualFundListCard
                  fund={fund}
                  onSelect={onFundSelect}
                  showView={showViewTag && fundHasViewTag(fund)}
                  showHighlight={showHighlightTag && fundHasHighlightTag(fund)}
                />
              </div>
            ))}
          </div>

          {tagFunds.length === 0 ? (
            <p className="px-3 text-center text-sm text-[#6a7282]">
              {searchTerm ? `ไม่พบกองทุนที่ตรงกับ "${searchTerm}"` : "ไม่พบกองทุนในหมวดนี้"}
            </p>
          ) : null}
        </div>
      )}

      {isPhone ? (
        <MutualFundFilterBottomSheet
          open={filterOpen}
          initialState={filterState}
          onOpenChange={setFilterOpen}
          onApply={setFilterState}
        />
      ) : (
        <MutualFundFilterModal
          open={filterOpen}
          initialState={filterState}
          onClose={() => setFilterOpen(false)}
          onApply={setFilterState}
        />
      )}

      {isPhone ? (
        <MutualFundLegendBottomSheet open={legendOpen} onOpenChange={setLegendOpen} />
      ) : (
        <MutualFundLegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
      )}
    </div>
  );
}
