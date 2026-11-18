/**
 * Mock data for the Product Catalog "Stock" tab (Figma: 3.2 Stock - Thai,
 * node 20862:117604). No live market feed exists yet, so every number here
 * is static — good enough to make the layout and interactions real while a
 * real quote source is wired up.
 */

export type Trend = "up" | "down" | "flat";

/** Deterministic pseudo-chart so SSR and the client render the exact same
 *  sparkline — a real `Math.random()` would desync on hydration. */
export function seededSeries(seed: string, points: number, trend: Trend): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const next = () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return (h % 1000) / 1000;
  };
  const drift = trend === "up" ? 0.9 : trend === "down" ? -0.9 : 0;
  let v = 100;
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    v += drift + (next() - 0.5) * 3.2;
    out.push(v);
  }
  return out;
}

export type MarketIndex = {
  code: string;
  /** Figma: 20×20 circular index logo (node 22907:31997, "circle"). Every
   *  board uses the same placeholder mark today — swap per-code once real
   *  index/exchange logos are available. */
  icon: string;
  price: string;
  changeAmount: string;
  changePercent: string;
  trend: Trend;
  series: number[];
};

/** Figma "Market_status" component (node 35283:560342) — all 9 permutations
 *  of the status tag shown in "3.2 Stock - Thai" and its variants page. */
export type MarketStatusValue =
  | "Pre-Open"
  | "Open"
  | "Pre-Close"
  | "Closed"
  | "Suspend"
  | "Halt"
  | "Expired"
  | "Intermission"
  | "Break";

/** Visual style per status — 4 distinct colorways shared across the 9 labels
 *  (bg/text tokens + the 12px "Status" dot fill, sampled from the Figma
 *  asset circles: FDC024 / 52C41A / 999999 / FF8904). */
export const MARKET_STATUS_STYLE: Record<MarketStatusValue, { bg: string; text: string; dot: string }> = {
  "Pre-Open": { bg: "#feeda7", text: "#b47e23", dot: "#fdc024" },
  Open: { bg: "#dcfac3", text: "#2f952a", dot: "#52c41a" },
  "Pre-Close": { bg: "#feeda7", text: "#b47e23", dot: "#fdc024" },
  Closed: { bg: "#f3f4f6", text: "#666666", dot: "#999999" },
  Suspend: { bg: "#ffd7a8", text: "#9f2d00", dot: "#ff8904" },
  Halt: { bg: "#ffd7a8", text: "#9f2d00", dot: "#ff8904" },
  Expired: { bg: "#f3f4f6", text: "#666666", dot: "#999999" },
  Intermission: { bg: "#f3f4f6", text: "#666666", dot: "#999999" },
  Break: { bg: "#ffd7a8", text: "#9f2d00", dot: "#ff8904" },
};

export const MARKET_STATUS: MarketStatusValue = "Open";

export const MARKET_WATCHLIST = [
  { id: "th", flag: "🇹🇭", label: "Thai Market", active: true },
  { id: "us", flag: "🇺🇸", label: "US Market", active: false },
];

/** Placeholder circular mark used by every `MarketBoard` in the Figma file
 *  (asset `5cc3b.svg`, node 22907:31997) — no real per-index logo exists yet. */
const MARKET_INDEX_ICON = "/products/stock/market-index-icon.svg";

export const MARKET_INDICES: MarketIndex[] = [
  { code: "SET", icon: MARKET_INDEX_ICON, price: "1,320.45", changeAmount: "+8.05", changePercent: "+0.61%", trend: "up", series: seededSeries("SET", 20, "up") },
  { code: "SET50", icon: MARKET_INDEX_ICON, price: "845.10", changeAmount: "+5.15", changePercent: "+0.61%", trend: "up", series: seededSeries("SET50", 20, "up") },
  { code: "SET100", icon: MARKET_INDEX_ICON, price: "1,880.20", changeAmount: "0.00", changePercent: "0.00%", trend: "flat", series: seededSeries("SET100", 20, "flat") },
  { code: "sSET", icon: MARKET_INDEX_ICON, price: "410.32", changeAmount: "-1.85", changePercent: "-0.45%", trend: "down", series: seededSeries("sSET", 20, "down") },
  { code: "MAI", icon: MARKET_INDEX_ICON, price: "395.80", changeAmount: "+1.25", changePercent: "+0.32%", trend: "up", series: seededSeries("MAI", 20, "up") },
];

