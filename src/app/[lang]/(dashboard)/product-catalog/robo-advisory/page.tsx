"use client";

import { Suspense } from "react";
import { RoboAdvisoryDetail } from "../../client/[id]/RoboAdvisoryDetail";
import { useSectionBack } from "@/hooks/use-section-back";

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
