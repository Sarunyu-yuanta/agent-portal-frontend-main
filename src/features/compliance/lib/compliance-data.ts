/**
 * Compliance page shared types and filter config.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * KYC rows come from `mockKYCData` and alerts from `mockComplianceAlerts`
 * (see @/lib/mock-data). The KPI figures in `KpiBar` and the "N hrs ago"
 * timestamps in `AlertCards` are hard-coded and should come from the API.
 */

import { type mockKYCData } from "@/mocks/mock-data";

export type KycRow = (typeof mockKYCData)[number];

export type SortKey = "client" | "riskRating" | "nextReview" | "daysUntilExpiry";
export type SortDir = "none" | "asc" | "desc";

/** Labels live in `t.compliance.table.filters[id]`. */
export const kycFilterOpts = [
  { value: "", id: "all" },
  { value: "success", id: "success" },
  { value: "processing", id: "processing" },
  { value: "hold", id: "hold" },
  { value: "error", id: "error" },
] as const;
