import {
  MARKET_CATALOG,
  MARKET_STATUS,
  seededSeries,
  type MarketStatusValue,
  type StockRow,
  type Trend,
} from "./stock-data";
import { getSectorStockBatch } from "./stock-industry-sector-data";
import { TOP_PICKS, type StructuredProduct } from "./structured-product-data";
import { THAI_STRUCTURED_PRODUCTS, type ThaiStructuredProduct } from "./thai-structured-data";
import { FIXED_INCOME_BONDS, type FixedIncomeBond } from "./fixed-income-data";
import { TOP_PICK_ROWS, type GlobalBondRow } from "./global-bond-data";
import { getTopPerformers, type MutualFund } from "./mutual-fund-data";

export const STOCK_DETAIL_TABS = [
  "Market Info",
  "Related Product",
  "Company",
  "Research",
  "Technical",
  "News",
] as const;

export type StockDetailTab = (typeof STOCK_DETAIL_TABS)[number];

export const STOCK_CHART_RANGES = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y"] as const;

export type StockChartRange = (typeof STOCK_CHART_RANGES)[number];

export type QuotePoint = {
  t: number;
  price: number;
};

export type OrderBookLevel = {
  volume: string;
  price: string;
  /** Bar width as a percent of the bid/offer column. */
  barPct: number;
};

export type TimeSalesRow = {
  time: string;
  price: string;
  priceTone: "up" | "down";
  volume: string;
  volumeTone: "up" | "down";
  side: "Buy" | "Sell";
};

export type AdvanceStat = { label: string; value: string };

/** Figma node 23933:37281 — "Advance Data" modal opened from the quote stats pill. */
export type StockAdvanceData = {
  rangeLow: string;
  rangeHigh: string;
  dayMarkLow: string;
  dayMarkHigh: string;
  /** Blue 1D bar start/width as a percent of the 52-week track (Figma 68/399, 78/399). */
  dayBarLeftPct: number;
  dayBarWidthPct: number;
  left: AdvanceStat[];
  right: AdvanceStat[];
};

export type StockProductDetail = {
  symbol: string;
  name: string;
  featured: boolean;
  status: MarketStatusValue;
  price: string;
  currency: string;
  changeAmount: string;
  changePercent: string;
  trend: Trend;
  lastUpdated: string;
  volume: string;
  value: string;
  marketCap: string;
  dayLow: string;
  dayHigh: string;
  market: string;
  bestBid: { price: string; volume: string };
  bestOffer: { price: string; volume: string };
  bidLevels: OrderBookLevel[];
  offerLevels: OrderBookLevel[];
  trades: TimeSalesRow[];
  advance: StockAdvanceData;
};

export const RELATED_PRODUCT_KINDS = [
  "dr",
  "derivative",
  "structured",
  "thai-structured",
  "fixed-income",
  "global-bond",
  "mutual-fund",
] as const;

export type RelatedProductKind = (typeof RELATED_PRODUCT_KINDS)[number];

export const RELATED_PRODUCT_CHIP_LABEL: Record<RelatedProductKind, string> = {
  dr: "DR",
  derivative: "Derivative",
  structured: "Global Structured Product",
  "thai-structured": "Thai Structured Product",
  "fixed-income": "Fixed Income",
  "global-bond": "Global Bond",
  "mutual-fund": "Mutual Fund",
};

const DEPTH_VOLUME = "3,129,800";
const DEPTH_PRICE = "49.50";

/** Figma node 23923:56776 — 10-row depth, bar widths sampled from the frame. */
const DEPTH_BAR_PCTS: [bid: number, offer: number][] = [
  [67, 67],
  [58, 58],
  [61, 61],
  [45, 45],
  [40, 40],
  [45, 45],
  [28, 28],
  [23, 44],
  [16, 28],
  [10, 49],
];

