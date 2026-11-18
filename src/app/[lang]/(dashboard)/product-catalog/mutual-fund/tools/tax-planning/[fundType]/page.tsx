"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MutualFundFilterResultsPage } from "../../../../../client/[id]/MutualFundFilterResultsPage";
import { getTaxSavingFunds, normalizeTaxSavingFundType } from "../../../../../client/[id]/mutual-fund-data";
import { useSectionBack } from "@/hooks/use-section-back";

export default function MutualFundTaxPlanningResultsRoute({
  params,
}: {
  params: Promise<{ fundType: string }>;
}) {
  const { fundType: rawFundType } = use(params);
  const fundType = normalizeTaxSavingFundType(decodeURIComponent(rawFundType));
  const router = useRouter();
  const goBack = useSectionBack();
  const funds = useMemo(() => getTaxSavingFunds(false, 16), []);

  return (
    <MutualFundFilterResultsPage
      title={`ผลการกรอง ${fundType}`}
      funds={funds}
      defaultPeriod="1Y"
      onBack={goBack}
      onFundSelect={(fundId) =>
        router.push(`/product-catalog/mutual-fund/${encodeURIComponent(fundId)}`)
      }
    />
  );
}
