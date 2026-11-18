"use client";

import { use } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { MutualFundThemeDetailPage } from "../../../../client/[id]/MutualFundThemeDetailPage";
import { findMutualFundThemeId } from "../../../../client/[id]/mutual-fund-data";
import { useSectionBack } from "@/hooks/use-section-back";
import { CatalogNotFound } from "../../../CatalogNotFound";
import { useT } from "@/i18n/I18nProvider";

export default function MutualFundThemeDetailRoute({
  params,
}: {
  params: Promise<{ themeId: string }>;
}) {
  const { themeId: rawThemeId } = use(params);
  const t = useT();
  // The theme list is a static catalog, so an unknown id is known up front —
  // never stand another theme in for it.
  const themeId = findMutualFundThemeId(decodeURIComponent(rawThemeId));
  const router = useLocalizedRouter();
  const goBack = useSectionBack();

  if (!themeId) {
    return <CatalogNotFound message={t.fund.notFound.theme} onBack={goBack} />;
  }

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