export const MARKET_LATEST_UPDATE = "Latest update: 30 Apr 2025 - 09:22";

export type StockRow = {
  symbol: string;
  name: string;
  price: string;
  changeAmount: string;
  changePercent: string;
  trend: Trend;
  featured?: boolean;
  logo?: string;
  series: number[];
};

const STOCK_NAMES: Record<string, string> = {
  BBL: "BANGKOK BANK PUBLIC COMPANY LIMITED",
  BDMS: "บริษัท กรุงเทพดุสิตเวชการ จำกัด(มหาชน)",
  KTB: "ธนาคารกรุงไทย จำกัด (มหาชน)",
  PTTEP: "บริษัท ปตท.สำรวจและผลิตปิโตรเลียม จำกัด (มหาชน)",
  ADVANC: "บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด (มหาชน)",
};

function stockRows(
  entries: [symbol: string, price: string, changeAmount: string, changePercent: string, trend: Trend, featured?: boolean][],
): StockRow[] {
  return entries.map(([symbol, price, changeAmount, changePercent, trend, featured]) => ({
    symbol,
    name: STOCK_NAMES[symbol] ?? symbol,
    price,
    changeAmount,
    changePercent,
    trend,
    featured,
    series: seededSeries(symbol + price, 16, trend),
  }));
}

export const STOCK_TOP_GAIN: StockRow[] = stockRows([
  ["BBL", "200.50", "+30.75", "+0.61%", "up"],
  ["BDMS", "160.00", "+15.00", "+0.61%", "up", true],
  ["KTB", "190.00", "+25.40", "+0.61%", "up"],
  ["PTTEP", "210.00", "+40.00", "+0.61%", "up"],
  ["ADVANC", "175.80", "+35.90", "+0.61%", "up", true],
]);

export const STOCK_TOP_LOSS: StockRow[] = stockRows([
  ["BBL", "128.10", "-12.32", "-20.00%", "down"],
  ["BDMS", "150.00", "-0.56", "-20.00%", "down", true],
  ["KTB", "125.00", "-20.00", "-20.00%", "down"],
  ["PTTEP", "135.75", "-0.32", "-20.00%", "down"],
  ["ADVANC", "142.50", "-20.00", "-20.00%", "down", true],
]);

export const STOCK_TOP_PICK: StockRow[] = stockRows([
  ["BBL", "128.10", "+22.50", "+0.61%", "up", true],
  ["BDMS", "150.00", "-20.00", "-20.00%", "down", true],
  ["KTB", "125.00", "0.00", "0.00%", "flat"],
  ["PTTEP", "135.75", "-20.00", "-20.00%", "down", true],
  ["ADVANC", "142.50", "+18.90", "+0.61%", "up", true],
]);

export type ScreenerCard = {
  id: string;
  title: string;
  desc: string;
};

export const STOCK_SCREENER_CARDS: ScreenerCard[] = [
  { id: "trending", title: "Trending search", desc: "Based on an analysis of recent investor behavior and common practices" },
  { id: "highlight", title: "Highlight", desc: "Various stock groups to watch at the current time" },
  { id: "talk-of-the-town", title: "Talk of the town", desc: "The Most Discussed Stocks and Business Sectors on Social Media" },
  { id: "realtime", title: "Realtime", desc: "Real-time intraday stock updates. Filter stocks by specified details" },
];

export type CrossSellRow = {
  symbol: string;
  subtitle: string;
  price: string;
  changeAmount: string;
  changePercent: string;
  trend: Trend;
  currency?: string;
  series: number[];
};

function crossSellRows(
  kind: "DR" | "ETF",
  entries: [symbol: string, subtitle: string, price: string, changeAmount: string, changePercent: string, trend: Trend, currency?: string][],
): CrossSellRow[] {
  return entries.map(([symbol, subtitle, price, changeAmount, changePercent, trend, currency]) => ({
    symbol,
    subtitle,
    price,
    changeAmount,
    changePercent,
    trend,
    currency,
    series: seededSeries(kind + symbol + price, 16, trend),
  }));
}

export const STOCK_DR_ROWS: CrossSellRow[] = crossSellRows("DR", [
  ["TAIWAN19", "Depositary Receipt on YT", "128.10", "+22.50", "+0.61%", "up"],
  ["GOLD19", "Depositary Receipt on SPDR...", "150.00", "-15.00", "-20.00%", "down"],
  ["SIA19", "Depositary Receipt on SIA", "125.00", "0.00", "0.00%", "flat"],
  ["FPTV19", "Depositary Receipt on FPTV", "135.75", "+15.30", "+0.61%", "up"],
  ["NINTENDO19", "Depositary Receipt on NINT...", "142.50", "+18.90", "+0.61%", "up"],
]);

