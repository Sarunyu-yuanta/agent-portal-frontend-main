"use client";

import { GlobalBondAllPage } from "../../client/[id]/GlobalBondAllPage";
import { useSectionBack } from "@/hooks/use-section-back";

export default function GlobalBondAllPageRoute() {
  const goBack = useSectionBack();

  return <GlobalBondAllPage onBack={goBack} />;
}
