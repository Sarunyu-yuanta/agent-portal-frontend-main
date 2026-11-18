"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { FixedIncomeDetail } from "../../../../client/[id]/FixedIncomeDetail";
import { FixedIncomeDetailSkeleton } from "../../../../client/[id]/ProductDetailSkeletons";
import { useFixedIncomeBond } from "@/hooks/use-catalog";
import { useSectionBack } from "@/hooks/use-section-back";
import { CatalogNotFound } from "../../../CatalogNotFound";

/** Loading lives with the lookup — see the note in `product/[id]/page.tsx`. */
export default function FixedIncomeBondDetailPage({
  params,
}: {
  params: Promise<{ bondId: string }>;
}) {
  const { bondId } = use(params);
  const router = useRouter();
  const { data: bond, isLoading } = useFixedIncomeBond(decodeURIComponent(bondId));
  // Called unconditionally — the early returns below must not skip a hook.
  const goBack = useSectionBack();

  if (isLoading) {
    return <FixedIncomeDetailSkeleton />;
  }

  if (!bond) {
    return <CatalogNotFound message="ไม่พบตราสารหนี้นี้" onBack={goBack} />;
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
