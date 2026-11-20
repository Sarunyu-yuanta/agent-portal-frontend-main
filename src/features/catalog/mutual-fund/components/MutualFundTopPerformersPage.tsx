"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, SearchInput } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { MutualFundListCard } from "./MutualFundCard";
import { MutualFundGroupHeroGraphic } from "./MutualFundGroupHero";
import { MutualFundTopPerformersMobile } from "./MutualFundTopPerformersMobile";
import { MutualFundLegendModal } from "./MutualFundLegendSheet";
import { MutualFundTagLegend } from "./mutual-fund-ui";
import {
  MutualFundTabbedListControlsSkeleton,
  MutualFundTabbedListGridSkeleton,
  MutualFundTabbedListHeroSkeleton,
} from "./MutualFundListPageSkeletons";
import { useMutualFundUniverse } from "@/features/catalog/hooks/use-catalog";
import { TabsSkeleton } from "@/components/ui/skeleton";
import {
  filterFundsByTag,
  searchFunds,
  fundHasHighlightTag,
  fundHasViewTag,
  getMobileGroupGridFunds,
  MOBILE_FUND_GROUPS,
  MOBILE_PERFORMANCE_PERIODS,
  TOP_PERFORMERS_LIST_UPDATED_AT,
  type MobileFundGroupId,
  type MobilePerformancePeriod,
} from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { useT } from "@/i18n/I18nProvider";

