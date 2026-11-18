"use client";

import { MutualFundInsightsPage } from "../../../client/[id]/MutualFundInsightsPage";
import { useSectionBack } from "@/hooks/use-section-back";

export default function MutualFundInsightsRoute() {
  const goBack = useSectionBack();

  return <MutualFundInsightsPage onBack={goBack} />;
}
