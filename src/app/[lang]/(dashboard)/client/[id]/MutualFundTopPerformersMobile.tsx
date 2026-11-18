"use client";

import { useMemo, useState } from "react";
import { Button, SearchInput, useIsMobile } from "@sarunyu/system-one";
import {
  ArrowLeftIcon,
} from "@phosphor-icons/react";
import {
  MutualFundListCardMobile,
} from "./MutualFundCard";
import { MutualFundGroupHeroGraphic } from "./MutualFundGroupHero";
import { MutualFundLegendBottomSheet, MutualFundLegendModal } from "./MutualFundLegendSheet";

import { MobilePeriodTabs, MutualFundTagLegend } from "./mutual-fund-ui";
import { MutualFundTabbedListMobileBodySkeleton } from "./MutualFundListPageSkeletons";
import { TabsSkeleton } from "@/components/ui/skeleton";
import {
  filterFundsByTag,
  searchFunds,
  fundHasHighlightTag,
  fundHasViewTag,
  MOBILE_FUND_GROUPS,
  TOP_PERFORMERS_LIST_UPDATED_AT,
  getMobileGroupGridFunds,
  type MobileFundGroupId,
  type MobilePerformancePeriod,
} from "./mutual-fund-data";
import { useT } from "@/i18n/I18nProvider";

function MobileCategoryTabs({
  activeId,
  onSelect,
}: {
  activeId: MobileFundGroupId;
  onSelect: (id: MobileFundGroupId) => void;
}) {
  const t = useT();
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex w-max min-w-full">
        {MOBILE_FUND_GROUPS.map((group) => {
          const active = group.id === activeId;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelect(group.id)}
              className={`flex min-w-[80px] shrink-0 items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm font-bold leading-[24px] whitespace-nowrap ${
                active ? "border-[#0a6ee7] text-[#0a6ee7]" : "border-black/10 text-[#6a7282]"
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

function MobileHero({ groupId }: { groupId: MobileFundGroupId }) {
  const t = useT();
  const group = MOBILE_FUND_GROUPS.find((g) => g.id === groupId) ?? MOBILE_FUND_GROUPS[0];
  const title = group.id === "all" ? t.fund.list.allFunds : t.fund.groups[group.id];

  return (
    <div className="relative flex h-[126px] w-full shrink-0 items-center gap-2.5 overflow-visible bg-[#f9fafb] px-6 pb-2.5 pt-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-xl font-bold leading-[34px] text-[#074ea4]">{title}</p>
        <p className="text-sm font-normal leading-[24px] text-[#4a5565]">{t.fund.topPerformers.heroSubtitle}</p>
        <p className="text-micro font-normal leading-[18px] text-[#6a7282]">
          {t.fund.list.asOf(TOP_PERFORMERS_LIST_UPDATED_AT)}
        </p>
      </div>
      <MutualFundGroupHeroGraphic groupId={groupId} />
    </div>
  );
}

/** Figma 39839:522570 — mobile "Mutual fund top performers" page. */
export function MutualFundTopPerformersMobile({
  isLoading = false,
  onBack,
  onFundSelect,
}: {
  /** While the page's fund universe loads (first load), the category tabs and everything below are skeleton; the back header stays live. */
  isLoading?: boolean;
  onBack: () => void;
  onFundSelect?: (fundId: string) => void;
}) {
  const t = useT();
  const [groupId, setGroupId] = useState<MobileFundGroupId>("all");
  const [period, setPeriod] = useState<MobilePerformancePeriod>("1M");
  const [legendOpen, setLegendOpen] = useState(false);
  const [viewActive, setViewActive] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);
  const [query, setQuery] = useState("");
  const isPhone = useIsMobile();

  const funds = useMemo(() => getMobileGroupGridFunds(groupId, false, 16), [groupId]);
  const bothOrNeitherTag = viewActive === highlightActive;
  const showViewTag = bothOrNeitherTag || viewActive;
  const showHighlightTag = bothOrNeitherTag || highlightActive;
  const tagFunds = searchFunds(filterFundsByTag(funds, viewActive, highlightActive), query);
  const listCountLabel = t.fund.list.count(tagFunds.length);

  return (
    <div className="flex w-full flex-1 flex-col bg-white">
      <div className="flex w-full items-center gap-2 px-4 pb-2 pt-4">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={onBack}
          aria-label={t.common.back}
          className="size-[30px] shrink-0 rounded-md p-[5px]"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold leading-[32px] text-[#101828]">
          {t.fund.topPerformers.title}
        </h1>
      </div>

      {isLoading ? (
        <TabsSkeleton count={MOBILE_FUND_GROUPS.length} className="px-4" />
      ) : (
        <MobileCategoryTabs activeId={groupId} onSelect={setGroupId} />
      )}
      {isLoading ? (
        <MutualFundTabbedListMobileBodySkeleton search />
      ) : (
        <>
          <div className="relative w-full overflow-hidden">
            <MobileHero groupId={groupId} />
            <div className="relative z-20 h-3 w-full bg-gradient-to-r from-[#00a1e9] to-[#004eba]" />
          </div>

          <div className="flex w-full flex-col gap-3 pt-4 pb-6">
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
            <MobilePeriodTabs active={period} onChange={setPeriod} />

            <p className="px-3 text-sm leading-[24px] text-[#101828]">{listCountLabel}</p>

            <div className="flex w-full flex-col">
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

            {tagFunds.length === 0 ? (
              <p className="px-3 text-center text-sm text-[#6a7282]">
                {query.trim() ? t.fund.list.noMatchForQuery(query.trim()) : t.fund.list.noFundsInCategory}
              </p>
            ) : null}
          </div>
        </>
      )}

      {isPhone ? (
        <MutualFundLegendBottomSheet open={legendOpen} onOpenChange={setLegendOpen} />
      ) : (
        <MutualFundLegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
      )}
    </div>
  );
}
