import type { ReactNode } from "react";
import type th from "../th/commandCenter";
import { plural } from "../../plural";

const items = (n: number) => plural(n, { one: "item", other: "items" });

const commandCenter = {
  greeting: (name: string) => `Hello, ${name}`,
  viewAll: "View all",
  viewAllItems: (n: number) => `View all ${n} ${items(n)}`,
  moreItems: (n: number) => `${n} more ${items(n)}`,
  contactChannels: "Contact",
  backToDashboard: "Back to Dashboard",

  statTiles: {
    clients: "Clients",
    totalAum: "Total AUM",
    viewAllAria: (label: string) => `${label} — view all`,
  },

  assetSummary: {
    title: "Asset overview",
    caption: (clients: number, classes: number) =>
      `Across ${clients} ${plural(clients, { one: "client", other: "clients" })} · ${classes} ${plural(classes, { one: "asset class", other: "asset classes" })}`,
    emptyTitle: "No assets yet",
    emptyBody: "The overview appears once clients in your book hold assets.",
  },

  clientList: {
    title: "Client list",
    empty: "No clients yet",
  },

  reminders: {
    title: "Reminders",
    loadError: "Couldn't load reminders",
  },

  calendar: {
    prevMonth: "Previous month",
    nextMonth: "Next month",
    addReminder: "Add reminder",
    addNote: "Add note",
    reminderAdded: "Reminder added",
    reminderAddError: "Couldn't add the reminder. Please try again.",
  },

  kyc: {
    title: "KYC expiring soon",
    emptyTitle: "No KYC expiring soon",
    emptyBody: "Every client's KYC is outside the alert window.",
    nearestSeparator: " · nearest ",
  },

  nba: {
    title: "AI Next Best Actions",
    pageTitle: "Next Best Actions",
    comingSoon: "Coming Soon",
    comingSoonMessage: {
      book: "Every morning, AI will tell you which client to look after first today, about what, and why.",
      client:
        "AI will suggest what to discuss with this client next and why, with a drafted message.",
    },
    emptyTitle: "No open suggestions",
    emptyBody:
      "AI will suggest a new action when it picks up a signal from a portfolio or a client's behaviour.",
    category: {
      revenue: "Revenue opportunity",
      compliance: "Compliance risk",
      productMatch: "Product match",
      reengage: "Re-engage",
    },
    revenueOpportunity: "Revenue opportunity",
    dismissAria: "Dismiss this suggestion",
    dismiss: "Dismiss",
  },

  callLog: {
    title: "Call Log",
    emptyTitle: "No calls logged yet",
    emptyBodyAll: "Calls logged for every client will gather here.",
    emptyBodyClient: "No calls logged for this client yet.",
    detailTitle: "Call details",
    viewClientHistory: "View this client's full call history",
    direction: { outbound: "Outbound", inbound: "Inbound" },
    allClients: (n: number) => `All clients (${n})`,
    perPage: "Show per page",
    showingRange: (from: ReactNode, to: ReactNode, total: ReactNode): ReactNode[] => [
      "Showing ",
      from,
      " – ",
      to,
      " of ",
      total,
      " calls",
    ],
    columns: {
      client: "Client",
      date: "Date",
      direction: "Direction",
      duration: "Duration",
      summary: "Summary",
    },
  },

  risk: {
    title: "Proactive Compliance Alerts",
    loadError: "Couldn't load risk alerts",
    emptyTitle: "No open risk alerts",
    emptyBody:
      "You'll be alerted as soon as a margin, suitability or trading-conduct risk is found.",
    emptySeverity: "Nothing at this level",
    emptyCategory: "Nothing in this category",
    emptyFilteredBody: "Choose “All” to see other risk alerts.",
    noFilterResultTitle: "No alerts match these filters",
    noFilterResultBody: "Try another category or severity, or clear the filters to see everything.",
    severityChipAria: (label: string, n: number) => `${label}: ${n} ${items(n)}`,
    acknowledged: "Acknowledged",
    ctaToast: (ruleCode: string, client: string) => `Lorem ipsum — ${ruleCode} · ${client}`,
  },

  riskDetail: {
    title: "Risk details",
    viewClientProfile: "View client profile",
    details: "Details",
    triggerFigures: "Figures behind this alert",
    contactRestriction: "Contact restriction",
    acknowledge: "Acknowledge",
  },
} satisfies typeof th;

export default commandCenter;
