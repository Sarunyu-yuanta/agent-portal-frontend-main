"use client";

import { Suspense } from "react";
import { RoboAdvisoryDetail } from "@/features/catalog/robo-advisory/components/RoboAdvisoryDetail";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";

export default function RoboAdvisoryDetailPage() {
  return (
    <Suspense fallback={null}>
      <RoboAdvisoryDetailPageInner />
    </Suspense>
  );
}

function RoboAdvisoryDetailPageInner() {
  const goBack = useSectionBack();
  return <RoboAdvisoryDetail onBack={goBack} />;
}
