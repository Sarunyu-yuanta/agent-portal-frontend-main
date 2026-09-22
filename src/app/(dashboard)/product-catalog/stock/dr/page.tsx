"use client";

import { StockCrossSellDetail } from "../../../client/[id]/StockCrossSellDetail";
import { useSectionBack } from "@/hooks/use-section-back";

export default function StockDrDetailPage() {
  const goBack = useSectionBack();
  return <StockCrossSellDetail kind="dr" onBack={goBack} />;
}
