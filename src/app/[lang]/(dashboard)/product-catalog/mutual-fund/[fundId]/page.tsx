"use client";

import { use } from "react";
import { MutualFundDetail } from "@/features/catalog/mutual-fund/components/MutualFundDetail";
import { MutualFundDetailSkeleton } from "@/features/catalog/components/ProductDetailSkeletons";
import { useMutualFund } from "@/features/catalog/hooks/use-catalog";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";
import { CatalogNotFound } from "@/features/catalog/components/CatalogNotFound";
import { useT } from "@/i18n/I18nProvider";

export default function MutualFundDetailPage({ params }: { params: Promise<{ fundId: string }> }) {
  const t = useT();
  const { fundId } = use(params);
  const decodedId = decodeURIComponent(fundId);
  const { data: fund, isLoading } = useMutualFund(decodedId);
  const goBack = useSectionBack();

  if (isLoading) {
    return <MutualFundDetailSkeleton />;
  }

  if (!fund) {
    return <CatalogNotFound message={t.products.notFound.fund} onBack={goBack} />;
  }

  return <MutualFundDetail fund={fund} onBack={goBack} />;
}