function depthLevels(side: "bid" | "offer"): OrderBookLevel[] {
  return DEPTH_BAR_PCTS.map(([bid, offer]) => ({
    volume: DEPTH_VOLUME,
    price: DEPTH_PRICE,
    barPct: side === "bid" ? bid : offer,
  }));
}

/** Figma node 23923:56893 — Time & Sales, 10 ticks. */
const FIGMA_TRADES: TimeSalesRow[] = [
  { time: "03:40:53", price: "50.50", priceTone: "up", volume: "10", volumeTone: "up", side: "Buy" },
  { time: "03:40:53", price: "50.75", priceTone: "up", volume: "10", volumeTone: "up", side: "Buy" },
  { time: "03:40:53", price: "50.50", priceTone: "up", volume: "10", volumeTone: "up", side: "Buy" },
  { time: "03:40:53", price: "50.75", priceTone: "up", volume: "10", volumeTone: "down", side: "Buy" },
  { time: "03:40:53", price: "50.50", priceTone: "up", volume: "10", volumeTone: "down", side: "Sell" },
  { time: "03:40:53", price: "50.75", priceTone: "up", volume: "10", volumeTone: "down", side: "Sell" },
  { time: "03:40:53", price: "50.50", priceTone: "up", volume: "10", volumeTone: "up", side: "Buy" },
  { time: "03:40:53", price: "50.75", priceTone: "up", volume: "10", volumeTone: "up", side: "Buy" },
  { time: "03:40:53", price: "50.25", priceTone: "down", volume: "10", volumeTone: "up", side: "Buy" },
  { time: "03:40:53", price: "50.00", priceTone: "down", volume: "10", volumeTone: "down", side: "Sell" },
];

/** Figma node 21136:109579 — CPALL Market Info. */
export const CPALL_PRODUCT_DETAIL: StockProductDetail = {
  symbol: "CPALL",
  name: "CP ALL PUBLIC COMPANY LIMITED",
  featured: true,
  status: "Open",
  price: "50.50",
  currency: "THB",
  changeAmount: "-0.50",
  changePercent: "0.98%",
  trend: "down",
  lastUpdated: "Last updated: 30 April 2026 - 09:22",
  volume: "31.10M",
  value: "1.57B",
  marketCap: "458.13B",
  dayLow: "50.25",
  dayHigh: "51.25",
  market: "SET",
  bestBid: { price: "67.00", volume: "1,882,900" },
  bestOffer: { price: "60.00", volume: "11,100" },
  bidLevels: depthLevels("bid"),
  offerLevels: depthLevels("offer"),
  trades: FIGMA_TRADES,
  advance: {
    rangeLow: "51.40",
    rangeHigh: "53.15",
    dayMarkLow: "51.80",
    dayMarkHigh: "51.80",
    dayBarLeftPct: 17,
    dayBarWidthPct: 19.5,
    left: [
      { label: "Volume", value: "38.97M" },
      { label: "Open1", value: "50.25" },
      { label: "Floor", value: "34.00" },
      { label: "Avg Vol (10D)", value: "32.57M" },
      { label: "52 Week Low", value: "49.75" },
      { label: "Turnover Ratio", value: "0.73%" },
      { label: "%Free Float", value: "57.18%" },
      { label: "Lot Size", value: "100.00" },
      { label: "P/E", value: "18.05" },
      { label: "Dividend", value: "1.35" },
      { label: "Margin Rate", value: "-" },
    ],
    right: [
      { label: "Value", value: "2.02B" },
      { label: "PreClose", value: "51.25" },
      { label: "Ceilling", value: "69.50" },
      { label: "Mkt Cap", value: "460.38B" },
      { label: "52 Week High", value: "68.00" },
      { label: "Turnover", value: "1.87B" },
      { label: "Free Float", value: "5.14B" },
      { label: "Total Shares", value: "8.98B" },
      { label: "P/B", value: "3.84" },
      { label: "Dividend Yield", value: "2.70%" },
    ],
  },
};

function bangkok(isoLocal: string): number {
  return Date.parse(`${isoLocal}+07:00`);
}

