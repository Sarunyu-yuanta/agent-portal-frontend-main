"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { FixedIncomeCompanyDetail } from "../../../../client/[id]/FixedIncomeCompanyDetail";
import type { FixedIncomeBond } from "../../../../client/[id]/fixed-income-data";
import { useSectionBack } from "@/hooks/use-section-back";

export default function FixedIncomeCompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = use(params);
  const router = useRouter();
  const goBack = useSectionBack();

  return (
    <FixedIncomeCompanyDetail
      companyId={companyId}
      onBack={goBack}
      onBondSelect={(bond: FixedIncomeBond) =>
        router.push(`/product-catalog/fixed-income/bond/${bond.id}`)
      }
    />
  );
}
