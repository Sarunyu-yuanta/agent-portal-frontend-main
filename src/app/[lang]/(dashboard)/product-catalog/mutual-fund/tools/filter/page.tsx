"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MutualFundFilterResultsPage } from "../../../../client/[id]/MutualFundFilterResultsPage";
import { getAllMutualFunds } from "../../../../client/[id]/mutual-fund-data";
import {
  EMPTY_FILTER_STATE,
  type MutualFundFilterState,
} from "../../../../client/[id]/MutualFundFilterPanel";
import { MUTUAL_FUND_FILTER_STATE_KEY } from "../../../../client/[id]/MutualFundQuickActions";
import { navRead } from "@/lib/nav-session";
import { useSectionBack } from "@/hooks/use-section-back";

function readStoredFilterState(): MutualFundFilterState {
  const raw = navRead(MUTUAL_FUND_FILTER_STATE_KEY);
  if (!raw) return EMPTY_FILTER_STATE;
  try {
    return { ...EMPTY_FILTER_STATE, ...JSON.parse(raw) };
  } catch {
    return EMPTY_FILTER_STATE;
  }
}

export default function MutualFundFilterRoute() {
  const router = useRouter();
  const goBack = useSectionBack();
  const funds = useMemo(() => getAllMutualFunds(false), []);
  const [initialFilterState] = useState<MutualFundFilterState>(() => readStoredFilterState());

  return (
    <MutualFundFilterResultsPage
      title="ผลการกรอง"
      funds={funds}
      initialFilterState={initialFilterState}
      onBack={goBack}
      onFundSelect={(fundId) =>
        router.push(`/product-catalog/mutual-fund/${encodeURIComponent(fundId)}`)
      }
    />
  );
}
