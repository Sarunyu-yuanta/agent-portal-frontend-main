import { createElement, Fragment, type ReactNode } from "react";
import type th from "../th/products";
import { plural } from "../../plural";

/** See `rich` in th/products.ts. */
const rich = (...parts: ReactNode[]): ReactNode => createElement(Fragment, null, ...parts);

const items = (n: number) => `${n} ${plural(n, { one: "item", other: "items" })}`;

const products = {
  common: {
    back: "Back",
    all: "All",
    filter: "Filter",
    filterTitle: (n: number) => (n > 0 ? `Filter (${n})` : "Filter"),
    filterCount: (n: number) => `Filter (${n})`,
    removeFilter: (label: string) => `Remove ${label}`,
    clearSelection: "Clear",
    clearAllSelection: "Clear all",
    confirmSelection: "Apply",
    showResults: "Show results",
    viewAll: "View all",
    viewInfo: "View",
    viewDetails: "View details",
    details: "Details",
    updatedAt: (date: string) => `Last updated ${date}`,
    itemCount: items,
    items,
    noFilterMatch: "No items match these filters",
    notFound: "Not found",
    createOrder: "Create order",
    bookForClient: "Book for client",
    processingOrder: "Order in progress",
    sendProposal: "Send Proposal",
    sendProposalToClient: "Send Proposal to client",
    interested: "Interested",
    documents: "Documents",
    relatedDocuments: "Related documents",
    topPick: "Top Pick",
    factsheet: "Factsheet",
    scrollTabsLeft: "Scroll tabs left",
    scrollTabsRight: "Scroll tabs right",
    detailTabs: { detail: "Detail", orders: "Order" },
  },

  pagination: {
    perPage: "Show per page",
    showing: (r: { from: number; to: number; total: number }, em: (n: number) => ReactNode) =>
      rich(
        "Showing ",
        em(r.from),
        " – ",
        em(r.to),
        " of ",
        em(r.total),
        ` ${plural(r.total, { one: "item", other: "items" })}`,
      ),
  },

  fixedIncome: {
    category: { primary: "Primary market", secondary: "Secondary market" },
    action: { invest: "Create order", follow: "Follow", followed: "Following" },
    booking: {
      open: (period: string) => `On sale ${period}`,
      expected: (period: string) => `Expected on sale ${period}`,
    },
    maturesOn: (date: string) => `Matures: ${date}`,
    ratingAndRisk: (rating: string, risk: string) => `${rating} / Risk ${risk}`,
    active: "Active",
    inactive: "Inactive",
    columns: {
      bond: "Bond",
      company: "Company",
      status: "Status",
      type: "Type",
      couponRate: "Coupon rate",
      couponPeriod: "Coupon frequency",
      tenor: "Tenor",
      maturity: "Maturity date",
      risk: "Risk",
      guarantee: "Guarantee",
      offerType: "Offer type",
      expectedOpen: "Expected on sale",
    },
    detail: {
      ytm: "Yield to maturity (YTM)",
      couponRate: "Coupon rate",
      couponPeriod: "Coupon frequency",
      tenor: "Tenor",
      maturity: "Maturity date",
      companyRating: "Company rating",
      bondRating: "Bond rating",
      risk: "Risk",
      guarantee: "Guarantee",
      offerType: "Offer type",
      subscriptionPeriod: "Subscription period",
      documents: "Related documents",
    },
    company: {
      assetDetails: "Asset details",
      ticker: (ticker: string) => `Ticker : ${ticker}`,
      offeringType: (type: string) => `Offer type : ${type}`,
      minSubscription: (amount: string) => `Minimum subscription : ${amount}`,
    },
    filter: {
      company: "Company",
      coupon: "Coupon",
      offerType: "Offer type",
      risk: "Risk",
      couponOptions: { lt2: "Below 2%", "2to4": "2 - 4%", "5to7": "5 - 7%", gt7: "Above 7%" },
      couponChips: {
        lt2: "Coupon below 2%",
        "2to4": "Coupon 2 - 4%",
        "5to7": "Coupon 5 - 7%",
        gt7: "Coupon above 7%",
      },
      riskOptions: { lt3: "Below 3", "4to5": "4 - 5", "6to7": "6 - 7", "8": "8" } as Record<
        string,
        string
      >,
      riskChip: (label: string) => `Risk ${label}`,
    },
  },

  globalBond: {
    columns: {
      bonds: "Bonds",
      isin: "ISIN",
      currency: "Currency",
      couponRate: "Coupon Rate",
      price: "Price",
      estimatedYield: "Est. yield",
      yield: "Yield",
      maturity: "Maturity date",
      durationYears: "Duration (yrs)",
      documents: "Documents",
      order: "Order",
      action: "Action",
      issuer: "Issuer",
      creditRating: "Credit Rating",
      topPick: "Top pick",
    },
    filter: {
      allTickers: "All Ticker",
      allCouponRates: "All Coupon Rate",
      estimatedYield: "Est. yield",
      timeToMaturity: "Time to maturity",
      short: "Short (≤3 yrs)",
      long: "Long (> 3 yrs)",
    },
    hero: {
      ticker: (ticker: string) => `Ticker : ${ticker}`,
      tickerLabel: "Ticker:",
      currency: (currency: string) => `Currency : ${currency}`,
      estimatedYield: "Est. yield :",
      timeToMaturity: "Time to maturity :",
    },
    all: {
      title: "All Overseas Bonds",
      subtitleLines: ["Every overseas bond", "available to trade"] as [string, string],
    },
    tab: {
      title: "Recommended overseas bonds",
      recommended: "Recommended bonds",
    },
    recommendedBonds: "Recommended Bonds",
  },

  structured: {
    tags: { almostFull: "Almost full", principalProtected: "Principal protected" },
    all: {
      title: "All Structured Products",
      subtitle: "Every Structured Product available to trade",
    },
    couponFilter: {
      all: "ALL",
      low: "Low Coupon [0-15%]",
      medium: "Medium Coupon [15-30%]",
      high: "High Coupon [30-40%]",
      ultra: "Ultra High Coupon [40% ++]",
    },
    detail: {
      coupon: "Coupon rate",
      offerDate: "Offer date",
      couponPeriod: "Coupon frequency",
      tenor: "Tenor",
      productName: "Product",
      productType: "Type",
      currency: "Currency",
      minInvestment: "Minimum investment",
      moreInfo: "More information",
    },
    sentRef: (ref: string) => `Sent (${ref})`,
    notSentYet: "Order not sent yet",
    tenorMonths: (months: number | string) =>
      `${months} ${Number(months) === 1 ? "month" : "months"}`,
  },

  fcn: {
    asOf: (date: string) => `as of ${date}`,
    contact: (em: (s: string) => ReactNode) =>
      rich(
        "For more information or to invest, contact your investment consultant or ",
        em("Online-Service 02-009-8000"),
      ),
    disclaimer:
      "This is preliminary information only. Investors should study the details before deciding. The company does not guarantee the principal or the returns described in this document.",
    downloadPdf: "Download PDF",
  },

  packageFiles: {
    title: "Full document set",
    downloadZip: "Download .zip",
    downloadAll: "Download all (.zip)",
    summary: (count: number, em: (s: string) => ReactNode, zipName: string) =>
      rich(
        `${count} ${plural(count, { one: "file", other: "files" })} · bundled into `,
        em(zipName),
      ),
    downloading: (zipName: string, count: number) =>
      `Downloading ${zipName}\n(${count} ${plural(count, { one: "file", other: "files" })})`,
    docs: {
      presentation: "FCN presentation",
      termSheet: "Term Sheet",
      prospectus: "Prospectus",
      riskDisclosure: "Risk disclosure",
      kfs: "Key Fact Statement (KFS)",
      subscriptionForm: "Subscription form",
    },
  },

  topIdea: {
    upTo: "up to",
  },

  catalog: {
    searchPlaceholder: "Search assets",
    recentSearches: "Recent searches",
    clearHistory: "Clear history",
    noMatchFor: (query: string) => `No assets match “${query}”`,
    noneInCategory: "No assets in this category",
    allGlobalStructured: "All Global Structured Product",
    allThaiFcn: "All Thai FCN",
    emptyTabs: {
      tfex: {
        title: "TFEX",
        body: "Futures and options on the Thailand Futures Exchange will live here. Not built yet — check back soon.",
      },
    } as Record<string, { title: string; body: string } | undefined>,
  },

  trending: {
    title: "Recommended Products",
    intro:
      "Stocks and funds are ranked by last week's sales · basket-booked products by basket fill, showing only baskets still open for booking",
    salesUpdatedAt: (date: string) => `Sales, last 7 days | Latest update: ${date}`,
    liveFill: "Live basket fill — showing only baskets still open for booking",
    sortBy: "Sort by",
    sorts: { "best-seller": "Best sellers", highlight: "Yuanta Highlight", "cio-view": "CIO View" },
    emptyBestSeller: "Nothing on sale in this group yet",
    emptyCurated: (sortLabel: string) =>
      `${sortLabel} hasn't picked any products in this group yet`,
    orderCount: (n: number) =>
      `${n.toLocaleString("en-US")} ${plural(n, { one: "order", other: "orders" })}`,
    columns: {
      rank: "Rank",
      product: "Product",
      fill: "Basket fill",
      sales: "Sales",
      orders: "Orders",
      change: "vs last week",
    },
  },

  documentActions: {
    download: "Download documents",
    presentation: "Presentation PDF",
    presentationHint: "To present to the client",
    packageHint: "To close the sale (.zip)",
  },

  advisory: {
    sectionTitle: "Portfolio advisory",
    sectionSubtitle:
      "Let Yuanta manage your assets with Robo Advisory investment plans and our experts",
    robo: {
      tagline: {
        cardCompact: [
          "An automated, AI-driven investment",
          "service that helps you reach your",
          "investment goals with ease",
        ] as string[],
        cardDesktop: [
          "An automated, AI-driven investment service that helps",
          "you reach your investment goals with ease",
        ] as string[],
        heroMobile: [
          "An automated, AI-driven investment service that helps you reach your investment goals",
          "with ease",
        ] as string[],
        full: "An automated, AI-driven investment service that helps you reach your investment goals with ease",
      },
    },
    definit: {
      tagline: {
        card: [
          "For investors in the Thai market, ",
          "analysing fundamentals, ",
          "valuation and technicals ",
        ] as string[],
        heroDesktop: [
          "For investors in the Thai market, analysing",
          "fundamentals, valuation and technicals",
        ] as string[],
        heroMobile: [
          "For investors in the Thai market,",
          "analysing fundamentals,",
          "valuation and technicals",
        ] as string[],
      },
    },
    allPlans: (n: number) => `All plans (${n})`,
    stats: {
      minInvestmentLines: ["Minimum", "initial (THB)"] as [string, string],
      minInvestment: "Minimum initial investment (THB)",
      holdingPeriodLines: ["Holding", "period"] as [string, string],
      holdingPeriod: "Holding period",
      dividendLines: ["Dividend", "per year"] as [string, string],
    },
    riskTier: {
      low: "Low risk",
      "low-medium": "Low-medium risk",
      medium: "Medium risk",
      high: "High risk",
      "super-high": "Very high risk",
    },
    filter: {
      risk: "Risk",
      riskOptions: { medium: "Medium", high: "High", "super-high": "Very high" },
    },
    account: { open: "Account open", none: "No account" },
    suitability: { suitable: "Suits client", exceeds: "Above risk level" },
    cta: { changePlan: "Change plan", openAccount: "Open account" },
    detail: {
      downloadDocuments: "Download more documents",
      topUpMin: "Minimum top-up (per transaction)",
      targetInvestors: "Who this plan suits:",
      allocation: "Asset allocation",
      allocationTotal: "Total investment = 100%",
      fees: "Fees",
    },
    picker: {
      title: "Select client",
      intro: (service: string) =>
        `Pick a client to see the ${service} plans that fit their risk level`,
      searchPlaceholder: "Search by client name or ID",
      noClients: "No clients yet",
      clientParamNotFound: "Client from the link not found — pick one from the list",
      viewPlans: "View investment plans",
      changeClient: "Change client",
      accountFilter: { all: "All", open: "Account open", none: "No account" },
      segment: (label: string, n: number) => `${label} (${n})`,
    },
  },

  notFound: {
    bond: "Bond not found",
    investmentSolution: "Investment solution not found",
    fund: "Fund not found",
    productGroup: "Product group not found",
    company: "Company not found",
    issuer: "Issuer not found",
    topIdea: "Top idea not found",
  },

  states: {
    noOpenProducts: "No products open for sale yet",
    noTopIdeas: "No top ideas yet",
    noInvestmentSolutions: "No investment solutions yet",
    noBonds: "No debentures yet",
    noGlobalBonds: "No bonds yet",
    noPlans: "No investment plans yet",
    noTrendingGroups: "No recommended products yet",
  },

  filterResults: {
    title: "Filter results",
    titleFor: (fundType: string) => `Filter results: ${fundType}`,
  },
} satisfies typeof th;

export default products;
