"use client";

import { useLocalizedRouter } from "@/i18n/navigation";
import { TopIdeaAllPage } from "../../client/[id]/TopIdeaAllPage";
import { useSectionBack } from "@/hooks/use-section-back";

export default function TopIdeaAllPageRoute() {
  const router = useLocalizedRouter();
  const goBack = useSectionBack();

  return (
    <TopIdeaAllPage
      onBack={goBack}
      onSelect={(sector) => router.push(`/product-catalog/top-idea/${encodeURIComponent(sector)}`)}
    />
  );
}
