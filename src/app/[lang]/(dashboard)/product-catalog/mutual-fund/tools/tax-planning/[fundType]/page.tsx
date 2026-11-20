"use client";

import { use, useMemo } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { MutualFundFilterResultsPage } from "@/features/catalog/mutual-fund/components/MutualFundFilterResultsPage";
import {
  findTaxSavingFundType,
  getTaxSavingFunds,
} from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";
import { CatalogNotFound } from "@/features/catalog/components/CatalogNotFound";
import { useT } from "@/i18n/I18nProvider";

export default function MutualFundTaxPlanningResultsRoute({
  params,
}: {
  params: Promise<{ fundType: string }>;
}) {
  const t = useT();
  const { fundType: rawFundType } = use(params);
  const fundType = findTaxSavingFundType(decodeURIComponent(rawFundType));
  const router = useLocalizedRouter();
  const goBack = useSectionBack();
  const funds = useMemo(() => getTaxSavingFunds(false, 16), []);

  // An unknown type is a dead link — never show RMF's list under it.
  if (!fundType) {
    return <CatalogNotFound message={t.fund.notFound.taxType} onBack={goBack} />;
  }

  return (
    <MutualFundFilterResultsPage
      title={t.products.filterResults.titleFor(fundType)}
      funds={funds}
      defaultPeriod="1Y"
      onBack={goBack}
      onFundSelect={(fundId) =>
        router.push(`/product-catalog/mutual-fund/${encodeURIComponent(fundId)}`)
      }
    />
  );
}