export const STOCK_ETF_ROWS: CrossSellRow[] = crossSellRows("ETF", [
  ["TAIWAN19", "DR on YT TAIWAN50 ETF #Y...", "128.10", "+22.50", "+0.61%", "up"],
  ["GOLD19", "DR on SPDR GOLD TRUST(G...", "150.00", "-15.00", "-20.00%", "down"],
  ["SIA19", "DR on SIA #YUANTA", "125.00", "0.00", "0.00%", "flat"],
  ["FPTV19", "DR on FPTVN #YUANTA", "135.75", "+15.30", "+0.61%", "up"],
  ["NINTENDO19", "DR on NINTENDO #YUANTA", "142.50", "+18.90", "+0.61%", "up"],
]);

/**
 * Figma "3.4 DR_detail" / "3.6 ETF_detail" (nodes 23228:37812 / 23228:38277) —
 * the full asset-card grid a DR/ETF cross-sell card's arrow opens into. Both
 * Figma frames render the exact same 10-card block, repeated twice (20 cards
 * against a static "100 Lists" count — a paginated/lazy-loaded total, not the
 * rendered count), the ETF frame literally reusing the DR instances,
 * descriptions and all. `StockCrossSellDetail` renders this array twice to
 * match, so one shared 10-row dataset backs both detail pages.
 */
export const STOCK_CROSS_SELL_DETAIL_ROWS: CrossSellRow[] = crossSellRows("DR", [
  ["TAIWAN19", "DR on YT TAIWAN50 ETF #YUANTA", "125.00", "+18.00", "+0.61%", "up"],
  ["GOLD19", "DR on SPDR GOLD TRUST(GSD) #YUANTA", "150.00", "0.00", "0.00%", "flat"],
  ["FPTV19", "DR on FPTVN #YUANTA", "142.10", "-18.25", "-20.00%", "down"],
  ["SIA19", "DR on SIA #YUANTA", "110.00", "+25.00", "+0.61%", "up"],
  ["QQQM19", "DR on INVESCO NDAQ100 ETF #YUANTA", "130.00", "+22.50", "+0.61%", "up"],
  ["TAIWAN19", "DR on YT TAIWAN50 ETF #YUANTA", "160.00", "-25.00", "-20.00%", "down"],
  ["PFIZER19", "DR on PFIZER #YUANTA", "140.00", "-15.00", "-20.00%", "down"],
  ["DISNEY19", "DR on DISNEY #YUANTA", "170.00", "+30.00", "+0.61%", "up"],
  ["SIA19", "DR on SIA #YUANTA", "135.75", "0.00", "0.00%", "flat"],
  ["GOLD19", "DR on SPDR GOLD TRUST(GSD) #YUANTA", "98.50", "+15.30", "+0.61%", "up"],
]);

/** A single selectable chip in the DR/ETF "Filter" sheet (Figma
 *  "Modal/filer_Market", node 23051:51385 family) — an issuer/broker logo or
 *  a country flag, plus the label shown beside it. */
export type FilterChipOption = { id: string; label: string; icon: string };

/** Broker logos exported from the Figma filter modal (node 23219:23978). */
export const STOCK_FILTER_ISSUERS: FilterChipOption[] = [
  { id: "yuanta", label: "Yuanta", icon: "/brand/yuanta-icon-logo.svg" },
  { id: "ktb", label: "KTB", icon: "/products/stock/filters/broker-ktb.png" },
  { id: "bls", label: "BLS", icon: "/products/stock/filters/broker-bls.png" },
  { id: "pi", label: "Pi", icon: "/products/stock/filters/broker-pi.png" },
  { id: "kgi", label: "KGI", icon: "/products/stock/filters/broker-kgi.png" },
  { id: "kkps", label: "KKPS", icon: "/products/stock/filters/broker-kkps.png" },
  { id: "ks", label: "KS", icon: "/products/stock/filters/broker-ks.png" },
  { id: "scbx", label: "SCBX", icon: "/products/stock/filters/broker-scbx.png" },
  { id: "fss", label: "FSS", icon: "/products/stock/filters/broker-fss.png" },
  { id: "invx", label: "INVX", icon: "/products/stock/filters/broker-invx.png" },
];

