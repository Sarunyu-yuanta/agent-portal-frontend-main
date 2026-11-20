"use client";

import { useLocalizedRouter } from "@/i18n/navigation";
import { MutualFundTaxPlanningPage } from "@/features/catalog/mutual-fund/components/MutualFundTaxPlanningPage";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";

export default function MutualFundTaxPlanningRoute() {
  const router = useLocalizedRouter();
  const goBack = useSectionBack();

  return (
    <MutualFundTaxPlanningPage
      onBack={goBack}
      onFundSelect={(fundId) =>
        router.push(`/product-catalog/mutual-fund/${encodeURIComponent(fundId)}`)
      }
    />
  );
}
