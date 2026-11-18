"use client";

import { Suspense } from "react";
import { DefinitDetail } from "../../client/[id]/DefinitDetail";
import { useSectionBack } from "@/hooks/use-section-back";

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
