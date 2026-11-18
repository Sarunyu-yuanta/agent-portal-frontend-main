import type { RoboAdvisoryPlan } from "./robo-advisory-plan-data";
import type { RoboRiskTier } from "./robo-risk-level";

export type RoboProviderFilter = "alpha-wealth" | "alpha-one";
export type RoboRebalanceFilter = "bi-weekly" | "monthly";

export type RoboAdvisoryFilters = {
  providers: RoboProviderFilter[];
  risks: RoboRiskTier[];
  rebalances: RoboRebalanceFilter[];
};

export const EMPTY_ROBO_ADVISORY_FILTERS: RoboAdvisoryFilters = {
  providers: [],
  risks: [],
  rebalances: [],
};

/** Figma 33787:152139 — "Model type" chip group. */
export const ROBO_PROVIDER_FILTERS: { id: RoboProviderFilter; label: string }[] = [
  { id: "alpha-wealth", label: "Alpha Wealth" },
  { id: "alpha-one", label: "Alpha One" },
];

/** Figma 33787:152139 — "ความเสี่ยง" chip group. */
export const ROBO_RISK_FILTERS: { id: RoboRiskTier; label: string }[] = [
  { id: "medium", label: "กลาง" },
  { id: "high", label: "สูง" },
  { id: "super-high", label: "สูงมาก" },
];

/** Figma 33787:152139 — "Rebalance Timing" chip group. */
export const ROBO_REBALANCE_FILTERS: { id: RoboRebalanceFilter; label: string }[] = [
  { id: "bi-weekly", label: "Bi-Weekly" },
  { id: "monthly", label: "Monthly" },
];

const ROBO_PROVIDER_ID_BY_NAME: Record<string, RoboProviderFilter> = {
  "Alpha Wealth": "alpha-wealth",
  "Alpha One": "alpha-one",
};

function getRoboRebalanceId(timing: string): RoboRebalanceFilter | undefined {
  if (timing.includes("Bi-Weekly")) return "bi-weekly";
  if (timing.includes("Monthly")) return "monthly";
  return undefined;
}

export function countRoboAdvisoryFilters(filters: RoboAdvisoryFilters): number {
  return filters.providers.length + filters.risks.length + filters.rebalances.length;
}

export function filterRoboAdvisoryPlans(
  plans: RoboAdvisoryPlan[],
  filters: RoboAdvisoryFilters,
): RoboAdvisoryPlan[] {
  return plans.filter((plan) => {
    if (filters.providers.length > 0) {
      const providerId = ROBO_PROVIDER_ID_BY_NAME[plan.provider];
      if (!providerId || !filters.providers.includes(providerId)) return false;
    }
    if (filters.risks.length > 0 && !filters.risks.includes(plan.riskTier)) return false;
    if (filters.rebalances.length > 0) {
      const rebalanceId = getRoboRebalanceId(plan.detail.timing);
      if (!rebalanceId || !filters.rebalances.includes(rebalanceId)) return false;
    }
    return true;
  });
}