/** Country/region flags — the DR filter omits Thailand (a DR is itself listed
 *  on the SET), the ETF filter includes it, exactly as node 23228:41356 vs.
 *  23228:38758 show. */
const STOCK_FILTER_COUNTRIES_BASE: FilterChipOption[] = [
  { id: "us", label: "US", icon: "/products/stock/filters/flag-us.svg" },
  { id: "taiwan", label: "Taiwan", icon: "/products/stock/filters/flag-taiwan.svg" },
  { id: "china", label: "China", icon: "/products/stock/filters/flag-china.svg" },
  { id: "japan", label: "Japan", icon: "/products/stock/filters/flag-japan.svg" },
  { id: "vietnam", label: "Vietnam", icon: "/products/stock/filters/flag-vietnam.svg" },
  { id: "hong-kong", label: "Hong Kong", icon: "/products/stock/filters/flag-hongkong.svg" },
  { id: "singapore", label: "Singapore", icon: "/products/stock/filters/flag-singapore.svg" },
  { id: "india", label: "India", icon: "/products/stock/filters/flag-india.svg" },
  { id: "europe", label: "Europe", icon: "/products/stock/filters/flag-europe.svg" },
  { id: "denmark", label: "Denmark", icon: "/products/stock/filters/flag-denmark.svg" },
  { id: "france", label: "France", icon: "/products/stock/filters/flag-france.svg" },
  { id: "italy", label: "Italy", icon: "/products/stock/filters/flag-italy.svg" },
  { id: "netherlands", label: "Netherlands", icon: "/products/stock/filters/flag-netherlands.svg" },
];
const STOCK_FILTER_COUNTRIES_THAILAND: FilterChipOption = {
  id: "thailand",
  label: "Thailand",
  icon: "/products/stock/filters/flag-thailand.svg",
};

export type StockCrossSellKind = "dr" | "etf";

export type StockCrossSellDetailConfig = {
  title: string;
  description: string;
  /** Hero banner gradient — Figma "Asset detail" instance (node 23228:30095).
   *  The 320% end-stop (vs. the ~34% Figma's own gradient-handle math implies)
   *  is fit to the rendered frame's actual pixels — the handle length isn't
   *  1:1 with the hero's own height, so 34% way undershoots how blue/orange
   *  the visible banner really gets. */
  gradient: string;
  /** Hero decorative graphic exported straight from the Figma frame (node
   *  23228:29193) — not the Essential Services mockup, which is a different
   *  asset despite the shared subject. */
  heroImage: string;
  /** ETF's globe render sits on an opaque black backdrop in the source PNG;
   *  screen blend (as StockTab already does for the ETF service-card mockup)
   *  drops the black to transparent so the hero gradient shows through. */
  heroImageBlend?: "screen";
  showIssuerFilter: boolean;
  countries: FilterChipOption[];
  defaultIssuerIds: string[];
  defaultCountryIds: string[];
};

/** Per-product copy/gradient/filter config for the DR and ETF detail pages —
 *  both otherwise share `StockCrossSellDetail`'s layout entirely. */
export const STOCK_CROSS_SELL_DETAIL: Record<StockCrossSellKind, StockCrossSellDetailConfig> = {
  dr: {
    title: "DR (Depositary Receipt)",
    description:
      "An investment product that is traded on the Stock Exchange of Thailand.\nIt is designed to provide Thai investors with increased opportunities.",
    gradient: "linear-gradient(180deg, #3597de 0%, #0004ff 320%)",
    heroImage: "/products/stock/cross-sell-hero-dr.png",
    showIssuerFilter: true,
    countries: STOCK_FILTER_COUNTRIES_BASE,
    defaultIssuerIds: ["ktb", "bls"],
    defaultCountryIds: ["china"],
  },
  etf: {
    title: "ETF (Exchange Traded Fund)",
    description:
      "An investment policy that follows various indexes like stocks, commodities, \nand bonds, aiming to generate returns similar to the index's movements.",
    gradient: "linear-gradient(180deg, #f6bb43 0%, #ff4d00 320%)",
    heroImage: "/products/stock/cross-sell-hero-etf.png",
    heroImageBlend: "screen",
    showIssuerFilter: false,
    countries: [STOCK_FILTER_COUNTRIES_THAILAND, ...STOCK_FILTER_COUNTRIES_BASE],
    defaultIssuerIds: [],
    defaultCountryIds: ["china"],
  },
};

