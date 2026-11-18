"use client";

import { use } from "react";
import { ThaiStructuredProductDetail } from "../../../client/[id]/ThaiStructuredProductDetail";
import { ThaiStructuredProductDetailSkeleton } from "../../../client/[id]/ProductDetailSkeletons";
import { useThaiStructuredProduct } from "@/hooks/use-catalog";
import { useSectionBack } from "@/hooks/use-section-back";
import { CatalogNotFound } from "../../CatalogNotFound";
import { useT } from "@/i18n/I18nProvider";

/** Loading lives with the lookup — see the note in `product/[id]/page.tsx`. */
export default function ThaiStructuredProductDetailPage({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const t = useT();
  const { theme } = use(params);
  const { data: product, isLoading } = useThaiStructuredProduct(decodeURIComponent(theme));
  // Called unconditionally — the early returns below must not skip a hook.
  const goBack = useSectionBack();

  if (isLoading) {
    return <ThaiStructuredProductDetailSkeleton />;
  }

  if (!product) {
    return <CatalogNotFound message={t.states.notFoundProduct} onBack={goBack} />;
  }

  return <ThaiStructuredProductDetail product={product} onBack={goBack} />;
}
