/**
 * Performance page static data and helpers.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * KPI metrics come from `mockPerformanceData` (@/lib/mock-data). `GAP_ITEMS`
 * and `AI_STEPS` (the gap-analysis figures and AI action plan) are hard-coded
 * and should be returned by the backend.
 */

export function statusVariant(s: string): "green" | "yellow" | "blue" {
  if (s === "On Track") return "green";
  if (s === "Exceeded") return "blue";
  return "yellow";
}

export const PRODUCT_COLORS: Record<string, string> = {
  "Equity Funds":    "var(--bg-brand-secondary)",
  "Fixed Income":    "var(--bg-brand-primary)",
  "Structured Notes":"var(--bg-success-primary)",
  "REITs":           "var(--bg-warning-primary)",
  "Alternatives":    "var(--bg-theme-pink)",
};

export const GAP_ITEMS = [
  {
    label: "Revenue Shortfall",
    value: "฿5.8M",
    sub: "to hit Q2 target",
    badge: "19% gap",
    progress: 81,
    color: "var(--text-danger-primary)",
    bg: "var(--bg-danger-light)",
    border: "var(--border-danger)",
    track: "var(--bg-danger-light)",
  },
  {
    label: "AUM Growth Gap",
    value: "−1.6pp",
    sub: "below target rate",
    badge: "16% gap",
    progress: 84,
    color: "var(--text-warning-primary)",
    bg: "var(--bg-warning-light)",
    border: "var(--border-warning)",
    track: "var(--bg-warning-light)",
  },
  {
    label: "Product Penetration",
    value: "−0.6",
    sub: "products / client gap",
    badge: "20% gap",
    progress: 80,
    color: "var(--text-warning-primary)",
    bg: "var(--bg-warning-light)",
    border: "var(--border-warning)",
    track: "var(--bg-warning-light)",
  },
];

export const AI_STEPS = [
  {
    n: 1,
    title: "Close 2 Structured Note proposals",
    detail: "฿110M combined · 85% and 78% probability. Closes ฿2.4M rev gap immediately.",
    cta: "Follow Up",
    impact: "+฿2.4M",
  },
  {
    n: 2,
    title: "Re-engage Wichai Thongkam",
    detail: "฿45M bond proposal stalled 25 days. Pitch Short-term Fixed Income instead.",
    cta: "Draft Message",
    impact: "+฿0.5M",
  },
  {
    n: 3,
    title: "Pitch Asia Equity Fund to 3 UHNW clients",
    detail: "Somchai, Nattaporn, Thanawat hold idle cash. Optimal window this week.",
    cta: "Generate Pitch Decks",
    impact: "+฿1.8M",
  },
];
