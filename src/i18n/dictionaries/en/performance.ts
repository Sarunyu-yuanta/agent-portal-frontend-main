import type th from "@/i18n/dictionaries/th/performance";
import { plural } from "@/i18n/plural";

const performance = {
  comingSoon: {
    title: "Performance",
    body: "Income, pipeline coverage, and target tracking will live here. Not built yet — check back soon.",
  },
  kpi: {
    revenueYtd: "YTD Revenue",
    aumGrowth: "AUM Growth",
    netNewMoney: "Net New Money",
    productPenetration: "Product Penetration",
    overall: "Overall",
    progressTarget: (progress: number, target: string) => `${progress}% · Target ${target}`,
  },
  status: { "On Track": "On Track", Exceeded: "Exceeded", Lagging: "Lagging" } as Record<
    string,
    string
  >,
  gap: {
    title: "Gap Analysis",
    items: {
      revenue: { label: "Revenue Shortfall", sub: "to hit Q2 target" },
      aum: { label: "AUM Growth Gap", sub: "below target rate" },
      penetration: { label: "Product Penetration", sub: "products / client gap" },
    },
  },
  actionPlan: {
    title: "AI Action Plan",
    subtitle: (gap: string) => `Prioritised steps to close ${gap} revenue gap.`,
  },
  income: {
    title: "Income Tracker",
    estCommission: "Est. Commission (YTD)",
    vsLastQuarter: (delta: string) => `${delta} vs last Q`,
    byProduct: "Revenue by Product Type",
  },
  coverage: {
    title: "Pipeline Coverage",
    insightBefore: "Your pipeline can cover",
    insightEmphasis: (pct: number) => `${pct}% of your revenue gap`,
    insightAfter: (n: number) =>
      `if executed. Focus on closing the ${n} ${plural(n, { one: "deal", other: "deals" })} in Negotiation.`,
    dealsInPipeline: "Deals in Pipeline",
    weightedValue: "Weighted Value",
  },
  crossSell: {
    title: "Cross-Sell Diagnostics",
    singleProduct: "Single Product Clients",
    singleProductSub: "High flight risk",
    multiProduct: "Multi-Product Clients (3+)",
    multiProductSub: "Highly retained",
    overReliance: (asset: string, pct: string) => `Over-reliance on ${asset} (${pct} of book).`,
    equities: "Equities",
  },
  engagement: {
    title: "Client Engagement",
    atRisk: (n: number) => `${n} At Risk`,
    active: "Active",
    dormant: "Dormant >30D",
    activePct: (pct: number) => `Active ${pct}%`,
    dormantPct: (pct: number) => `Dormant ${pct}%`,
    viewDormant: "View Dormant Clients",
  },
  simulator: {
    title: "Outcome Simulator",
    subtitle: "Adjust closed deals to see impact on Q2 target.",
    dealsClosed: "Deals Closed from Pipeline",
    deals: (n: number) => `${n} ${plural(n, { one: "deal", other: "deals" })}`,
    all: (n: number) => `All ${n}`,
    projectedTarget: "Projected Target %",
    estTotalCommission: "Est. Total Comm.",
  },
} satisfies typeof th;

export default performance;
