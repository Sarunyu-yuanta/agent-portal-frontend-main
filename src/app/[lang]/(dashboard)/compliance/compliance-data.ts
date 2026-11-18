/**
 * Compliance page shared types and filter config.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * KYC rows come from `mockKYCData` and alerts from `mockComplianceAlerts`
 * (see @/lib/mock-data). The KPI figures in `KpiBar` and the "N hrs ago"
 * timestamps in `AlertCards` are hard-coded and should come from the API.
 */

import { mockKYCData } from "@/lib/mock-data";

export type KycRow = (typeof mockKYCData)[number];

export type SortKey = "client" | "riskRating" | "nextReview" | "daysUntilExpiry";
export type SortDir = "none" | "asc" | "desc";

export const kycFilterOpts = [
  { value: "", label: "All Statuses" },
  { value: "success",    label: "Verified" },
  { value: "processing", label: "Processing" },
  { value: "hold",       label: "On Hold" },
  { value: "error",      label: "Expired" },
];
