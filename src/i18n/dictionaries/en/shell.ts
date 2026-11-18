import type th from "../th/shell";

const shell = {
  chipScroller: {
    scrollLeft: "Scroll left",
    scrollRight: "Scroll right",
  },
  dialog: {
    back: "Back",
  },
  avatarStack: {
    more: (n: number) => `${n} more`,
  },
  compactList: {
    viewAll: "View all",
  },
  breadcrumb: {
    sections: {
      "command-center": "Command Center",
      "client-hub": "Client 360",
      "product-catalog": "Product Catalog",
      insights: "House View",
      promotions: "Promotion/Events",
      orders: "Order Management",
      performance: "Performance",
      "ic-learning": "IC Learning",
      "yaa-team-head": "YAA/Team Head",
      notes: "Notes",
      calendar: "Calendar",
      reminders: "Reminders",
    },
    commandCenter: {
      callLog: "Call Log",
      nextBestActions: "Next Best Actions",
      riskAlerts: "Proactive Compliance Alerts",
    },
    fallback: {
      client: "Client",
      insight: "Insight",
      campaign: "Campaign",
      productTrending: "Product Trending",
      structuredProduct: "Structured Product",
      investmentSolution: "Investment Solution",
      fixedIncome: "Fixed Income",
      globalBond: "Global Bond",
      topPerformers: "Top-performing funds",
      mutualFund: "Mutual Fund",
      industrySector: "SET Industry Sector",
    },
    allStructuredProducts: "All Structured Products",
    topIdea: "Top idea",
    allOverseasBonds: "All Overseas Bonds",
    dr: "DR (Depositary Receipt)",
    etf: "ETF (Exchange Traded Fund)",
  },
} satisfies typeof th;

export default shell;
