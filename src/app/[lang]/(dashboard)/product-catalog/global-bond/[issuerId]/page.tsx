"use client";

import { use } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { GlobalBondDetail } from "../../../client/[id]/GlobalBondDetail";
import { GlobalBondDetailSkeleton } from "../../../client/[id]/ProductDetailSkeletons";
import type { GlobalBondIssuerId } from "../../../client/[id]/global-bond-data";
import { useGlobalBondIssuer } from "@/hooks/use-catalog";
import { useSectionBack } from "@/hooks/use-section-back";
import { CatalogNotFound } from "../../CatalogNotFound";
import { useT } from "@/i18n/I18nProvider";

/**
 * Loading lives with the lookup — see the note in `product/[id]/page.tsx`.
 * Loading is checked before not-found, so a slow fetch never flashes it.
 */
export default function GlobalBondDetailPage({
  params,
}: {
  params: Promise<{ issuerId: string }>;
}) {
  const t = useT();
  const { issuerId } = use(params);
  const router = useLocalizedRouter();
  const { data: issuer, isLoading } = useGlobalBondIssuer(decodeURIComponent(issuerId));
  // Called unconditionally — the early returns below must not skip a hook.
  const goBack = useSectionBack();

  if (isLoading) {
    return <GlobalBondDetailSkeleton />;
  }

  if (!issuer) {
    return <CatalogNotFound message={t.products.notFound.issuer} onBack={goBack} />;
  }

  return (
    <GlobalBondDetail
      issuer={issuer}
      onBack={goBack}
      onIssuerSelect={(id: GlobalBondIssuerId) =>
        router.push(`/product-catalog/global-bond/${id}`)
      }
    />
  );
}