/** Intraday polyline that lands on Figma's tooltip (3 May 2025 - 14:28 / 55.00). */
const INTRADAY_KEYS: [iso: string, price: number][] = [
  ["2025-05-03T13:30:00", 52.2],
  ["2025-05-03T13:38:00", 54.35],
  ["2025-05-03T13:45:00", 52.4],
  ["2025-05-03T13:50:00", 50.25],
  ["2025-05-03T13:55:00", 51.05],
  ["2025-05-03T14:00:00", 50.85],
  ["2025-05-03T14:06:00", 52.65],
  ["2025-05-03T14:15:00", 52.85],
  ["2025-05-03T14:22:00", 55.0],
  ["2025-05-03T14:28:00", 55.0],
  ["2025-05-03T14:35:00", 53.35],
  ["2025-05-03T14:42:00", 55.55],
  ["2025-05-03T14:48:00", 54.2],
  ["2025-05-03T14:52:00", 54.65],
  ["2025-05-03T15:00:00", 50.5],
];

function interpolateIntraday(lastPrice: number): QuotePoint[] {
  const keys = INTRADAY_KEYS.map(([iso, price]) => ({
    t: bangkok(iso),
    price,
  }));
  const scale = lastPrice / keys[keys.length - 1].price;
  const out: QuotePoint[] = [];
  const step = 2 * 60 * 1000;
  for (let t = keys[0].t; t <= keys[keys.length - 1].t; t += step) {
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1].t < t) i += 1;
    const a = keys[i];
    const b = keys[Math.min(i + 1, keys.length - 1)];
    const span = b.t - a.t || 1;
    const p = a.price + ((b.price - a.price) * (t - a.t)) / span;
    out.push({ t, price: p * scale });
  }
  if (out[out.length - 1]?.t !== keys[keys.length - 1].t) {
    out.push({ t: keys[keys.length - 1].t, price: lastPrice });
  }
  return out;
}

const RANGE_POINTS: Record<Exclude<StockChartRange, "1D">, number> = {
  "5D": 5,
  "1M": 22,
  "6M": 26,
  YTD: 18,
  "1Y": 24,
  "5Y": 60,
};

function parsePrice(value: string): number {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 50.5;
}

export function getStockQuoteHistory(
  detail: StockProductDetail,
  range: StockChartRange,
): QuotePoint[] {
  const last = parsePrice(detail.price);
  if (range === "1D") return interpolateIntraday(last);

  const count = RANGE_POINTS[range];
  const series = seededSeries(`${detail.symbol}-${range}`, count, detail.trend);
  const k = last / (series[series.length - 1] || 1);
  const end = bangkok("2025-05-03T15:00:00");
  const day = 86400000;
  const step =
    range === "5D" ? day : range === "1M" ? day : range === "5Y" ? day * 30 : day * 7;
  return series.map((v, i) => ({
    t: end - (count - 1 - i) * step,
    price: v * k,
  }));
}

function knownStockRows(): StockRow[] {
  const rows: StockRow[] = [];
  for (const market of Object.values(MARKET_CATALOG)) {
    rows.push(...market.topGain, ...market.topLoss, ...market.topPick);
  }
  rows.push(...getSectorStockBatch(0, 10));
  return rows;
}

function fromRow(row: StockRow, currency: string): StockProductDetail {
  const last = parsePrice(row.price);
  const dayPad = Math.max(0.25, last * 0.01);
  return {
    ...CPALL_PRODUCT_DETAIL,
    symbol: row.symbol,
    name: row.name,
    featured: Boolean(row.featured),
    status: MARKET_STATUS,
    price: row.price,
    currency,
    changeAmount: row.changeAmount,
    changePercent: row.changePercent.replace(/^[+-]/, ""),
    trend: row.trend,
    dayLow: (last - dayPad).toFixed(2),
    dayHigh: (last + dayPad).toFixed(2),
  };
}