export type SectorRow = {
  id: string;
  name: string;
  changeAmount: string;
  changePercent: string;
  trend: Trend;
  /** Heatmap tile weight — bigger sectors get more tile area. */
  size: "lg" | "md" | "sm";
  /** Heatmap label when it differs from the list name (US Energy → Resources).
   *  Embedded `\n` forces the wrap Figma draws inside the narrow tiles. */
  heatmapName?: string;
  /** Heatmap-only quote when the list row uses a different percent/trend. */
  heatmapChangeAmount?: string;
  heatmapChangePercent?: string;
  heatmapTrend?: Trend;
  /** List-row amount/pill color override. Figma US "Material" uses teal. */
  listAccent?: "teal";
};

export const SET_INDUSTRY_SECTORS: SectorRow[] = [
  { id: "resources", name: "Resources", changeAmount: "+20.00", changePercent: "+0.61%", trend: "up", size: "lg" },
  { id: "services", name: "Services", changeAmount: "-20.00", changePercent: "-10.58%", trend: "down", size: "lg" },
  { id: "industrials", name: "Industrials", changeAmount: "+20.00", changePercent: "+0.61%", trend: "up", size: "lg" },
  { id: "consumer-products", name: "Consumer Products", heatmapName: "Consumer \nProducts", changeAmount: "+20.00", changePercent: "+0.61%", trend: "up", size: "md" },
  { id: "agro-food", name: "Agro & Food Industry", heatmapName: "Agro & \nFood \nIndustry", changeAmount: "-20.00", changePercent: "-1.58%", trend: "down", size: "md" },
  { id: "financials", name: "Financials", changeAmount: "0.00", changePercent: "0.00", trend: "flat", size: "sm" },
  { id: "technology", name: "Technology", changeAmount: "0.00", changePercent: "0.00", trend: "flat", size: "sm" },
  { id: "property-construction", name: "Property & Construction", changeAmount: "0.00", changePercent: "0.00", trend: "flat", size: "sm" },
];

export type ServiceCard = {
  id: string;
  title: string;
  desc: string;
  /** Path to the rotated "Investment account" card mockup (or the Robo
   *  Advisory mascot) exported straight from Figma — see `services/` under
   *  `public/products/stock`. */
  mockup: string;
  mockupWidth: number;
  mockupHeight: number;
  /** Soft radial glow. `null` hides it (Robo / illustrated cards). */
  blob?: string | null;
  gradient?: string;
  mockupBottom?: number;
  mockupRight?: number;
  mockupMixBlend?: "screen";
  mockupOpacity?: number;
};

export const ESSENTIAL_SERVICES: ServiceCard[] = [
  {
    id: "cash-balance",
    title: "Cash Balance",
    desc: 'An investment account for Thai stocks that is suitable for all investors, with the concept of "invest as much as you deposit"',
    mockup: "/products/stock/services/mockup-cash-balance.png",
    mockupWidth: 102,
    mockupHeight: 73,
  },
  {
    id: "cash",
    title: "Cash",
    desc: "Deposit a minimum of 20% of the security's value in cash or collateral to settle the remaining balance.",
    mockup: "/products/stock/services/mockup-cash.png",
    mockupWidth: 102,
    mockupHeight: 73,
  },
  {
    id: "credit-balance",
    title: "Credit Balance",
    desc: "Borrow funds to purchase securities with a margin account. Just place a minimum of cash or other securities as collateral.",
    mockup: "/products/stock/services/mockup-credit-balance.png",
    mockupWidth: 102,
    mockupHeight: 73,
  },
  {
    id: "robo-advisory",
    title: "Robo Advisory",
    desc: "Achieve your investment goals with ease using our AI-driven automated investment service.",
    mockup: "/products/stock/services/robo-mascot.png",
    mockupWidth: 75,
    mockupHeight: 97,
    blob: null,
    gradient: "linear-gradient(to right, #ffffff, #c7e8f3)",
    mockupBottom: -15,
    mockupRight: 13,
  },
];

export type MarketId = "th" | "us";
/** Treemap packing for the industry-sector card. A market that reports two or
 *  fewer sectors ignores this and falls back to Figma's "Heat map เมื่อมีแค่ 2
 *  Sectors" permutation (node 25177:23062) — see `SectorHeatmap`. */
export type HeatmapLayout = "treemap-8" | "treemap-us";
/** Sector taxonomies that have drill-in pages. `industrials` and `financials`
 *  exist in both, so US routes carry a `us-` slug prefix to disambiguate —
 *  see `industrySectorHref` in `stock-industry-sector-data.ts`. */
