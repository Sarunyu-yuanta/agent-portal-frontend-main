"use client";

import { useRouter } from "next/navigation";
import { StructuredProductAllPage } from "../../client/[id]/StructuredProductAllPage";
import { useSectionBack } from "@/hooks/use-section-back";

export default function StructuredProductAllPageRoute() {
  const router = useRouter();
  const goBack = useSectionBack();

  return (
    <StructuredProductAllPage
      onBack={goBack}
      onProductSelect={(p) => router.push(`/product-catalog/product/${p.id}`)}
    />
  );
}