export function getStockProductDetail(id: string): StockProductDetail | null {
  const key = id.trim();
  if (!key) return null;
  if (key.toUpperCase() === CPALL_PRODUCT_DETAIL.symbol) return CPALL_PRODUCT_DETAIL;

  for (const market of Object.values(MARKET_CATALOG)) {
    const match = [...market.topGain, ...market.topLoss, ...market.topPick].find(
      (row) => row.symbol.toUpperCase() === key.toUpperCase(),
    );
    if (match) {
      return fromRow(match, market.currency);
    }
  }

  const sectorMatch = knownStockRows().find(
    (row) => row.symbol.toUpperCase() === key.toUpperCase(),
  );
  return sectorMatch ? fromRow(sectorMatch, "THB") : null;
}

export function stockProductHref(symbol: string): string {
  return `/product-catalog/stock/${encodeURIComponent(symbol)}`;
}

export type RelatedDrBundle = {
  yuanta: RelatedDrRow | null;
  others: RelatedDrRow[];
};

export type RelatedDerivativeBundle = {
  contracts: RelatedFutureContract[];
  totals: { volume: string; openInterest: string };
  updated: string;
};

/** Related products for a stock quote. Missing/empty fields are omitted from chips. */
export type RelatedProducts = {
  dr?: RelatedDrBundle;
  derivative?: RelatedDerivativeBundle;
  structured?: StructuredProduct[];
  thaiStructured?: ThaiStructuredProduct[];
  fixedIncome?: FixedIncomeBond[];
  globalBond?: GlobalBondRow[];
  mutualFund?: MutualFund[];
};

function hasDr(dr?: RelatedDrBundle): boolean {
  return Boolean(dr && (dr.yuanta || dr.others.length > 0));
}

export function relatedProductKinds(related: RelatedProducts | undefined): RelatedProductKind[] {
  if (!related) return [];
  const kinds: RelatedProductKind[] = [];
  if (hasDr(related.dr)) kinds.push("dr");
  if (related.derivative?.contracts.length) kinds.push("derivative");
  if (related.structured?.length) kinds.push("structured");
  if (related.thaiStructured?.length) kinds.push("thai-structured");
  if (related.fixedIncome?.length) kinds.push("fixed-income");
  if (related.globalBond?.length) kinds.push("global-bond");
  if (related.mutualFund?.length) kinds.push("mutual-fund");
  return kinds;
}

export type RelatedDrRow = {
  symbol: string;
  subtitle: string;
  price: string;
  changeAmount: string;
  changePercent: string;
  amountTone: "up" | "flat";
  series: number[];
};

export type RelatedFutureContract = {
  symbol: string;
  im: string;
  lastPrice: string;
  change: string;
  changePercent: string;
  lastTradingDay: string;
  open: string;
  high: string;
  low: string;
  volume: string;
  openInterest: string;
  settlementPrice: string;
};

/** Figma node 21136:114513 — Related Product / DR. */
export const RELATED_DR_YUANTA: RelatedDrRow = {
  symbol: "XIAOMI19",
  subtitle: "DR on XIAOMI Issued by YUANTA",
  price: "11.00",
  changeAmount: "+0.50",
  changePercent: "0.61%",
  amountTone: "up",
  series: seededSeries("related-dr-XIAOMI19", 12, "up"),
};

export const RELATED_DR_OTHERS: RelatedDrRow[] = [
  {
    symbol: "XIAOMI01",
    subtitle: "DR on XIAOMI Issued by BLS",
    price: "4.40",
    changeAmount: "-0.16",
    changePercent: "0.61%",
    amountTone: "up",
    series: seededSeries("related-dr-XIAOMI01", 12, "up"),
  },
  {
    symbol: "XIAOMI13",
    subtitle: "DR on XIAOMI Issued by KGI",
    price: "4.40",
    changeAmount: "-0.16",
    changePercent: "0.61%",
    amountTone: "up",
    series: seededSeries("related-dr-XIAOMI13", 12, "up"),
  },
  {
    symbol: "XIAOMI80",
    subtitle: "DR on XIAOMI Issued by KTB",
    price: "22.00",
    changeAmount: "0.00",
    changePercent: "0.61%",
    amountTone: "flat",
    series: seededSeries("related-dr-XIAOMI80", 12, "up"),
  },
];

