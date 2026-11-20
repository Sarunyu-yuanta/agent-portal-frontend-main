"use client";

import { use } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { TopIdeaDetail } from "../../../client/[id]/TopIdeaDetail";
import { TOP_IDEA_THEMES, type TopIdeaSector } from "../../../client/[id]/top-idea-data";
import type { StructuredProduct } from "../../../client/[id]/structured-product-data";
import { useSectionBack } from "@/hooks/use-section-back";
import { CatalogNotFound } from "../../CatalogNotFound";
import { useT } from "@/i18n/I18nProvider";

/** A sector the catalog has a theme for — anything else is a stale or mistyped link. */
function isTopIdeaSector(value: string): value is TopIdeaSector {
  return Object.hasOwn(TOP_IDEA_THEMES, value);
}

/**
 * The sector lookup lives here, as the other catalog detail routes resolve
 * their record. It is a static table, so there is no loading to wait out
 * first; the product list's own loading is `TopIdeaDetail`'s.
 */
export default function TopIdeaDetailPage({ params }: { params: Promise<{ sector: string }> }) {
  const t = useT();
  const { sector: rawSector } = use(params);
  const router = useLocalizedRouter();
  const goBack = useSectionBack();
  const sector = decodeURIComponent(rawSector);

  if (!isTopIdeaSector(sector)) {
    return <CatalogNotFound message={t.products.notFound.topIdea} onBack={goBack} />;
  }

  return (
    <TopIdeaDetail
      sector={sector}
      onBack={goBack}
      onProductSelect={(p: StructuredProduct) => router.push(`/product-catalog/product/${p.id}`)}
    />
  );
}
