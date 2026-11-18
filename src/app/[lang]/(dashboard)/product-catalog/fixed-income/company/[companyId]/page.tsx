"use client";

import { use } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { FixedIncomeCompanyDetail } from "../../../../client/[id]/FixedIncomeCompanyDetail";
import { FixedIncomeCompanyDetailSkeleton } from "../../../../client/[id]/ProductDetailSkeletons";
import type { FixedIncomeBond } from "../../../../client/[id]/fixed-income-data";
import { useFixedIncomeCompanyDetail } from "@/hooks/use-catalog";
import { useSectionBack } from "@/hooks/use-section-back";
import { CatalogNotFound } from "../../../CatalogNotFound";
import { useT } from "@/i18n/I18nProvider";

/**
 * Loading lives with the lookup — see the note in `product/[id]/page.tsx`.
 * Loading is checked before not-found, so a slow fetch never flashes it.
 */
export default function FixedIncomeCompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const t = useT();
  const { companyId } = use(params);
  const router = useLocalizedRouter();
  const { data: detail, isLoading } = useFixedIncomeCompanyDetail(decodeURIComponent(companyId));
  // Called unconditionally — the early returns below must not skip a hook.
  const goBack = useSectionBack();

  if (isLoading) {
    return <FixedIncomeCompanyDetailSkeleton hasSecondary={detail.secondaryBonds.length > 0} />;
  }

  if (!detail.company) {
    return <CatalogNotFound message={t.products.notFound.company} onBack={goBack} />;
  }

  return (
    <FixedIncomeCompanyDetail
      company={detail.company}
      primaryBonds={detail.primaryBonds}
      secondaryBonds={detail.secondaryBonds}
      onBack={goBack}
      onBondSelect={(bond: FixedIncomeBond) =>
        router.push(`/product-catalog/fixed-income/bond/${bond.id}`)
      }
    />
  );
}
