"use client";

import { useRouter } from "next/navigation";
import { MutualFundTaxPlanningPage } from "../../../../client/[id]/MutualFundTaxPlanningPage";
import { useSectionBack } from "@/hooks/use-section-back";

export default function MutualFundTaxPlanningRoute() {
  const router = useRouter();
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
