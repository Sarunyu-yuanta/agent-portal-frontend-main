"use client";

import { use } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { InvestmentSolutionDetail } from "../../../client/[id]/InvestmentSolutionDetail";
import { InvestmentSolutionDetailSkeleton } from "../../../client/[id]/ProductDetailSkeletons";
import { CatalogNotFound } from "../../CatalogNotFound";
import type { StructuredProduct } from "../../../client/[id]/structured-product-data";
import { useInvestmentSolution } from "@/hooks/use-catalog";
import { useSectionBack } from "@/hooks/use-section-back";
import { useT } from "@/i18n/I18nProvider";

/**
 * Loading lives with the lookup — see the note in `product/[id]/page.tsx`.
 * Loading is checked before not-found, so a slow fetch never flashes it.
 */
export default function InvestmentSolutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useT();
  const { id } = use(params);
  const router = useLocalizedRouter();
  const { data: solution, isLoading } = useInvestmentSolution(id);
  const goBack = useSectionBack();

  if (isLoading) {
    return <InvestmentSolutionDetailSkeleton />;
  }
  if (!solution) {
    return <CatalogNotFound message={t.products.notFound.investmentSolution} onBack={goBack} />;
  }

  return (
    <InvestmentSolutionDetail
      solution={solution}
      onBack={goBack}
      onProductSelect={(p: StructuredProduct) => router.push(`/product-catalog/product/${p.id}`)}
    />
  );
}
