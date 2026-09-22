import {
  MARKET_LATEST_UPDATE,
  SET_INDUSTRY_SECTORS,
  seededSeries,
  type SectorRow,
  type StockRow,
  type Trend,
} from "./stock-data";

/** Figma node 22907:35362 — sector hero copy (Resources); others are placeholders until copy is supplied. */
export const SET_SECTOR_DESCRIPTIONS: Record<string, string> = {
  resources:
    "Energy businesses cover a wide range of activities, such as exploration, production, transportation, distribution, and the use of energy from various sources.",
  services:
    "Service-sector companies provide intangible offerings — from logistics and hospitality to professional and consumer services that support the broader economy.",
  industrials:
    "Industrial companies manufacture and distribute capital goods, machinery, and infrastructure inputs that enable production across other sectors.",
  "consumer-products":
    "Consumer products businesses design, manufacture, and retail goods purchased by households for daily use and discretionary spending.",
  "agro-food":
    "Agro & food industry companies span farming, food processing, and agricultural supply chains that feed domestic and export markets.",
  financials:
    "Financial institutions provide banking, insurance, asset management, and capital-market services that channel savings into investment.",
  technology:
    "Technology companies develop software, hardware, and digital platforms that drive innovation across industries and consumer life.",
  "property-construction":
    "Property & construction firms develop real estate, build infrastructure, and manage assets tied to housing and commercial space.",
};

/** Figma "Resource" desktop frame — 10 large asset cards in the Resources tab (node 22907:35416). */
function resourcesSectorStocks(): StockRow[] {
  const rows: [string, string, string, string, string, Trend][] = [
    ["BANPU", "BANPU PUBLIC COMPANY LIMITED", "128.10", "+22.50", "+0.61%", "up"],
    ["BGRIM", "B.GRIMM POWER PUBLIC COMPANY LIMITED", "120.00", "0.00", "0.00", "flat"],
    ["EGCO", "ELECTRICITY GENERATING PUBLIC COMPANY LIMITED", "128.10", "+22.50", "+0.61%", "up"],
    ["EA", "ENERGY ABSOLUTE PUBLIC COMPANY LIMITED", "128.10", "-20.00", "-20.00%", "down"],
    ["PTG", "PTG ENERGY PUBLIC COMPANY LIMITED", "128.10", "+22.50", "+0.61%", "up"],
    ["GREEN", "GREEN RESOURCES PUBLIC COMPANY LIMITED", "128.10", "-20.00", "-20.00%", "down"],
    ["GULF", "GULF DEVELOPMENT PUBLIC COMPANY LIMITED", "128.10", "-20.00", "-20.00%", "down"],
    ["KBSPIF", "KHONBURI SUGAR POWER PLANT INFRASTRUCTURE FUND", "128.10", "+22.50", "+0.61%", "up"],
    ["MDX", "M.D.X. PUBLIC COMPANY LIMITED", "128.10", "+22.50", "+0.61%", "up"],
    ["TCC", "THAI CAPITAL CORPORATION PUBLIC COMPANY LIMITED", "120.00", "0.00", "0.00", "flat"],
  ];
  return rows.map(([symbol, name, price, changeAmount, changePercent, trend]) => ({
    symbol,
    name,
    price,
    changeAmount,
    changePercent,
    trend,
    series: seededSeries(`sector-${symbol}`, 20, trend),
  }));
}

const RESOURCES_STOCKS = resourcesSectorStocks();

export const SECTOR_STOCK_PAGE_SIZE = 20;

/** Mock page of sector stocks — cycles the Figma 10-row set so infinite scroll can keep appending. */
export function getSectorStockBatch(offset: number, count = SECTOR_STOCK_PAGE_SIZE): StockRow[] {
  const source = RESOURCES_STOCKS;
  return Array.from({ length: count }, (_, i) => {
    const row = source[(offset + i) % source.length];
    return {
      ...row,
      series: seededSeries(`sector-${row.symbol}-${offset + i}`, 20, row.trend),
    };
  });
}

export type SetIndustrySectorPage = {
  sector: SectorRow;
  sectors: SectorRow[];
  description: string;
  stocks: StockRow[];
  updatedAt: string;
};

export function getSetIndustrySectorPage(sectorId: string): SetIndustrySectorPage | null {
  const sector = SET_INDUSTRY_SECTORS.find((s) => s.id === sectorId);
  if (!sector) return null;
  return {
    sector,
    sectors: SET_INDUSTRY_SECTORS,
    description: SET_SECTOR_DESCRIPTIONS[sectorId] ?? SET_SECTOR_DESCRIPTIONS.resources,
    stocks: getSectorStockBatch(0),
    updatedAt: MARKET_LATEST_UPDATE,
  };
}

export function setIndustrySectorHref(sectorId: string): string {
  return `/product-catalog/stock/${encodeURIComponent(sectorId)}`;
}
