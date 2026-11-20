/**
 * Client shapes — what the API must return for the IC's book of clients.
 *
 * Written by hand on purpose: these are the contract, and the mock JSON in
 * `src/mocks` is checked against them (not the other way round).
 */

import type { MembershipTier } from "@/components/ui/tier-badge";
import type { AssetAllocationSlice, AssetHeroSummary } from "./portfolio";

/** Wealth band the bank files the client under. */
export type ClientTier = "HNW" | "UHNW";

/** Account standing, shown as a status dot. */
export type ClientStatus = "success" | "error" | "hold" | "processing";

export type RiskProfile = "Conservative" | "Moderate" | "Aggressive";

export type AdvisoryAccountStatus = "open" | "none";

/** A row in the IC's client list. */
export type Client = {
  id: string;
  name: string;
  tier: ClientTier;
  membershipTier: MembershipTier;
  /** Assets under management, THB. */
  aum: number;
  /** Share of the portfolio sitting in cash, 0–100. */
  cashIdlePct: number;
  /** Year-to-date P/L, percent. */
  plYtdPct: number;
  /** Engagement score from the AI model, 0–100. */
  aiScore: number;
  status: ClientStatus;
  /**
   * Relative label of the last contact ("2 days ago"). Kept although the UI
   * derives it from call logs today — see docs/phase-scope.md before removing.
   */
  lastContact: string;
  riskProfile: RiskProfile;
  advisoryAccounts: {
    robo: AdvisoryAccountStatus;
    definit: AdvisoryAccountStatus;
  };
};

// ── Client detail (Client 360) ───────────────────────────────────────────────

export type ClientAssetSummary = AssetHeroSummary & {
  allocationSlices?: AssetAllocationSlice[];
};

/** One slice of the allocation donut. `fill` is the chart colour. */
export type AllocationDatum = { name: string; value: number; fill: string };

export type AllocationKpi = {
  label: string;
  value: string;
  ytd: string;
  ytdPositive: boolean;
  warning?: string;
};

export type ClientHolding = {
  asset: string;
  value: string;
  pnl: string;
  pnlPct: string;
  positive: boolean;
  pct: string;
};

export type ClientTask = { id: string; done: boolean; task: string; urgent: boolean };

export type ClientActivity = {
  label: string;
  description: string;
  date: string;
  dotColor: string;
};

export type AiPriorityAlert = {
  title: string;
  message: string;
  primaryAction: string;
  secondaryAction: string;
};

export type AiRiskAlert = { title: string; message: string; action: string };

/** Per-client detail record behind the Client 360 profile. */
export type ClientDetail = {
  assetSummary?: ClientAssetSummary;
  allocationData: AllocationDatum[];
  allocationBreakdown: AllocationKpi[];
  topHoldings: ClientHolding[];
  behavioralProfile: { label: string; value: string }[];
  tasks: ClientTask[];
  recentActivity: ClientActivity[];
  aiHighPriority: AiPriorityAlert | null;
  aiRiskAlert: AiRiskAlert | null;
};
