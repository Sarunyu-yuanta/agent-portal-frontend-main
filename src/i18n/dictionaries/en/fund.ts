import type th from "../th/fund";
import { plural } from "../../plural";

const fund = {
  list: {
    seeMore: "See more",
    viewAll: "View all",
    searchPlaceholder: "Search funds",
    filter: "Filter",
    scrollLeft: "Scroll left",
    scrollRight: "Scroll right",
    previousPeriod: "Previous period",
    nextPeriod: "Next period",
    count: (n: number) => `${n} ${plural(n, { one: "fund", other: "funds" })}`,
    noMatchForQuery: (query: string) => `No funds match "${query}"`,
    noFundsInCategory: "No funds in this category",
    noFundsInTheme: "No funds in this theme",
    asOf: (date: string) => `Data as of ${date}`,
    recommendedFunds: "Recommended funds",
    allFunds: "All funds",
  },

  tags: {
    view: "View",
    highlight: "Highlight",
    pick: "Pick",
    creditCard: "Credit Card",
    risk: (level: number) => `risk: ${level}`,
  },

  groups: {
    all: "All",
    "fixed-income": "Thai fixed income",
    "global-fixed-income": "Global fixed income",
    "thai-equity": "Thai equity",
    "foreign-equity": "Global equity",
    "commodities-group": "Commodities",
    "tax-saving": "Tax saving",
    others: "Others",
  },

  legend: {
    title: "What the fund recommendation tags mean",
    open: "What do these mean?",
    viewDescription:
      "Funds recommended from the CIO Office's view, based on its analysis of the economic outlook and asset trends",
    highlightDescription: "Funds recommended by Yuanta's mutual fund product team",
  },

  topPerformers: {
    title: "Top-performing funds",
    heroSubtitle: "Standout funds, hand-picked for you",
    oneYearPerformance: "1-year performance",
  },

  themes: {
    sectionTitle: "5 featured fund themes",
    sectionSubtitle: "Fund themes with standout returns",
    detailTitle: "Featured fund themes",
  },

  insights: {
    titleShort: "Investment deep dives",
    titleLong: "Deep dives into key opportunities",
    subtitle: "Research from Yuanta CIO",
  },

  quickActions: {
    searchLine1: "Find funds",
    searchLine2: "that interest you",
    taxLine1: "Tax-saving",
    taxLine2: "fund picks",
  },

  filter: {
    title: "Find funds that interest you",
    clear: "Clear",
    clearAll: "Clear all",
    apply: "Apply",
    sections: {
      category: "Category",
      taxSaving: "Tax-saving funds",
      dividendPolicy: "Dividend policy",
      investmentPolicy: "Investment policy",
      managementCompany: "Asset management company",
      riskLevel: "Risk level",
    },
    dividendPolicy: { pay: "Pays", "no-pay": "Doesn't pay" },
    investmentPolicy: { active: "Active", passive: "Passive" },
    riskLevel: (level: number) => (level >= 9 ? "Level 8+" : `Level ${level}`),
    noMatches: "No results match the filters you chose",
    showAllFunds: "Show all funds",
  },

  dividend: {
    historyTitle: "Dividend history",
    bookCloseDate: "Book closing date",
    paymentDate: "Payment date",
    perUnit: "THB/unit",
    none: "This fund doesn't pay dividends",
  },

  detail: {
    historicalReturns: "Historical returns",
    investmentPolicy: "Investment policy",
    readMore: "Read more",
    fees: "Fees",
    feeBuy: "Buy",
    feeSell: "Sell",
    feeManagement: "Management",
    frontEndFee: "(Front-end Fee)",
    lastDividend: "Latest dividend",
    lastDividendPaymentDate: "Payment date",
    fundDetails: "Fund details",
    info: {
      prospectus: "Prospectus",
      viewProspectus: "View prospectus",
      name: "Fund name",
      managementCompany: "AMC",
      fundType: "Fund type",
      taxBenefit: "Tax benefits",
      foreignInvestment: "Invests abroad",
      fxRisk: "FX risk",
      riskScore: "Risk level",
      dividendPolicy: "Dividend policy",
      currencyPolicy: "Currency policy",
      managementFee: "Management fee",
      minimumInvestment: "Minimum investment",
      registrationDate: "Registration date",
      netAssetValue: "Net asset value",
    },
    returnsTable: {
      period: "Period",
      return: "Return",
      volatility: "Fund volatility",
      maxDrawdown: "Maximum Drawdown",
    },
    topHoldings: "Top 5 holdings",
    assetAllocation: "Asset allocation",
    minimumTrade: "Minimum trade amounts",
    minInitialPurchase: "Minimum initial purchase",
    minSubsequentPurchase: "Minimum subsequent purchase",
    minRedemption: "Minimum redemption",
    tradingHours: "Trading hours",
    purchaseCutoff: "Purchase cut-off",
    redemptionCutoff: "Redemption cut-off",
    settlement: "Settlement",
    feeTable: {
      item: "Fee",
      actual: "Actual",
      maximum: "Maximum",
    },
  },

  taxPlanning: {
    title: "Tax planning",
    fundType: "Fund type",
    maxInvestment: "Maximum investment",
    incomeTitle: "Your income",
    incomeHint: "Total income received in the year",
    incomePlaceholder: "Annual income",
    digitsOnly: "Numbers only, please",
    calculate: "Calculate",
    disclaimer:
      "This tax planning tool only gives a rough estimate of tax deductions based on the income entered and general rules. It doesn't include other deductions and isn't personal tax advice or a guarantee of eligibility. Check the latest Revenue Department rules and conditions before investing.",
    unitThb: "THB",
  },
  notFound: {
    theme: "Fund theme not found",
    category: "Fund category not found",
    taxType: "Tax-saving fund type not found",
  },

  empty: {
    themes: "No featured fund themes yet",
    themeFunds: "No funds in this theme yet",
    categoryFunds: "No funds in this category yet",
    insights: "No research yet",
    recommendedFunds: "No recommended funds yet",
  },
} satisfies typeof th;

export default fund;
