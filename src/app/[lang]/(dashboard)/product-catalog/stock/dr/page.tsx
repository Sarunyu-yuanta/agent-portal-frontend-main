"use client";

import { StockCrossSellDetail } from "@/features/catalog/stock/components/StockCrossSellDetail";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";

export default function StockDrDetailPage() {
  const goBack = useSectionBack();
  return <StockCrossSellDetail kind="dr" onBack={goBack} />;
}
