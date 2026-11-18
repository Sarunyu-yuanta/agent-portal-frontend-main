"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { InvestmentSolutionDetail } from "../../../client/[id]/InvestmentSolutionDetail";
import { InvestmentSolutionDetailSkeleton } from "../../../client/[id]/ProductDetailSkeletons";
import { type InvestmentSolutionId } from "../../../client/[id]/investment-solution-data";
import type { StructuredProduct } from "../../../client/[id]/structured-product-data";
import { useInvestmentSolution } from "@/hooks/use-catalog";
import { useSectionBack } from "@/hooks/use-section-back";

/**
 * Loading lives with the lookup — see the note in `product/[id]/page.tsx`.
 * No not-found branch here: `getInvestmentSolution` falls back to a default
 * solution rather than returning nothing.
 */
export default function InvestmentSolutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: solution, isLoading } = useInvestmentSolution(id as InvestmentSolutionId);
  const goBack = useSectionBack();

  if (isLoading) {
    return <InvestmentSolutionDetailSkeleton />;
  }

  return (
    <InvestmentSolutionDetail
      solution={solution}
      onBack={goBack}
      onProductSelect={(p: StructuredProduct) =>
        router.push(`/product-catalog/product/${p.id}`)
      }
    />
  );
}