/** Figma nodes 21195:68932 / 21195:69902 / 27745:78343 — Related Futures. */
export const RELATED_FUTURES: RelatedFutureContract[] = [
  {
    symbol: "CPALLM25",
    im: "4,025",
    lastPrice: "50.36",
    change: "+0.71",
    changePercent: "+1.43%",
    lastTradingDay: "27 June 68",
    open: "50.70",
    high: "51.00",
    low: "50.09",
    volume: "914",
    openInterest: "4,460",
    settlementPrice: "46.15",
  },
  {
    symbol: "CPALLU25",
    im: "4,190",
    lastPrice: "50.52",
    change: "+0.68",
    changePercent: "+0.31%",
    lastTradingDay: "27 June 68",
    open: "50.70",
    high: "51.00",
    low: "50.09",
    volume: "914",
    openInterest: "4,460",
    settlementPrice: "46.15",
  },
  {
    symbol: "CPALLZ25",
    im: "4,120",
    lastPrice: "50.57",
    change: "+1.19",
    changePercent: "+1.31%",
    lastTradingDay: "27 June 68",
    open: "50.70",
    high: "51.00",
    low: "50.09",
    volume: "914",
    openInterest: "4,460",
    settlementPrice: "46.15",
  },
  {
    symbol: "CPALLH26",
    im: "4,040",
    lastPrice: "0.00",
    change: "+13.10",
    changePercent: "+1.64%",
    lastTradingDay: "27 June 68",
    open: "50.70",
    high: "51.00",
    low: "50.09",
    volume: "914",
    openInterest: "4,460",
    settlementPrice: "46.15",
  },
];

export const RELATED_FUTURES_TOTALS = {
  volume: "3,656",
  openInterest: "17,840",
} as const;

export const RELATED_FUTURES_UPDATED = "Prices reflect only Auto-Matching trades. Last updated: 16 July2026 - 10:30";

const RELATED_DERIVATIVE: RelatedDerivativeBundle = {
  contracts: RELATED_FUTURES,
  totals: RELATED_FUTURES_TOTALS,
  updated: RELATED_FUTURES_UPDATED,
};

/** BBL mock — every related category present so chips can be exercised. */
const BBL_RELATED_PRODUCTS: RelatedProducts = {
  dr: { yuanta: RELATED_DR_YUANTA, others: RELATED_DR_OTHERS },
  derivative: RELATED_DERIVATIVE,
  structured: TOP_PICKS.slice(0, 2),
  thaiStructured: THAI_STRUCTURED_PRODUCTS.slice(0, 3),
  fixedIncome: FIXED_INCOME_BONDS.slice(0, 3),
  globalBond: TOP_PICK_ROWS.slice(0, 3),
  mutualFund: getTopPerformers("global-equity").slice(0, 3),
};

/**
 * Related products for a quote. Absent/empty categories are omitted so chips
 * only render when the backend (mocked here) actually returned that type.
 *
 * Mock shapes:
 * - BBL: every catalog type (DR, Derivative, GSP, TSP, FI, Global Bond, MF)
 * - ADVANC: DR only
 * - others (including CPALL): Derivative only
 */
export function getRelatedProducts(symbol: string): RelatedProducts {
  const key = symbol.toUpperCase();
  if (key === "BBL") return BBL_RELATED_PRODUCTS;
  if (key === "ADVANC") {
    return { dr: { yuanta: RELATED_DR_YUANTA, others: RELATED_DR_OTHERS } };
  }
  return { derivative: RELATED_DERIVATIVE };
}