export type IndustrySectorMarket = "th" | "us";

const US_LOGOS: Record<string, string> = {
  AAPL: "/products/stock/logos/aapl.svg",
  TSLA: "/products/stock/logos/tsla.svg",
  MSFT: "/products/stock/logos/msft.svg",
  GOOGL: "/products/stock/logos/googl.svg",
  AMZN: "/products/stock/logos/amzn.svg",
};

function usStockRows(
  entries: [symbol: string, name: string, price: string, changeAmount: string, changePercent: string, trend: Trend, featured?: boolean][],
): StockRow[] {
  return entries.map(([symbol, name, price, changeAmount, changePercent, trend, featured]) => ({
    symbol,
    name,
    price,
    changeAmount,
    changePercent,
    trend,
    featured,
    logo: US_LOGOS[symbol],
    series: seededSeries("US" + symbol + price + changeAmount, 16, trend),
  }));
}

export const US_MARKET_INDICES: MarketIndex[] = [
  { code: "Dow Jones", icon: "/products/stock/logos/indices/dow.svg", price: "120.00", changeAmount: "-24.00", changePercent: "-20.00%", trend: "down", series: seededSeries("DJIA", 20, "down") },
  { code: "S&P 500", icon: "/products/stock/logos/indices/spx.svg", price: "120.00", changeAmount: "+0.73", changePercent: "+0.61%", trend: "up", series: seededSeries("SPX", 20, "up") },
  { code: "Nasdaq 100", icon: "/products/stock/logos/indices/ndx.svg", price: "120.00", changeAmount: "0.00", changePercent: "0.00%", trend: "flat", series: seededSeries("NDX", 20, "flat") },
  { code: "HSI", icon: "/products/stock/logos/indices/hsi.svg", price: "120.00", changeAmount: "-24.00", changePercent: "-20.00%", trend: "down", series: seededSeries("HSI", 20, "down") },
  { code: "HOSE", icon: "/products/stock/logos/indices/hose.svg", price: "120.00", changeAmount: "0.00", changePercent: "0.00%", trend: "flat", series: seededSeries("HOSE", 20, "flat") },
  { code: "TSX", icon: "/products/stock/logos/indices/tsx.svg", price: "120.00", changeAmount: "+0.73", changePercent: "+0.61%", trend: "up", series: seededSeries("TSX", 20, "up") },
];

export const US_STOCK_TOP_GAIN: StockRow[] = usStockRows([
  ["AAPL", "Apple Inc. Common Stock", "145.67", "+15.50", "+0.61%", "up"],
  ["TSLA", "Tesla, Inc. Common Stock", "210.30", "+30.00", "+0.61%", "up", true],
  ["MSFT", "Microsoft Corporation Common Stock", "300.50", "+25.00", "+0.61%", "up"],
  ["GOOGL", "Alphabet Inc. Class A Common Stock", "2800.00", "+50.00", "+0.61%", "up"],
  ["AMZN", "Amazon.com, Inc. Common Stock", "3500.00", "+40.00", "+0.61%", "up", true],
]);

export const US_STOCK_TOP_LOSS: StockRow[] = usStockRows([
  ["AMZN", "Amazon.com, Inc. Common Stock", "3500.00", "-20.00", "-20.00%", "down", true],
  ["MSFT", "Microsoft Corporation Common Stock", "300.50", "-20.00", "-20.00%", "down"],
  ["GOOGL", "Alphabet Inc. Class A Common Stock", "2800.00", "-20.00", "-20.00%", "down"],
  ["TSLA", "Tesla, Inc. Common Stock", "210.30", "-20.00", "-20.00%", "down", true],
  ["AAPL", "Apple Inc. Common Stock", "145.67", "-20.00", "-20.00%", "down"],
]);

export const US_STOCK_TOP_PICK: StockRow[] = usStockRows([
  ["GOOGL", "Alphabet Inc. Class A Common Stock", "2800.00", "+50.00", "+0.61%", "up"],
  ["TSLA", "Tesla, Inc. Common Stock", "210.30", "-20.00", "-20.00%", "down", true],
  ["AAPL", "Apple Inc. Common Stock", "145.67", "+15.50", "+0.61%", "up"],
  ["MSFT", "Microsoft Corporation Common Stock", "300.50", "0.00", "0.00%", "flat"],
  ["AMZN", "Amazon.com, Inc. Common Stock", "3500.00", "-20.00", "-20.00%", "down", true],
]);

