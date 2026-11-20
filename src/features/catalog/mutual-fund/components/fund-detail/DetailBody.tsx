import type { MutualFundDetail as MutualFundDetailData } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { AllocationContent } from "./AllocationContent";
import { FundInfoContent } from "./FundInfoContent";
import { OverviewContent } from "./OverviewContent";
import { PerformanceContent } from "./PerformanceContent";

// Ids, not the Thai titles they used to be — the titles are per language
// (`t.catalog.fundDetailTabs`), and an id is what the switch below compares.
export const DETAIL_TABS = ["overview", "returns", "allocation", "info"] as const;

export type DetailTab = (typeof DETAIL_TABS)[number];

export function DetailBody({
  fund,
  activeTab,
}: {
  fund: MutualFundDetailData;
  activeTab: DetailTab;
}) {
  if (activeTab === "overview") return <OverviewContent fund={fund} />;
  if (activeTab === "returns") return <PerformanceContent fund={fund} />;
  if (activeTab === "allocation") return <AllocationContent fund={fund} />;
  return <FundInfoContent fund={fund} />;
}
