import type th from "../th/pipeline";
import { plural } from "../../plural";

const pipeline = {
  stage: {
    Qualified: "Qualified",
    Proposed: "Proposed",
    "Under Review": "Under Review",
    Negotiation: "Negotiation",
    "Closed Won": "Closed Won",
    "Closed Lost": "Closed Lost",
  },
  advance: {
    Qualified: "Propose",
    Proposed: "Review",
    "Under Review": "Negotiate",
    Negotiation: "Mark Won",
  },
  advanceFallback: "Advance",
  checklist: {
    "product-match": "Product confirmed against the client's risk profile",
    "proposal-ready": "Term sheet / proposal document prepared",
    "meeting-scheduled": "Presentation meeting booked with the client",
    "sent-to-client": "Proposal sent to the client",
    "client-ack": "Client has acknowledged and reviewed the documents",
    "compliance-ok": "Passed initial compliance check",
    "client-feedback": "Client feedback received",
    "pricing-reviewed": "Pricing and terms reviewed",
    "internal-approval": "Internal approval received",
    "terms-agreed": "Final terms agreed with the client",
    "compliance-signoff": "Compliance sign-off complete",
    "contract-signed": "Client has signed the contract / subscription form",
  } as Record<string, string>,
  card: {
    stalled: (days: number) => `Stalled · ${days}d`,
    won: "Won",
    lost: "Lost",
    daysInStage: (days: number) => `${days}d in stage`,
    reopen: "Reopen",
    noDeals: "No deals",
  },
  kpi: {
    totalValue: "Total Pipeline Value",
    weightedRevenue: "Weighted Est. Revenue",
    winRate: "Win Rate",
    avgCycle: "Avg Deal Cycle",
    vsQuarter: (delta: string, quarter: string) => `${delta} vs ${quarter}`,
    activeDeals: (n: number) => `${n} active ${plural(n, { one: "deal", other: "deals" })}`,
    probabilityWeighted: "Probability-weighted",
    industryAvg: (pct: string) => `Industry avg: ${pct}`,
    days: (n: number) => `${n} ${plural(n, { one: "day", other: "days" })}`,
    target: (value: string) => `Target: ${value}`,
  },
  toolbar: {
    productType: "Product Type",
    allProducts: "All Products",
    quarter: "Quarter",
    allQuarters: "All Quarters",
    newProposal: "New Proposal",
  },
  product: {
    sn: "Structured Note",
    eq: "Equity Fund",
    fi: "Fixed Income",
    reit: "REITs",
    bond: "Bond",
  },
  newProposal: {
    title: "New Proposal",
    clientName: "Client Name",
    productType: "Product Type",
    dealSize: "Deal Size (฿)",
    create: "Create",
  },
  advanceModal: {
    title: "Before the next stage",
    checklist: "Do these first",
  },
} satisfies typeof th;

export default pipeline;
