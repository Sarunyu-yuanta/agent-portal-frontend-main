"use client";

import { use } from "react";
import { StructuredProductDetail } from "../../../client/[id]/StructuredProductDetail";
import { StructuredProductDetailSkeleton } from "../../../client/[id]/ProductDetailSkeletons";
import { useStructuredProduct } from "@/hooks/use-catalog";
import { useSectionBack } from "@/hooks/use-section-back";
import { CatalogNotFound } from "../../CatalogNotFound";
import { useT } from "@/i18n/I18nProvider";

/**
 * Resolving the product is this route's job, so the loading state belongs here
 * too rather than inside `StructuredProductDetail` — a component that is handed
 * a product has, by then, nothing left to wait for. Same split as
 * `client-hub/page.tsx`.
 *
 * Order matters: the skeleton goes above the not-found branch, so a product
 * still in flight reads as loading rather than as "ไม่พบสินค้านี้".
 */
export default function StructuredProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useT();
  const { id } = use(params);
  const { data: product, isLoading } = useStructuredProduct(decodeURIComponent(id));
  // Called unconditionally — the early returns below must not skip a hook.
  const goBack = useSectionBack();

  if (isLoading) {
    return <StructuredProductDetailSkeleton />;
  }

  if (!product) {
    return <CatalogNotFound message={t.states.notFoundProduct} onBack={goBack} />;
  }

  return <StructuredProductDetail product={product} onBack={goBack} />;
}
