"use client";

import { use } from "react";
import { MutualFundDetail } from "../../../client/[id]/MutualFundDetail";
import { MutualFundDetailSkeleton } from "../../../client/[id]/ProductDetailSkeletons";
import { useMutualFund } from "@/hooks/use-catalog";
import { useSectionBack } from "@/hooks/use-section-back";
import { CatalogNotFound } from "../../CatalogNotFound";

export default function MutualFundDetailPage({
  params,
}: {
  params: Promise<{ fundId: string }>;
}) {
  const { fundId } = use(params);
  const decodedId = decodeURIComponent(fundId);
  const { data: fund, isLoading } = useMutualFund(decodedId);
  const goBack = useSectionBack();

  if (isLoading) {
    return <MutualFundDetailSkeleton />;
  }

  if (!fund) {
    return <CatalogNotFound message="ไม่พบกองทุนนี้" onBack={goBack} />;
  }

  return <MutualFundDetail fund={fund} onBack={goBack} />;
}
