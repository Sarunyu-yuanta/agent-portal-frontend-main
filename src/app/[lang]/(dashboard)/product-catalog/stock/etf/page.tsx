"use client";

import { StockCrossSellDetail } from "../../../client/[id]/StockCrossSellDetail";
import { useSectionBack } from "@/hooks/use-section-back";

export default function StockEtfDetailPage() {
  const goBack = useSectionBack();
  return <StockCrossSellDetail kind="etf" onBack={goBack} />;
}
