/**
 * Pipeline stage config and deal helpers.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * Deals come from `mockPipelineDeals` / `usePipelineDeals` (see @/lib/api). The
 * KPI cards on the page are hard-coded and should be returned by the backend.
 * `ADVANCE_CHECKLIST` is the gating checklist per stage — likely a config the
 * backend or a rules service owns.
 */

import { type mockPipelineDeals } from "@/lib/mock-data";

export const STAGES = [
  "Qualified",
  "Proposed",
  "Under Review",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
] as const;

export type Stage = (typeof STAGES)[number];
export type Deal = (typeof mockPipelineDeals)[number];

/** Stage labels: `t.pipeline.stage[stage]`. */
export const STAGE_META: Record<Stage, { dot: string }> = {
  "Qualified":    { dot: "var(--bg-brand-primary)" },
  "Proposed":     { dot: "var(--bg-brand-secondary)" },
  "Under Review": { dot: "var(--bg-warning-primary)" },
  "Negotiation":  { dot: "var(--text-warning-primary)" },
  "Closed Won":   { dot: "var(--bg-success-primary)" },
  "Closed Lost":  { dot: "var(--text-default-secondary)" },
};

/** Button labels: `t.pipeline.advance[stage]`. */
export const STAGE_ADVANCE: Partial<Record<Stage, { next: Stage }>> = {
  "Qualified":    { next: "Proposed" },
  "Proposed":     { next: "Under Review" },
  "Under Review": { next: "Negotiation" },
  "Negotiation":  { next: "Closed Won" },
};

/** Item labels: `t.pipeline.checklist[id]`. */
export const ADVANCE_CHECKLIST: Partial<Record<Stage, { id: string }[]>> = {
  "Qualified": [
    { id: "product-match" },
    { id: "proposal-ready" },
    { id: "meeting-scheduled" },
  ],
  "Proposed": [
    { id: "sent-to-client" },
    { id: "client-ack" },
    { id: "compliance-ok" },
  ],
  "Under Review": [
    { id: "client-feedback" },
    { id: "pricing-reviewed" },
    { id: "internal-approval" },
  ],
  "Negotiation": [
    { id: "terms-agreed" },
    { id: "compliance-signoff" },
    { id: "contract-signed" },
  ],
};

export function parseDealValue(dealSize: string) {
  return parseFloat(dealSize.replace(/[฿,\sM]/g, "")) || 0;
}

export function columnTotal(deals: Deal[]) {
  const sum = deals.reduce((acc, d) => acc + parseDealValue(d.dealSize), 0);
  return sum > 0 ? `฿ ${sum}M` : "—";
}
