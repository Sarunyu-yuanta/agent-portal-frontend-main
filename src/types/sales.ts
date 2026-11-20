/**
 * The IC's sales workbench: AI next-best actions and insights, the deal
 * pipeline, and performance against targets.
 */

import type { ClientTier } from "./client";

export type NbaPriority = "HIGH" | "MEDIUM" | "LOW";

export type NbaPriorityVariant = "red" | "yellow" | "blue";

/** An AI-suggested next-best action for one client. */
export type NbaAction = {
  id: string;
  clientId: string;
  /** Client display name. */
  clientName: string;
  tier: ClientTier;
  priority: NbaPriority;
  priorityVariant: NbaPriorityVariant;
  insight: string;
  aiDraft: string;
  action: string;
  revenueImpact: string;
};

export type AiInsightType = "Engagement" | "Portfolio" | "Product Match" | "Risk Alert";

export type AiInsight = {
  id: string;
  type: AiInsightType;
  clientId: string;
  /** Client display name. */
  clientName: string;
  tier: ClientTier;
  insight: string;
  /** Model confidence, 0–100. */
  confidence: number;
  revenueImpact: string;
  category: AiInsightType;
};

export type PipelineDeal = {
  id: string;
  clientId: string;
  /** Client display name. */
  client: string;
  product: string;
  dealSize: string;
  /** Win probability, 0–100. */
  probability: number;
  stage: string;
  daysInStage: number;
  stalled: boolean;
};

export type MiniKanbanItem = {
  id: string;
  clientId: string;
  /** Short client name ("Somchai R."). */
  client: string;
  dealName: string;
  dealSize: string;
  stage: string;
};

export type PerformanceStatus = "Lagging" | "On Track";

export type PerformanceKpi = {
  value: string;
  target: string;
  /** 0–100. */
  progress: number;
  status: PerformanceStatus;
};

export type PerformanceData = {
  revenueYtd: PerformanceKpi;
  aumGrowth: PerformanceKpi;
  netNewMoney: PerformanceKpi;
  productPenetration: PerformanceKpi;
  overallGrade: string;
  incomeByProduct: { product: string; revenue: number; target: number }[];
  aiActionPlan: string[];
};
