"use client";

import { use } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { FixedIncomeDetail } from "@/features/catalog/fixed-income/components/FixedIncomeDetail";
import { FixedIncomeDetailSkeleton } from "@/features/catalog/components/ProductDetailSkeletons";
import { useFixedIncomeBond } from "@/features/catalog/hooks/use-catalog";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";
import { CatalogNotFound } from "@/features/catalog/components/CatalogNotFound";
import { useT } from "@/i18n/I18nProvider";

/** Loading lives with the lookup — see the note in `product/[id]/page.tsx`. */
export default function FixedIncomeBondDetailPage({
  params,
}: {
  params: Promise<{ bondId: string }>;
}) {
  const t = useT();
  const { bondId } = use(params);
  const router = useLocalizedRouter();
  const { data: bond, isLoading } = useFixedIncomeBond(decodeURIComponent(bondId));
  // Called unconditionally — the early returns below must not skip a hook.
  const goBack = useSectionBack();

  if (isLoading) {
    return <FixedIncomeDetailSkeleton />;
  }

  if (!bond) {
    return <CatalogNotFound message={t.products.notFound.bond} onBack={goBack} />;
  }

  return (
    <FixedIncomeDetail
      bond={bond}
      onBack={goBack}
      onCompanySelect={(companyId: string) =>
        router.push(`/product-catalog/fixed-income/company/${companyId}`)
      }
    />
  );
}