export const US_ETF_TOP_GAIN: CrossSellRow[] = crossSellRows("ETF", [
  ["QQQM", "Invesco NASDAQ 100 ETF", "128.10", "+22.50", "+0.61%", "up", "USD"],
  ["VOO", "Vanguard S&P 500 ETF NYSEARCA: VOO", "150.00", "+20.00", "+0.61%", "up", "USD"],
  ["2828.HK", "Hang Seng China Enterprises Index ETF", "125.00", "+20.00", "+0.61%", "up", "HKD"],
  ["2828.HK", "Hang Seng China Enterprises Index ETF", "135.75", "+15.30", "+0.61%", "up", "HKD"],
  ["2828.HK", "Hang Seng China Enterprises Index ETF", "142.50", "+18.90", "+0.61%", "up", "HKD"],
]);

export const US_ETF_TOP_LOSS: CrossSellRow[] = crossSellRows("ETF", [
  ["QQQM", "Invesco NASDAQ 100 ETF", "128.10", "-20.00", "-20.00%", "down", "USD"],
  ["VOO", "Vanguard S&P 500 ETF NYSEARCA: VOO", "150.00", "-20.00", "-20.00%", "down", "USD"],
  ["2828.HK", "Hang Seng China Enterprises Index ETF", "125.00", "-20.00", "-20.00%", "down", "HKD"],
  ["2828.HK", "Hang Seng China Enterprises Index ETF", "135.75", "-20.00", "-20.00%", "down", "HKD"],
  ["2828.HK", "Hang Seng China Enterprises Index ETF", "142.50", "-20.00", "-20.00%", "down", "HKD"],
]);

export const US_INDUSTRY_SECTORS: SectorRow[] = [
  { id: "energy", name: "Energy", heatmapName: "Resources", changeAmount: "+20.00", changePercent: "+0.61%", trend: "up", size: "lg" },
  { id: "material", name: "Material", heatmapName: "Services", changeAmount: "-20.00", changePercent: "-10.58%", trend: "down", size: "lg", listAccent: "teal" },
  { id: "industrials", name: "Industrials", changeAmount: "+20.00", changePercent: "+0.61%", trend: "up", size: "lg" },
  {
    id: "consumer-discretionary",
    name: "Consumer Discretionary",
    heatmapName: "Consumer \nDiscretionary",
    changeAmount: "+20.00",
    changePercent: "+0.61%",
    trend: "up",
    size: "md",
  },
  {
    id: "consumer-staples",
    name: "Consumer Staples",
    heatmapName: "Consumer\nStaples",
    changeAmount: "-20.00",
    changePercent: "-1.58%",
    trend: "down",
    size: "md",
    listAccent: "teal",
    heatmapChangePercent: "-10.58%",
    heatmapTrend: "down",
  },
  {
    id: "health-care",
    name: "Health Care",
    changeAmount: "-20.00",
    changePercent: "-1.58%",
    trend: "down",
    size: "md",
    listAccent: "teal",
    heatmapChangePercent: "-10.58%",
    heatmapTrend: "down",
  },
  { id: "financials", name: "Financials", changeAmount: "0.00", changePercent: "0.00", trend: "flat", size: "sm" },
  { id: "information-technology", name: "Information Technology", changeAmount: "0.00", changePercent: "0.00", trend: "flat", size: "sm" },
  {
    id: "communication-services",
    name: "Communication Services",
    heatmapName: "Communication\nServices",
    changeAmount: "+20.00",
    changePercent: "+0.61%",
    trend: "up",
    size: "md",
  },
  {
    id: "utilities",
    name: "Utilities",
    changeAmount: "-20.00",
    changePercent: "-1.58%",
    trend: "down",
    size: "sm",
    listAccent: "teal",
    heatmapChangePercent: "-10.58%",
    heatmapTrend: "down",
  },
  { id: "real-estate", name: "Real Estate", changeAmount: "0.00", changePercent: "0.00", trend: "flat", size: "sm" },
];

