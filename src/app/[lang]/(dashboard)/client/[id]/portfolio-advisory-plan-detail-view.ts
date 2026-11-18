import type { DefinitPlan } from "./definit-plan-data";
import type { RoboAdvisoryPlan, RoboPlanDetail } from "./robo-advisory-plan-data";
import type { RoboRiskTier } from "./robo-risk-level";

/** Shared modal body — Robo Advisory & Definit differ only in copy and a few layout flags. */
export type PlanDetailSummary =
  | { kind: "paragraph"; text: string }
  | { kind: "factors"; intro: string; factors: string[] };

export type PortfolioAdvisoryPlanDetailPresentation = {
  showDividendStat: boolean;
  showMarketTiming: boolean;
  showFeeFootnote: boolean;
};

/** Figma 33787:150203 / 34315:86458 — shared modal shell (720px, no footer CTA). */
const MODAL_SHELL: PortfolioAdvisoryPlanDetailPresentation = {
  showDividendStat: true,
  showMarketTiming: true,
  showFeeFootnote: true,
};

export type PortfolioAdvisoryPlanDetailView = {
  provider: string;
  name: string;
  summary: PlanDetailSummary;
  riskTier: RoboRiskTier;
  availableRoom: string;
  minInvestment: string;
  holdingPeriod: string;
  maxDrawdown: string;
  dividendPerYear?: string;
  detail: RoboPlanDetail;
  presentation: PortfolioAdvisoryPlanDetailPresentation;
};

const DEFINIT_PRESENTATION: PortfolioAdvisoryPlanDetailPresentation = {
  ...MODAL_SHELL,
  showDividendStat: false,
  showMarketTiming: false,
  showFeeFootnote: false,
};

export function roboPlanToDetailView(plan: RoboAdvisoryPlan): PortfolioAdvisoryPlanDetailView {
  return {
    provider: plan.provider,
    name: plan.name,
    summary: { kind: "paragraph", text: plan.description.trim() },
    riskTier: plan.riskTier,
    availableRoom: plan.availableRoom,
    minInvestment: plan.minInvestment,
    holdingPeriod: plan.holdingPeriod,
    maxDrawdown: plan.maxDrawdown,
    dividendPerYear: plan.dividendPerYear,
    detail: plan.detail,
    presentation: MODAL_SHELL,
  };
}

export function definitPlanToDetailView(plan: DefinitPlan): PortfolioAdvisoryPlanDetailView {
  return {
    provider: "Definit x Yuanta",
    name: plan.name,
    summary: { kind: "factors", intro: plan.intro, factors: plan.factors },
    riskTier: plan.riskTier,
    availableRoom: plan.availableRoom,
    minInvestment: plan.minInvestment,
    holdingPeriod: plan.holdingPeriod,
    maxDrawdown: plan.maxDrawdown,
    detail: plan.detail,
    presentation: DEFINIT_PRESENTATION,
  };
}
