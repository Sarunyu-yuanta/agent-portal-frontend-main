/** `shell` namespace — see th/index.ts for the rules. */
const shell = {
  chipScroller: {
    scrollLeft: "เลื่อนไปทางซ้าย",
    scrollRight: "เลื่อนไปทางขวา",
  },
  dialog: {
    back: "ย้อนกลับ",
  },
  avatarStack: {
    /** Screen-reader label for the "+N" overflow circle. */
    more: (n: number) => `อีก ${n} คน`,
  },
  compactList: {
    viewAll: "ดูทั้งหมด",
  },
  breadcrumb: {
    /** Section-root rung, keyed by `NavSectionKey`. */
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
    /** Leaf labels used when the page's own record can't be found. */
    fallback: {
      client: "ลูกค้า",
      insight: "Insight",
      campaign: "แคมเปญ",
      productTrending: "Product Trending",
      structuredProduct: "Structured Product",
      investmentSolution: "Investment Solution",
      fixedIncome: "Fixed Income",
      globalBond: "Global Bond",
      topPerformers: "กองทุนผลตอบแทนเด่น",
      mutualFund: "Mutual Fund",
      industrySector: "SET Industry Sector",
    },
    allStructuredProducts: "Structured Products ทั้งหมด",
    topIdea: "Top idea",
    allOverseasBonds: "All Overseas Bonds",
    dr: "DR (Depositary Receipt)",
    etf: "ETF (Exchange Traded Fund)",
  },
};

export default shell;
