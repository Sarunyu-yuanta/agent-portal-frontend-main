import type { Client } from "@/types/domain";
import { ROBO_RISK_CONFIG, type RoboRiskTier } from "./robo-risk-level";

/** The two Portfolio Advisory services; each client opens an account per service. */
export type AdvisoryService = "robo" | "definit";

export type AdvisoryAccountStatus = "open" | "none";

/**
 * Stands in for Yuanta's onboarding / plan-change destinations until those URLs
 * are handed over — both CTAs point here and open in a new tab.
 */
export const ADVISORY_EXTERNAL_URL = "https://www.yuanta.co.th/";

/** Highest plan risk tier each suitability profile is cleared for. */
const RISK_PROFILE_CEILING: Record<string, RoboRiskTier> = {
  Conservative: "low-medium",
  Moderate: "medium",
  Aggressive: "super-high",
};

/** Unknown profiles get the tightest ceiling rather than silently clearing every plan. */
const FALLBACK_CEILING: RoboRiskTier = "low-medium";

function riskRank(tier: RoboRiskTier): number {
  return ROBO_RISK_CONFIG[tier].filledSegments;
}

export function advisoryAccountStatus(
  client: Client,
  service: AdvisoryService,
): AdvisoryAccountStatus {
  return client.advisoryAccounts?.[service] === "open" ? "open" : "none";
}

export type PlanSuitability = "suitable" | "exceeds";

export function planSuitability(client: Client, planTier: RoboRiskTier): PlanSuitability {
  const ceiling = RISK_PROFILE_CEILING[client.riskProfile] ?? FALLBACK_CEILING;
  return riskRank(planTier) <= riskRank(ceiling) ? "suitable" : "exceeds";
}

export type AdvisoryCta = { label: string; href: string; variant: "primary" | "outline" };

/** Opening an account is the headline action; changing an existing plan is secondary. */
export function advisoryCta(client: Client, service: AdvisoryService): AdvisoryCta {
  return advisoryAccountStatus(client, service) === "open"
    ? { label: "เปลี่ยนแผน", href: ADVISORY_EXTERNAL_URL, variant: "outline" }
    : { label: "เปิดบัญชี", href: ADVISORY_EXTERNAL_URL, variant: "primary" };
}

/** Thai label for the client's suitability profile, shown on the selected-client bar. */
export function riskProfileLabel(client: Client): string {
  const ceiling = RISK_PROFILE_CEILING[client.riskProfile];
  return ceiling ? ROBO_RISK_CONFIG[ceiling].label : client.riskProfile;
}