function CategoryTabs({
  activeId,
  onSelect,
}: {
  activeId: MobileFundGroupId;
  onSelect: (id: MobileFundGroupId) => void;
}) {
  const t = useT();
  return (
    <div className="w-full overflow-x-auto xl:overflow-visible">
      <div className="flex w-full min-w-max xl:min-w-0">
        {MOBILE_FUND_GROUPS.map((group) => {
          const active = group.id === activeId;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelect(group.id)}
              className={`flex min-w-[80px] flex-1 items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm leading-[24px] font-bold whitespace-nowrap ${
                active ? "border-brand-600 text-brand-600" : "border-black/10 text-neutral-500"
              }`}
            >
              {t.fund.groups[group.id]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PerformancePeriodTabs({
  active,
  onChange,
}: {
  active: MobilePerformancePeriod;
  onChange: (period: MobilePerformancePeriod) => void;
}) {
  return (
    <div className="flex h-10 w-full items-center justify-center">
      <div className="flex w-full rounded-full bg-[#f3f3f3] p-1">
        {MOBILE_PERFORMANCE_PERIODS.map((period) => {
          const selected = period === active;
          return (
            <button
              key={period}
              type="button"
              onClick={() => onChange(period)}
              className={`flex min-h-8 flex-1 items-center justify-center rounded-full px-2 py-1.5 text-xs leading-[20px] font-semibold ${
                selected
                  ? "bg-white text-[#292524] shadow-[0px_4px_8px_0px_rgba(28,25,23,0.03),0px_8px_16px_0px_rgba(28,25,23,0.02)]"
                  : "text-neutral-600"
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

/** Figma 39889:665472 — mutual fund top performers list. */
export function MutualFundTopPerformersPage({
  initialGroupId,
  onBack,
  onFundSelect,
}: {
  initialGroupId: MobileFundGroupId;
  onBack: () => void;
  onFundSelect?: (fundId: string) => void;
}) {
  const t = useT();
  const [groupId, setGroupId] = useState<MobileFundGroupId>(initialGroupId);
  const [period, setPeriod] = useState<MobilePerformancePeriod>("1M");
  const [legendOpen, setLegendOpen] = useState(false);
  const [viewActive, setViewActive] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);
  const [query, setQuery] = useState("");

  const group = MOBILE_FUND_GROUPS.find((g) => g.id === groupId) ?? MOBILE_FUND_GROUPS[0];
  const heroTitle = group.id === "all" ? t.fund.list.allFunds : t.fund.groups[group.id];

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [groupId]);

  // The grid is a slice of the fund universe; the whole page waits on that,
  // category tabs included (first load = full skeleton). There is no
  // per-category resource, so once the universe is in, switching category
  // has nothing to wait for.
  const { isLoading } = useMutualFundUniverse();
  const funds = useMemo(() => getMobileGroupGridFunds(groupId, false, 16), [groupId]);

  const bothOrNeitherTag = viewActive === highlightActive;
  const showViewTag = bothOrNeitherTag || viewActive;
  const showHighlightTag = bothOrNeitherTag || highlightActive;
  const tagFunds = searchFunds(filterFundsByTag(funds, viewActive, highlightActive), query);
  const listCountLabel = t.fund.list.count(tagFunds.length);

  return (
    <>
      <div className="lg:hidden">
        <MutualFundTopPerformersMobile
          isLoading={isLoading}
          onBack={onBack}
          onFundSelect={onFundSelect}
        />
      </div>

      <div className="hidden w-full flex-1 flex-col bg-white pb-20 lg:flex">
        <div className="w-full bg-white">
          <div className="mx-auto flex w-full max-w-[996px] items-center gap-2 px-4 pt-8 pb-2 md:px-8 lg:px-0">
            <Button
              variant="plain"
              size="icon-sm"
              onClick={onBack}
              aria-label={t.common.back}
              className="size-[30px] shrink-0 rounded-md p-[5px]"
            >
              <ArrowLeftIcon size={20} />
            </Button>
            <h1 className="min-w-0 flex-1 truncate text-lg leading-[32px] font-bold text-neutral-900">
              {t.fund.topPerformers.title}
            </h1>
          </div>

          <div className="mx-auto w-full max-w-[996px] px-4 md:px-8 lg:px-0">
            {isLoading ? (
              <TabsSkeleton count={MOBILE_FUND_GROUPS.length} />
            ) : (
              <CategoryTabs activeId={groupId} onSelect={setGroupId} />
            )}
          </div>
        </div>

        <div className="relative w-full overflow-hidden bg-neutral-50">
          {isLoading ? (
            <MutualFundTabbedListHeroSkeleton />
          ) : (
            <div className="relative mx-auto flex h-[126px] w-full max-w-[996px] shrink-0 items-center gap-1.5 overflow-visible px-4 pt-2.5 pb-2.5 md:px-8 lg:px-0">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="text-xl leading-[34px] font-bold text-brand-800">{heroTitle}</p>
                <p className="text-sm leading-[24px] font-normal text-neutral-600">
                  {t.fund.topPerformers.heroSubtitle}
                </p>
                <p className="text-micro leading-[18px] font-normal text-neutral-500">
                  {t.fund.list.asOf(TOP_PERFORMERS_LIST_UPDATED_AT)}
                </p>
              </div>
              <MutualFundGroupHeroGraphic groupId={groupId} scale={1.15} />
            </div>
          )}
          <div className="relative z-20 h-3 w-full bg-gradient-to-r from-[#00a1e9] to-[#004eba]" />
        </div>

        <div className="relative z-10 w-full rounded-xl bg-gradient-to-r from-[#00a1e9] to-[#004eba]">
          <div className="w-full rounded-t-xl bg-white pt-4 pb-6">
            <div className="mx-auto flex w-full max-w-[996px] flex-col gap-6 px-4 md:px-8 lg:px-0">
              {isLoading ? (
                <>
                  <div className="flex w-full flex-col gap-3">
                    <MutualFundTabbedListControlsSkeleton search />
                  </div>
                  <MutualFundTabbedListGridSkeleton count={false} />
                </>
              ) : (
                <>
                  <div className="flex w-full flex-col gap-3">
                    <MutualFundTagLegend
                      viewActive={viewActive}
                      highlightActive={highlightActive}
                      onToggleView={() => setViewActive((v) => !v)}
                      onToggleHighlight={() => setHighlightActive((v) => !v)}
                      onShowLegend={() => setLegendOpen(true)}
                      trailing={
                        <div className="min-w-0 flex-1 lg:w-[320px] lg:flex-none">
                          <SearchInput
                            value={query}
                            onChange={setQuery}
                            onClear={() => setQuery("")}
                            placeholder={t.fund.list.searchPlaceholder}
                            size="sm"
                            className="w-full"
                          />
                        </div>
                      }
                    />
                    <p className="w-full px-3 text-sm leading-[24px] font-normal text-neutral-900">
                      {listCountLabel}
                    </p>
                    <PerformancePeriodTabs active={period} onChange={setPeriod} />
                  </div>

                  <div className="grid w-full grid-cols-2 gap-x-4 gap-y-6">
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
                    <p className="px-3 text-center text-sm font-normal text-neutral-500">
                      {query.trim()
                        ? t.fund.list.noMatchForQuery(query.trim())
                        : t.fund.list.noFundsInCategory}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <MutualFundLegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
    </>
  );
}
