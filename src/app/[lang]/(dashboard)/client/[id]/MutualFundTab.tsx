"use client";

import { useState } from "react";
import { MutualFundInsightsSection } from "./MutualFundInsightsSection";
import { MutualFundQuickActions } from "./MutualFundQuickActions";
import { MutualFundThemesSection } from "./MutualFundThemesSection";
import { MutualFundTopPerformersSection } from "./MutualFundTopPerformersSection";
import { getMobileGroupFunds, type MobileFundGroupId, type MutualFundThemeId } from "./mutual-fund-data";
import { useMutualFundCatalog } from "@/hooks/use-catalog";

export function MutualFundTab({
  onFundSelect,
  onTopPerformersSeeAll,
  onInsightsSeeAll,
  onThemeSeeAll,
}: {
  onFundSelect?: (fundId: string) => void;
  onTopPerformersSeeAll?: (groupId: MobileFundGroupId) => void;
  onInsightsSeeAll?: () => void;
  onThemeSeeAll?: (themeId: MutualFundThemeId) => void;
}) {
  const { data } = useMutualFundCatalog();
  const [groupId, setGroupId] = useState<MobileFundGroupId>("all");
  const funds = getMobileGroupFunds(groupId);

  const topPerformers = (
    <MutualFundTopPerformersSection
      groupId={groupId}
      onGroupChange={setGroupId}
      funds={funds}
      onFundSelect={onFundSelect}
      onSeeAll={onTopPerformersSeeAll}
    />
  );

  const insights = (
    <MutualFundInsightsSection insights={data.insights} onSeeAll={onInsightsSeeAll} />
  );

  return (
    <div className="flex w-full flex-col bg-white">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-4 pt-8 md:px-8 lg:px-6 lg:pt-10">
        <MutualFundQuickActions />
        <MutualFundThemesSection themes={data.themes} onFundSelect={onFundSelect} onThemeSeeAll={onThemeSeeAll} />
      </div>

      <div className="mx-auto mt-3 w-full max-w-[1280px] px-4 pb-10 md:px-8 lg:mt-6 lg:px-6">
        {/* Figma 40135:224236 — mobile: performers → insights (quick actions moved to the top of the tab) */}
        <div className="flex flex-col gap-2 lg:hidden">
          {topPerformers}
          <div className="mt-3">{insights}</div>
        </div>

        {/* Figma 40118:77234 — desktop: two columns */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-16">
          {topPerformers}
          {insights}
        </div>
      </div>
    </div>
  );
}
