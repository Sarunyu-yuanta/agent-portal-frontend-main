"use client";

import { Suspense } from "react";
import { DefinitDetail } from "@/features/catalog/robo-advisory/components/DefinitDetail";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";

export default function DefinitDetailPage() {
  return (
    <Suspense fallback={null}>
      <DefinitDetailPageInner />
    </Suspense>
  );
}

function DefinitDetailPageInner() {
  const goBack = useSectionBack();
  return <DefinitDetail onBack={goBack} />;
}
