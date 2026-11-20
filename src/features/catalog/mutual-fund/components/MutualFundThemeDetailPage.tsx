"use client";

import { useMemo, useState } from "react";

import {
  CatalogDetailThemeHero,
  CatalogTabbedDetailView,
} from "@/features/catalog/components/CatalogTabbedDetailView";
import {
  CATALOG_DETAIL_WIDTH,
  CatalogDetailBackHeader,
  CatalogDetailDesktopShell,
  useCatalogDetailScrollTop,
} from "@/features/catalog/components/ProductCatalogTabbedDetailLayout";
import { MutualFundListCard } from "./MutualFundCard";
import {
  THEME_HERO_COLOR,
  THEME_ICON_COMPONENTS,
  ThemeHeroGraphic,
} from "./MutualFundThemesSection";
import { MutualFundThemeDetailMobile } from "./MutualFundThemeDetailMobile";
import { MutualFundLegendModal } from "./MutualFundLegendSheet";

import { MutualFundTagLegend } from "./mutual-fund-ui";
import {
  MutualFundTabbedListControlsSkeleton,
  MutualFundTabbedListGridSkeleton,
  MutualFundTabbedListHeroSkeleton,
} from "./MutualFundListPageSkeletons";
import { useMutualFundTheme, useMutualFundUniverse } from "@/features/catalog/hooks/use-catalog";
import { TabsSkeleton } from "@/components/ui/skeleton";
import {
  filterFundsByTag,
  fundHasHighlightTag,
  fundHasViewTag,
  MUTUAL_FUND_THEME_IDS,
  MOBILE_PERFORMANCE_PERIODS,
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

function MutualFundThemeHero({
  themeId,
  theme,
}: {
  themeId: MutualFundThemeId;
  theme: MutualFundTheme;
}) {
  // Falls back to no icon for a key the app doesn't know, rather than crashing.
  const t = useT();
  const Icon = THEME_ICON_COMPONENTS[theme.icon];

  return (
    <CatalogDetailThemeHero
      icon={
        Icon ? <Icon size={24} weight="fill" style={{ color: THEME_HERO_COLOR.title }} /> : null
      }
      title={getThemeHeroTitle(themeId)}
      description={getThemeDescription(themeId)}
      meta={t.fund.list.asOf(TOP_PERFORMERS_LIST_UPDATED_AT)}
      trailing={<ThemeHeroGraphic themeId={themeId} scale={1.15} />}
    />
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
    <div className="flex h-10 w-full items-center justify-center px-3">
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

/** Figma 39839:525396 — mutual fund theme detail page ("ดูเพิ่มเติม" destination). */
export function MutualFundThemeDetailPage({
  themeId: initialThemeId,
  onBack,
  onFundSelect,
}: {
  themeId: MutualFundThemeId;
  onBack: () => void;
  onFundSelect?: (fundId: string) => void;
}) {
  const t = useT();
  const [themeId, setThemeId] = useState<MutualFundThemeId>(initialThemeId);
  const [period, setPeriod] = useState<MobilePerformancePeriod>("1M");
  const [legendOpen, setLegendOpen] = useState(false);
  const [viewActive, setViewActive] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);

  useCatalogDetailScrollTop([themeId]);

  const { data: theme, isLoading: themeLoading } = useMutualFundTheme(themeId);
  const { isLoading: universeLoading } = useMutualFundUniverse();

  const themeTabItems = useMemo(
    () => MUTUAL_FUND_THEME_IDS.map((id) => ({ id, label: getMutualFundTheme(id).title })),
    [],
  );
  const funds = useMemo(() => getThemeGridFunds(themeId, false, 16), [themeId]);
  const bothOrNeitherTag = viewActive === highlightActive;
  const showViewTag = bothOrNeitherTag || viewActive;
  const showHighlightTag = bothOrNeitherTag || highlightActive;
  const tagFunds = filterFundsByTag(funds, viewActive, highlightActive);
  const listCountLabel = t.fund.list.count(tagFunds.length);
  // Two levels. First load (the fund universe the page hangs off): the whole
  // page is skeleton, theme tabs included. After that, switching theme only
  // waits on that theme — the real tabs stay live and only the hero, list
  // controls and grid below them are skeleton.
  const isPageLoading = universeLoading;
  const isLoading = themeLoading || universeLoading;

  return (
    <>
      <div className="lg:hidden">
        <MutualFundThemeDetailMobile
          themeId={themeId}
          theme={theme}
          isLoading={isLoading}
          isPageLoading={isPageLoading}
          onThemeChange={setThemeId}
          onBack={onBack}
          onFundSelect={onFundSelect}
        />
      </div>

      {isPageLoading ? (
        <CatalogDetailDesktopShell>
          <CatalogDetailBackHeader
            title={t.fund.themes.detailTitle}
            onBack={onBack}
            className="!pt-8"
          />
          <TabsSkeleton count={themeTabItems.length} className={CATALOG_DETAIL_WIDTH.narrow} />
          <MutualFundTabbedListHeroSkeleton />
          <div
            className="relative z-10 w-full rounded-xl"
            style={{
              backgroundImage: `linear-gradient(to right, ${THEME_HERO_COLOR.from}, ${THEME_HERO_COLOR.to})`,
            }}
          >
            <div className="w-full rounded-t-xl bg-white pt-4 pb-6">
              <div className={`flex flex-col gap-6 ${CATALOG_DETAIL_WIDTH.narrow}`}>
                <div className="flex w-full flex-col gap-3">
                  <MutualFundTabbedListControlsSkeleton />
                </div>
                <MutualFundTabbedListGridSkeleton />
              </div>
            </div>
          </div>
        </CatalogDetailDesktopShell>
      ) : (
        <CatalogTabbedDetailView
          title={t.fund.themes.detailTitle}
          onBack={onBack}
          tabItems={themeTabItems}
          activeTabId={themeId}
          onTabSelect={setThemeId}
          hero={
            isLoading ? (
              <MutualFundTabbedListHeroSkeleton />
            ) : (
              <MutualFundThemeHero themeId={themeId} theme={theme} />
            )
          }
          listControls={
            isLoading ? (
              <MutualFundTabbedListControlsSkeleton />
            ) : (
              <>
                <MutualFundTagLegend
                  viewActive={viewActive}
                  highlightActive={highlightActive}
                  onToggleView={() => setViewActive((v) => !v)}
                  onToggleHighlight={() => setHighlightActive((v) => !v)}
                  onShowLegend={() => setLegendOpen(true)}
                />
                <PerformancePeriodTabs active={period} onChange={setPeriod} />
              </>
            )
          }
          countLabel={isLoading ? undefined : listCountLabel}
        >
          {isLoading ? (
            <MutualFundTabbedListGridSkeleton />
          ) : (
            <>
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
                <p className="px-3 text-center text-sm font-normal text-[#6a7282]">
                  {t.fund.list.noFundsInTheme}
                </p>
              ) : null}
            </>
          )}
        </CatalogTabbedDetailView>
      )}

      <MutualFundLegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
    </>
  );
}
