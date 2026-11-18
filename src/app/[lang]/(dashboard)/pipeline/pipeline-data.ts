/**
 * Pipeline stage config and deal helpers.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * Deals come from `mockPipelineDeals` / `usePipelineDeals` (see @/lib/api). The
 * KPI cards on the page are hard-coded and should be returned by the backend.
 * `ADVANCE_CHECKLIST` is the gating checklist per stage — likely a config the
 * backend or a rules service owns.
 */

import { mockPipelineDeals } from "@/lib/mock-data";

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

export const STAGE_META: Record<Stage, { dot: string; label: string }> = {
  "Qualified":    { dot: "var(--bg-brand-primary)", label: "Qualified" },
  "Proposed":     { dot: "var(--bg-brand-secondary)", label: "Proposed" },
  "Under Review": { dot: "var(--bg-warning-primary)", label: "Under Review" },
  "Negotiation":  { dot: "var(--text-warning-primary)", label: "Negotiation" },
  "Closed Won":   { dot: "var(--bg-success-primary)", label: "Closed Won" },
  "Closed Lost":  { dot: "var(--text-default-secondary)", label: "Closed Lost" },
};

export const STAGE_ADVANCE: Partial<Record<Stage, { label: string; next: Stage }>> = {
  "Qualified":    { label: "Propose",   next: "Proposed" },
  "Proposed":     { label: "Review",    next: "Under Review" },
  "Under Review": { label: "Negotiate", next: "Negotiation" },
  "Negotiation":  { label: "Mark Won",  next: "Closed Won" },
};

export const ADVANCE_CHECKLIST: Partial<Record<Stage, { id: string; label: string }[]>> = {
  "Qualified": [
    { id: "product-match",       label: "ยืนยัน product ตรงกับ risk profile ของลูกค้า" },
    { id: "proposal-ready",      label: "เตรียม term sheet / proposal document เรียบร้อยแล้ว" },
    { id: "meeting-scheduled",   label: "นัดหมายการนำเสนอกับลูกค้าแล้ว" },
  ],
  "Proposed": [
    { id: "sent-to-client",      label: "ส่ง proposal ให้ลูกค้าแล้ว" },
    { id: "client-ack",          label: "ลูกค้ารับทราบและตรวจสอบเอกสาร" },
    { id: "compliance-ok",       label: "ผ่านการตรวจสอบ compliance เบื้องต้น" },
  ],
  "Under Review": [
    { id: "client-feedback",     label: "ได้รับ feedback จากลูกค้าแล้ว" },
    { id: "pricing-reviewed",    label: "ทบทวนราคาและเงื่อนไขเรียบร้อยแล้ว" },
    { id: "internal-approval",   label: "ได้รับ internal approval" },
  ],
  "Negotiation": [
    { id: "terms-agreed",        label: "ตกลงเงื่อนไขสุดท้ายกับลูกค้าแล้ว" },
    { id: "compliance-signoff",  label: "compliance sign-off เรียบร้อย" },
    { id: "contract-signed",     label: "ลูกค้าลงนามสัญญา / subscription form แล้ว" },
  ],
};

export function parseDealValue(dealSize: string) {
  return parseFloat(dealSize.replace(/[฿,\sM]/g, "")) || 0;
}

export function columnTotal(deals: Deal[]) {
  const sum = deals.reduce((acc, d) => acc + parseDealValue(d.dealSize), 0);
  return sum > 0 ? `฿ ${sum}M` : "—";
}
