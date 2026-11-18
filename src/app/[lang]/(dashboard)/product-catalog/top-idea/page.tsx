"use client";

import { useRouter } from "next/navigation";
import { TopIdeaAllPage } from "../../client/[id]/TopIdeaAllPage";
import { useSectionBack } from "@/hooks/use-section-back";

export default function TopIdeaAllPageRoute() {
  const router = useRouter();
  const goBack = useSectionBack();

  return (
    <TopIdeaAllPage
      onBack={goBack}
      onSelect={(sector) =>
        router.push(`/product-catalog/top-idea/${encodeURIComponent(sector)}`)
      }
    />
  );
}
