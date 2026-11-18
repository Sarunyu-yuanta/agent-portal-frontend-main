"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { GlobalBondDetail } from "../../../client/[id]/GlobalBondDetail";
import type { GlobalBondIssuerId } from "../../../client/[id]/global-bond-data";
import { useSectionBack } from "@/hooks/use-section-back";

export default function GlobalBondDetailPage({
  params,
}: {
  params: Promise<{ issuerId: string }>;
}) {
  const { issuerId } = use(params);
  const router = useRouter();
  const goBack = useSectionBack();

  return (
    <GlobalBondDetail
      issuerId={issuerId as GlobalBondIssuerId}
      onBack={goBack}
      onIssuerSelect={(id: GlobalBondIssuerId) =>
        router.push(`/product-catalog/global-bond/${id}`)
      }
    />
  );
}
