"use client";

import { useLocalizedRouter } from "@/i18n/navigation";
import { StructuredProductAllPage } from "../../client/[id]/StructuredProductAllPage";
import { useSectionBack } from "@/hooks/use-section-back";

export default function StructuredProductAllPageRoute() {
  const router = useLocalizedRouter();
  const goBack = useSectionBack();

  return (
    <StructuredProductAllPage
      onBack={goBack}
      onProductSelect={(p) => router.push(`/product-catalog/product/${p.id}`)}
    />
  );
}
