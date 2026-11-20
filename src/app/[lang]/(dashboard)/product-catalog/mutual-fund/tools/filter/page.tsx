"use client";

import { useMemo, useState } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { MutualFundFilterResultsPage } from "@/features/catalog/mutual-fund/components/MutualFundFilterResultsPage";
import { getAllMutualFunds } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import {
  EMPTY_FILTER_STATE,
  type MutualFundFilterState,
} from "@/features/catalog/mutual-fund/components/MutualFundFilterPanel";
import { MUTUAL_FUND_FILTER_STATE_KEY } from "@/features/catalog/mutual-fund/components/MutualFundQuickActions";
import { navRead } from "@/lib/nav-session";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";
import { useT } from "@/i18n/I18nProvider";

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
  const t = useT();
  const router = useLocalizedRouter();
  const goBack = useSectionBack();
  const funds = useMemo(() => getAllMutualFunds(false), []);
  const [initialFilterState] = useState<MutualFundFilterState>(() => readStoredFilterState());

  return (
    <MutualFundFilterResultsPage
      title={t.products.filterResults.title}
      funds={funds}
      initialFilterState={initialFilterState}
      onBack={goBack}
      onFundSelect={(fundId) =>
        router.push(`/product-catalog/mutual-fund/${encodeURIComponent(fundId)}`)
      }
    />
  );
}
