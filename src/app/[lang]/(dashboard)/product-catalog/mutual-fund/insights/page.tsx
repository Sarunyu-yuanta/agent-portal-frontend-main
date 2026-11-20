"use client";

import { MutualFundInsightsPage } from "@/features/catalog/mutual-fund/components/MutualFundInsightsPage";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";

export default function MutualFundInsightsRoute() {
  const goBack = useSectionBack();

  return <MutualFundInsightsPage onBack={goBack} />;
}
