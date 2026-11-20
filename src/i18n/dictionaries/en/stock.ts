import type th from "@/i18n/dictionaries/th/stock";
import { plural } from "@/i18n/plural";

const stock = {
  latestUpdate: (stamp: string) => `Latest update: ${stamp}`,
  chart30Day: "30-Day Data Chart",

  marketStatus: {
    "Pre-Open": "Pre-Open",
    Open: "Open",
    "Pre-Close": "Pre-Close",
    Closed: "Closed",
    Suspend: "Suspend",
    Halt: "Halt",
    Expired: "Expired",
    Intermission: "Intermission",
    Break: "Break",
  },

  markets: { th: "Thai Market", us: "US Market" },

  tab: {
    recommendationTitle: "Stock Recommendation",
    recommendationDesc: "Stay on top of all the movements in the capital market.",
    topGain: "Top Gain",
    topLoss: "Top Loss",
    topPick: "Top Pick",
    crossSellTitle: "Open up opportunities in other assets through the Thai market.",
    crossSellDesc: "Accessing other investments has become more convenient.",
    drTitle: "DR (Depositary Receipt)",
    etfTitle: "ETF (Exchange Traded Fund)",
    etfDesc: "Index funds can be traded in the same way as stocks",
    viewAll: "View all",
  },

  sectorSection: {
    title: "SET Industry Sector",
    desc: "Select stocks with strong fundamentals from sectors you like.",
  },

  sectorNames: {
    th: {
      resources: "Resources",
      services: "Services",
      industrials: "Industrials",
      "consumer-products": "Consumer Products",
      "agro-food": "Agro & Food Industry",
      financials: "Financials",
      technology: "Technology",
      "property-construction": "Property & Construction",
    },
    us: {
      energy: "Energy",
      material: "Material",
      industrials: "Industrials",
      "consumer-discretionary": "Consumer Discretionary",
      "consumer-staples": "Consumer Staples",
      "health-care": "Health Care",
      financials: "Financials",
      "information-technology": "Information Technology",
      "communication-services": "Communication Services",
      utilities: "Utilities",
      "real-estate": "Real Estate",
    },
  },

  sectorTileNames: {
    th: {
      "consumer-products": "Consumer \nProducts",
      "agro-food": "Agro & \nFood \nIndustry",
    },
    us: {
      energy: "Resources",
      material: "Services",
      "consumer-discretionary": "Consumer \nDiscretionary",
      "consumer-staples": "Consumer\nStaples",
      "communication-services": "Communication\nServices",
    },
  },

  detailList: {
    count: (n: number) => `${n} Lists`,
    sort: { all: "All Lists", gain: "Top Gain", loss: "Top Loss" },
    sortAria: (label: string) => `Sort: ${label}`,
    loadingMore: "Loading data",
  },

  notFound: "No data found",
  notFoundSymbol: "Security not found",

  empty: {
    indices: "No index data yet",
    stocks: "No stocks in this list yet",
    crossSell: "No assets in this category yet",
    sectors: "No industry sector data yet",
    list: "No securities in this list yet",
  },

  indexDetail: {
    boardTitle: { th: "Thai Market Index", us: "Global Market Index" },
    fallbackTitle: "Market Index",
  },

  crossSell: {
    kinds: {
      dr: {
        title: "DR (Depositary Receipt)",
        description:
          "An investment product that is traded on the Stock Exchange of Thailand.\nIt is designed to provide Thai investors with increased opportunities.",
      },
      etf: {
        title: "ETF (Exchange Traded Fund)",
        description:
          "An investment policy that follows various indexes like stocks, commodities, \nand bonds, aiming to generate returns similar to the index's movements.",
      },
    },
    filter: "Filter",
    filterTitle: (n: number) => `Filter (${n})`,
    issuer: "Issuer",
    region: "Region / Country",
    clearAll: "Clear All",
    confirm: "Confirm",
    close: "Close",
    countries: {
      thailand: "Thailand",
      us: "US",
      taiwan: "Taiwan",
      china: "China",
      japan: "Japan",
      vietnam: "Vietnam",
      "hong-kong": "Hong Kong",
      singapore: "Singapore",
      india: "India",
      europe: "Europe",
      denmark: "Denmark",
      france: "France",
      italy: "Italy",
      netherlands: "Netherlands",
    },
  },

  detail: {
    tabs: {
      "Market Info": "Market Info",
      "Related Product": "Related Product",
      Company: "Company",
      Research: "Research",
      Technical: "Technical",
      News: "News",
    },
    tabNotice: (tab: string) => `${tab} details will be available soon.`,
    noTabData: "No data in this section yet",
    noRelated: "No related products for this stock yet",
    proposalDocuments: "Stock research",
    lastUpdated: (stamp: string) => `Last updated: ${stamp}`,
    quote: {
      volume: "Volume",
      value: "Value",
      mktCap: "Mkt Cap",
      daysRange: "Day's Range",
    },
    orderBook: {
      title: "Order Book",
      volume: "Volume",
      bestBid: "Best Bid",
      bid: "Bid",
      offer: "Offer",
    },
    timeSales: {
      title: "Time&Sales",
      tick: "Tick by Tick",
      volumeAnalysis: "Volume Analysis",
      cols: { time: "Time", price: "Price", volume: "Volume", side: "Side" },
      side: { Buy: "Buy", Sell: "Sell" },
    },
    advance: {
      title: "Advance Data",
      daysRange: "Day's Range",
      week52: "52wk.",
      close: "Close",
      stats: {
        volume: "Volume",
        open: "Open1",
        floor: "Floor",
        avgVol10d: "Avg Vol (10D)",
        week52Low: "52 Week Low",
        turnoverRatio: "Turnover Ratio",
        freeFloatPct: "%Free Float",
        lotSize: "Lot Size",
        pe: "P/E",
        dividend: "Dividend",
        marginRate: "Margin Rate",
        value: "Value",
        preClose: "PreClose",
        ceiling: "Ceilling",
        mktCap: "Mkt Cap",
        week52High: "52 Week High",
        turnover: "Turnover",
        freeFloat: "Free Float",
        totalShares: "Total Shares",
        pb: "P/B",
        dividendYield: "Dividend Yield",
      },
    },
  },

  company: {
    subTabs: {
      profile: "Company Profile",
      financials: "Financials",
      events: "Company Events",
    },
    comingSoon: (label: string) => `${label} will be available soon.`,
    noData: "No company information for this stock yet",
    actionCount: (n: number) => `${n} ${plural(n, { one: "action", other: "actions" })}`,
    today: "Today",
    goToToday: (date: string) => `Go to today · ${date}`,
    nothingScheduled: "Nothing scheduled",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    filterActions: "Filter corporate actions",
    more: (n: number) => `+${n} more`,
  },

  related: {
    chips: {
      dr: "DR",
      derivative: "Derivative",
      structured: "Global Structured Product",
      "thai-structured": "Thai Structured Product",
      "fixed-income": "Fixed Income",
      "global-bond": "Global Bond",
      "mutual-fund": "Mutual Fund",
    },
    drYuanta: "DR issued by Yuanta",
    drOthers: "DR issued by other brokers",
    symbols: (n: number) => `${n} Symbols`,
    im: (value: string) => `IM: ${value}`,
    points: "points",
    relatedFutures: "Related Futures",
    contracts: (n: number) => `${n} Contracts`,
    viewMode: "View Mode",
    viewTable: "Table",
    viewCard: "Card",
    volumeContracts: "Volume (Contracts)",
    oiContracts: "Open Interest (Contracts)",
    futuresUpdated: (stamp: string) =>
      `Prices reflect only Auto-Matching trades. Last updated: ${stamp}`,
    symbol: "Symbol",
    totalFutures: "Total Futures",
    cols: {
      lastTradingDay: "Last Trading\nDay",
      lastPrice: "Last Price",
      im: "IM",
      change: "Change",
      changePercent: "% Change",
      open: "Open",
      high: "High",
      low: "Low",
      volume: "Volume",
      openInterest: "Open\nInterest",
      settlementPrice: "Settlement\nPrice",
    },
    remark: {
      title: "Remark",
      price: "• Price:",
      priceBody: "Exclude Block Trade Transaction",
      chg: "• Chg (Change):",
      chgBody: "Change from Prior Settlement Price",
      oi: "• OI (Open Interest):",
      oiDay:
        "- During Day Session, Open Interest is the value as of the Night Session of previous day.",
      oiNight:
        "- During Night Session, Open Interest is the value as of the Afternoon Session of current day.",
      im: "• IM:",
      imBody: "Initial Margin",
    },
    topPick: "Top pick",
    allThaiFcn: "All Thai FCN",
    yield: "Yield",
  },
} satisfies typeof th;

export default stock;
