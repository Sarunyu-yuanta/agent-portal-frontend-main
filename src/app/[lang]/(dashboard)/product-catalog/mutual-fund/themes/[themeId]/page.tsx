"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { MutualFundThemeDetailPage } from "../../../../client/[id]/MutualFundThemeDetailPage";
import { normalizeMutualFundThemeId } from "../../../../client/[id]/mutual-fund-data";
import { useSectionBack } from "@/hooks/use-section-back";

export default function MutualFundThemeDetailRoute({
  params,
}: {
  params: Promise<{ themeId: string }>;
}) {
  const { themeId: rawThemeId } = use(params);
  const themeId = normalizeMutualFundThemeId(decodeURIComponent(rawThemeId));
  const router = useRouter();
  const goBack = useSectionBack();

  return (
    <MutualFundThemeDetailPage
      themeId={themeId}
      onBack={goBack}
      onFundSelect={(fundId) =>
        router.push(`/product-catalog/mutual-fund/${encodeURIComponent(fundId)}`)
      }
    />
  );
}