export const US_GLOBAL_SERVICES: ServiceCard[] = [
  {
    id: "global",
    title: "Global",
    desc: "Expand your investment opportunities with global securities across all supported currencies.",
    mockup: "/products/stock/services/mockup-global.png",
    mockupWidth: 102,
    mockupHeight: 73,
    blob: "/products/stock/services/bg-blob-global.svg",
  },
  {
    id: "dr",
    title: "DR",
    desc: "This Global Stocks is traded on the SET just like a Thai stock, expanding opportunities for Thai investors.",
    mockup: "/products/stock/services/mockup-dr.png",
    mockupWidth: 97,
    mockupHeight: 76,
    blob: "/products/stock/services/bg-blob-dr.svg",
    gradient: "linear-gradient(to right, #ffffff, #d4edff)",
    mockupBottom: -12,
    mockupRight: 0,
    mockupOpacity: 0.6,
  },
  {
    id: "etf",
    title: "ETF",
    desc: "Index fund listed on the stock exchange can be traded just like a single stock, with real-time pricing.",
    mockup: "/products/stock/services/mockup-etf-globe.png",
    mockupWidth: 110,
    mockupHeight: 110,
    blob: "/products/stock/services/bg-blob-etf.svg",
    gradient: "linear-gradient(to right, #ffffff, #ffd2d8)",
    mockupBottom: -40,
    mockupRight: -16,
    mockupMixBlend: "screen",
  },
];

export type MarketCatalog = {
  indices: MarketIndex[];
  indicesUpdatedAt: string;
  currency: string;
  topGain: StockRow[];
  topLoss: StockRow[];
  topPick: StockRow[];
  crossSell: "dr-etf" | "etf-gain-loss";
  etfGain: CrossSellRow[];
  etfLoss: CrossSellRow[];
  /** Exchange a quote from this board is listed on, and its mark — the badge
   *  beside the price on a stock's detail page. */
  exchange: string;
  exchangeIcon: string;
  sectors: SectorRow[];
  /** Heading of the industry-sector card. Every market currently ships the SET
   *  wording Figma specced; swap per catalog once the US/HK/VN copy lands. */
  sectorsTitle: string;
  /** Which sector taxonomy `sectors` belongs to — decides the drill-in route.
   *  HK/VN alias the Thai catalog, so they resolve to the SET pages too. */
  sectorsMarket: IndustrySectorMarket;
  heatmapLayout: HeatmapLayout;
  servicesTitle: string;
  servicesDesc: string;
  services: ServiceCard[];
};

const THAI_CATALOG: MarketCatalog = {
  indices: MARKET_INDICES,
  indicesUpdatedAt: MARKET_LATEST_UPDATE,
  currency: "THB",
  topGain: STOCK_TOP_GAIN,
  topLoss: STOCK_TOP_LOSS,
  topPick: STOCK_TOP_PICK,
  crossSell: "dr-etf",
  etfGain: STOCK_ETF_ROWS,
  etfLoss: STOCK_ETF_ROWS,
  exchange: "SET",
  exchangeIcon: "/products/stock/detail/set-circle.svg",
  sectors: SET_INDUSTRY_SECTORS,
  sectorsTitle: "SET Industry Sector",
  sectorsMarket: "th",
  heatmapLayout: "treemap-8",
  servicesTitle: "Essential Investment Services",
  servicesDesc: "Solutions that meet your needs. Unlock your investment potential with Yuanta.",
  services: ESSENTIAL_SERVICES,
};

const US_CATALOG: MarketCatalog = {
  indices: US_MARKET_INDICES,
  indicesUpdatedAt: "Latest update: 29 Apr 2025 - 16:00",
  currency: "USD",
  topGain: US_STOCK_TOP_GAIN,
  topLoss: US_STOCK_TOP_LOSS,
  topPick: US_STOCK_TOP_PICK,
  crossSell: "etf-gain-loss",
  etfGain: US_ETF_TOP_GAIN,
  etfLoss: US_ETF_TOP_LOSS,
  // Every US name this catalog ships (AAPL/TSLA/MSFT/GOOGL/AMZN) is Nasdaq-
  // listed, so the board can name one exchange. Move this onto the row once
  // the catalog carries NYSE-listed names too.
  exchange: "NASDAQ",
  exchangeIcon: "/products/stock/logos/indices/ndx.svg",
  sectors: US_INDUSTRY_SECTORS,
  sectorsTitle: "SET Industry Sector",
  sectorsMarket: "us",
  heatmapLayout: "treemap-us",
  servicesTitle: "Unlock new growth with Global stocks",
  servicesDesc: "Discover alternative ways to invest.",
  services: US_GLOBAL_SERVICES,
};

export const MARKET_CATALOG: Record<MarketId, MarketCatalog> = {
  th: THAI_CATALOG,
  us: US_CATALOG,
};
