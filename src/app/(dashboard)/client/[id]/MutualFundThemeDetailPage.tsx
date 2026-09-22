"use client";

import { useMemo, useState } from "react";
import { Button } from "@sarunyu/system-one";
import { InfoIcon } from "@phosphor-icons/react";
import { CatalogDetailThemeHero, CatalogTabbedDetailView } from "./CatalogTabbedDetailView";
import { useCatalogDetailScrollTop } from "./ProductCatalogTabbedDetailLayout";
import { MutualFundListCard, TagFilterChip } from "./MutualFundCard";
import { THEME_HERO_COLOR, THEME_ICON_COMPONENTS, ThemeHeroGraphic } from "./MutualFundThemesSection";
import { MutualFundThemeDetailMobile } from "./MutualFundThemeDetailMobile";
import { MutualFundLegendModal } from "./MutualFundLegendSheet";
import { MF_ASSETS } from "./mutual-fund-assets";
import {
  MUTUAL_FUND_THEME_IDS,
  MOBILE_PERFORMANCE_PERIODS,
  TOP_PERFORMERS_LIST_UPDATED_AT,
  getMutualFundTheme,
  getThemeDescription,
  getThemeGridFunds,
  getThemeHeroTitle,
  type MobilePerformancePeriod,
  type MutualFundThemeId,
} from "./mutual-fund-data";

function MutualFundThemeHero({ themeId }: { themeId: MutualFundThemeId }) {
  const theme = getMutualFundTheme(themeId);
  const Icon = THEME_ICON_COMPONENTS[theme.icon];

  return (
    <CatalogDetailThemeHero
      icon={<Icon size={24} weight="fill" style={{ color: THEME_HERO_COLOR.title }} />}
      title={getThemeHeroTitle(themeId)}
      description={getThemeDescription(themeId)}
      meta={`ข้อมูล ณ วันที่ ${TOP_PERFORMERS_LIST_UPDATED_AT}`}
      trailing={<ThemeHeroGraphic themeId={themeId} scale={1.15} />}
    />
  );
}

function MutualFundTagLegend({
  viewActive,
  highlightActive,
  onToggleView,
  onToggleHighlight,
  onShowLegend,
}: {
  viewActive: boolean;
  highlightActive: boolean;
  onToggleView: () => void;
  onToggleHighlight: () => void;
  onShowLegend: () => void;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-2 px-3">
      <div className="flex items-center gap-2">
        <TagFilterChip
          icon={MF_ASSETS.performersTagView}
          label="View"
          active={viewActive}
          onClick={onToggleView}
        />
        <TagFilterChip
          icon={MF_ASSETS.performersTagHighlight}
          label="Highlight"
          active={highlightActive}
          onClick={onToggleHighlight}
        />
      </div>
      <Button
        variant="plain"
        size="xs"
        onClick={onShowLegend}
        leftIcon={<InfoIcon size={16} />}
        className="shrink-0 !px-0"
      >
        ดูคำอธิบาย
      </Button>
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
    <div className="flex h-10 w-full items-center justify-center px-3">
      <div className="flex w-full rounded-full bg-[#f3f3f3] p-1">
        {MOBILE_PERFORMANCE_PERIODS.map((period) => {
          const selected = period === active;
          return (
            <button
              key={period}
              type="button"
              onClick={() => onChange(period)}
              className={`flex min-h-8 flex-1 items-center justify-center rounded-full px-2 py-1.5 text-xs font-semibold leading-4 ${
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
  const [themeId, setThemeId] = useState<MutualFundThemeId>(initialThemeId);
  const [period, setPeriod] = useState<MobilePerformancePeriod>("1M");
  const [legendOpen, setLegendOpen] = useState(false);
  const [viewActive, setViewActive] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);

  useCatalogDetailScrollTop([themeId]);

  const themeTabItems = useMemo(
    () => MUTUAL_FUND_THEME_IDS.map((id) => ({ id, label: getMutualFundTheme(id).title })),
    [],
  );
  const funds = useMemo(() => getThemeGridFunds(themeId, false, 16), [themeId]);
  const listCountLabel = `${funds.length} รายการ`;
  const bothOrNeitherTag = viewActive === highlightActive;
  const showViewTag = bothOrNeitherTag || viewActive;
  const showHighlightTag = bothOrNeitherTag || highlightActive;

  return (
    <>
      <div className="lg:hidden">
        <MutualFundThemeDetailMobile
          themeId={themeId}
          onThemeChange={setThemeId}
          onBack={onBack}
          onFundSelect={onFundSelect}
        />
      </div>

      <CatalogTabbedDetailView
        title="ธีมกองทุนเด่น"
        onBack={onBack}
        tabItems={themeTabItems}
        activeTabId={themeId}
        onTabSelect={setThemeId}
        hero={<MutualFundThemeHero themeId={themeId} />}
        listControls={
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
        }
        countLabel={listCountLabel}
      >
        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-6">
          {funds.map((fund, index) => (
            <div key={`${fund.id}-${index}`} className="min-w-0">
              <MutualFundListCard
                fund={fund}
                onSelect={onFundSelect}
                showView={showViewTag}
                showHighlight={showHighlightTag}
              />
            </div>
          ))}
        </div>
        {funds.length === 0 ? (
          <p className="px-3 text-center text-sm font-normal text-[#6a7282]">ไม่พบกองทุนในธีมนี้</p>
        ) : null}
      </CatalogTabbedDetailView>

      <MutualFundLegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
    </>
  );
}
