"use client";

import { GlobalBondAllPage } from "@/features/catalog/global-bond/components/GlobalBondAllPage";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";

export default function GlobalBondAllPageRoute() {
  const goBack = useSectionBack();

  return <GlobalBondAllPage onBack={goBack} />;
}
