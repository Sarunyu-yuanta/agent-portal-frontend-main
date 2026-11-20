"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, useIsMobile } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { MutualFundListCardMobile } from "./MutualFundCard";
import {
  THEME_HERO_COLOR,
  THEME_ICON_COMPONENTS,
  ThemeHeroGraphic,
} from "./MutualFundThemesSection";
import { MutualFundLegendBottomSheet, MutualFundLegendModal } from "./MutualFundLegendSheet";

import { MobilePeriodTabs, MutualFundTagLegend } from "./mutual-fund-ui";
import { MutualFundTabbedListMobileBodySkeleton } from "./MutualFundListPageSkeletons";
import { TabsSkeleton } from "@/components/ui/skeleton";
import {
  filterFundsByTag,
  fundHasHighlightTag,
  fundHasViewTag,
  MUTUAL_FUND_THEME_IDS,
  TOP_PERFORMERS_LIST_UPDATED_AT,
  getMutualFundTheme,
  getThemeDescription,
  getThemeGridFunds,
  getThemeHeroTitle,
  type MobilePerformancePeriod,
  type MutualFundTheme,
  type MutualFundThemeId,
} from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { useT } from "@/i18n/I18nProvider";

function MobileThemeTabs({
  activeId,
  onSelect,
}: {
  activeId: MutualFundThemeId;
  onSelect: (id: MutualFundThemeId) => void;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex w-max min-w-full">
        {MUTUAL_FUND_THEME_IDS.map((themeId) => {
          const theme = getMutualFundTheme(themeId);
          const active = themeId === activeId;
          return (
            <button
              key={themeId}
              type="button"
              onClick={() => onSelect(themeId)}
              className={`flex min-w-[80px] shrink-0 items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm leading-[24px] font-bold whitespace-nowrap ${
                active ? "border-[#0a6ee7] text-[#0a6ee7]" : "border-black/10 text-[#6a7282]"
              }`}
            >
              {theme.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileThemeHero({
  themeId,
  theme,
}: {
  themeId: MutualFundThemeId;
  theme: MutualFundTheme;
}) {
  const t = useT();
  // Falls back to no icon for a key the app doesn't know, rather than crashing.
  const Icon = THEME_ICON_COMPONENTS[theme.icon];

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="relative flex h-[126px] w-full shrink-0 items-center gap-2.5 overflow-visible px-6 pt-2.5 pb-2.5"
        style={{ backgroundColor: THEME_HERO_COLOR.glow }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1">
            {Icon && <Icon size={20} weight="fill" style={{ color: THEME_HERO_COLOR.title }} />}
            <p
              className="min-w-0 flex-1 truncate text-xl leading-[34px] font-bold"
              style={{ color: THEME_HERO_COLOR.title }}
            >
              {getThemeHeroTitle(themeId)}
            </p>
          </div>
          <p className="text-sm leading-[24px] font-normal text-[#4a5565]">
            {getThemeDescription(themeId)}
          </p>
          <p className="text-micro leading-[18px] font-normal text-[#6a7282]">
            {t.fund.list.asOf(TOP_PERFORMERS_LIST_UPDATED_AT)}
          </p>
        </div>
        <ThemeHeroGraphic themeId={themeId} />
      </div>
    </div>
  );
}

/** Figma 39839:525396 — mobile "ธีมกองทุนเด่น" theme detail page. */
export function MutualFundThemeDetailMobile({
  themeId,
  theme,
  isLoading = false,
  isPageLoading = false,
  onThemeChange,
  onBack,
  onFundSelect,
}: {
  themeId: MutualFundThemeId;
  /** The active theme, read by the page through `useMutualFundTheme`; `null` until it loads. */
  theme: MutualFundTheme | null;
  /** While the active theme loads, the back header and theme tabs stay live; everything below is skeleton. */
  isLoading?: boolean;
  /** First load of the page (fund universe): the theme tabs are skeleton too. */
  isPageLoading?: boolean;
  onThemeChange: (themeId: MutualFundThemeId) => void;
  onBack: () => void;
  onFundSelect?: (fundId: string) => void;
}) {
  const t = useT();
  const [period, setPeriod] = useState<MobilePerformancePeriod>("1M");
  const [legendOpen, setLegendOpen] = useState(false);
  const [viewActive, setViewActive] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);
  const isPhone = useIsMobile();

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [themeId]);

  const funds = useMemo(() => getThemeGridFunds(themeId, false, 16), [themeId]);
  const bothOrNeitherTag = viewActive === highlightActive;
  const showViewTag = bothOrNeitherTag || viewActive;
  const showHighlightTag = bothOrNeitherTag || highlightActive;
  const tagFunds = filterFundsByTag(funds, viewActive, highlightActive);
  const listCountLabel = t.fund.list.count(tagFunds.length);

  return (
    <div className="flex w-full flex-1 flex-col bg-white">
      <div className="flex w-full items-center gap-2 px-4 pt-4 pb-2">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={onBack}
          aria-label={t.common.back}
          className="size-[30px] shrink-0 rounded-md p-[5px]"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-lg leading-[32px] font-bold text-[#101828]">
          {t.fund.themes.detailTitle}
        </h1>
      </div>

      {isPageLoading ? (
        <TabsSkeleton count={MUTUAL_FUND_THEME_IDS.length} className="px-4" />
      ) : (
        <MobileThemeTabs activeId={themeId} onSelect={onThemeChange} />
      )}
      {isLoading || isPageLoading || !theme ? (
        <MutualFundTabbedListMobileBodySkeleton />
      ) : (
        <>
          <MobileThemeHero themeId={themeId} theme={theme} />

          <div className="flex w-full flex-col gap-3 pt-4 pb-6">
            <MutualFundTagLegend
              viewActive={viewActive}
              highlightActive={highlightActive}
              onToggleView={() => setViewActive((v) => !v)}
              onToggleHighlight={() => setHighlightActive((v) => !v)}
              onShowLegend={() => setLegendOpen(true)}
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
                {t.fund.list.noFundsInTheme}
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
