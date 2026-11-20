"use client";

import { use } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { GlobalBondDetail } from "@/features/catalog/global-bond/components/GlobalBondDetail";
import { GlobalBondDetailSkeleton } from "@/features/catalog/components/ProductDetailSkeletons";
import type { GlobalBondIssuerId } from "@/features/catalog/global-bond/lib/global-bond-data";
import { useGlobalBondIssuer } from "@/features/catalog/hooks/use-catalog";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";
import { CatalogNotFound } from "@/features/catalog/components/CatalogNotFound";
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
      onIssuerSelect={(id: GlobalBondIssuerId) => router.push(`/product-catalog/global-bond/${id}`)}
    />
  );
}
