"use client";

import { use } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { MutualFundTopPerformersPage } from "../../../../client/[id]/MutualFundTopPerformersPage";
import { findMobileFundGroupId } from "../../../../client/[id]/mutual-fund-data";
import { useSectionBack } from "@/hooks/use-section-back";
import { CatalogNotFound } from "../../../CatalogNotFound";
import { useT } from "@/i18n/I18nProvider";

export default function MutualFundTopPerformersRoute({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId: rawCategoryId } = use(params);
  const t = useT();
  // Accepts a group id or a category id; anything else is a dead link, not "all".
  const initialGroupId = findMobileFundGroupId(decodeURIComponent(rawCategoryId));
  const router = useLocalizedRouter();
  const goBack = useSectionBack();

  if (!initialGroupId) {
    return <CatalogNotFound message={t.fund.notFound.category} onBack={goBack} />;
  }

  return (
    <MutualFundTopPerformersPage
      initialGroupId={initialGroupId}
      onBack={goBack}
      onFundSelect={(fundId) =>
        router.push(`/product-catalog/mutual-fund/${encodeURIComponent(fundId)}`)
      }
    />
  );
}
