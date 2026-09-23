import {
  MARKET_LATEST_UPDATE,
  SET_INDUSTRY_SECTORS,
  US_INDUSTRY_SECTORS,
  US_STOCK_TOP_GAIN,
  US_STOCK_TOP_LOSS,
  seededSeries,
  type IndustrySectorMarket,
  type SectorRow,
  type StockRow,
  type Trend,
} from "./stock-data";

export type { IndustrySectorMarket };

/** Thai sectors keep their bare slug so existing `/product-catalog/stock/<id>`
 *  URLs stay valid; US ones are prefixed because `industrials` and
 *  `financials` are ids in BOTH taxonomies and would otherwise collide. */
const US_SLUG_PREFIX = "us-";

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

/** GICS counterpart of `SET_SECTOR_DESCRIPTIONS` — placeholder copy in the same
 *  voice until the US wording is supplied. */
export const US_SECTOR_DESCRIPTIONS: Record<string, string> = {
  energy:
    "Energy businesses cover a wide range of activities, such as exploration, production, transportation, distribution, and the use of energy from various sources.",
  material:
    "Materials companies extract and process the chemicals, metals, and building inputs that every other sector's supply chain is built on.",
  industrials:
    "Industrial companies manufacture and distribute capital goods, machinery, and infrastructure inputs that enable production across other sectors.",
  "consumer-discretionary":
    "Consumer discretionary businesses sell the goods and services households buy once essentials are covered — retail, autos, travel, and leisure.",
  "consumer-staples":
    "Consumer staples companies supply food, beverages, and household essentials whose demand holds up across the economic cycle.",
  "health-care":
    "Health care spans pharmaceuticals, biotechnology, medical devices, and the providers that deliver care to patients.",
  financials:
    "Financial institutions provide banking, insurance, asset management, and capital-market services that channel savings into investment.",
  "information-technology":
    "Information technology companies build the software, semiconductors, and hardware that digital infrastructure runs on.",
  "communication-services":
    "Communication services combine telecom carriers with the media, entertainment, and interactive platforms that reach audiences at scale.",
  utilities:
    "Utilities generate and distribute electricity, gas, and water under regulated models that prize steady, predictable cash flow.",
  "real-estate":
    "Real estate companies own, develop, and manage income-producing property, including the REITs that package it for investors.",
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

/** US drill-ins reuse the catalog's US tickers (logos included) so a US sector
 *  page never shows Thai symbols. Gain + loss gives the same 10-row cycle. */
const US_SECTOR_STOCKS: StockRow[] = [...US_STOCK_TOP_GAIN, ...US_STOCK_TOP_LOSS];

export const SECTOR_STOCK_PAGE_SIZE = 20;

/** Mock page of sector stocks — cycles the Figma 10-row set so infinite scroll can keep appending. */
export function getSectorStockBatch(
  offset: number,
  count = SECTOR_STOCK_PAGE_SIZE,
  market: IndustrySectorMarket = "th",
): StockRow[] {
  const source = market === "us" ? US_SECTOR_STOCKS : RESOURCES_STOCKS;
  return Array.from({ length: count }, (_, i) => {
    const row = source[(offset + i) % source.length];
    return {
      ...row,
      series: seededSeries(`sector-${row.symbol}-${offset + i}`, 20, row.trend),
    };
  });
}

export type IndustrySectorPage = {
  market: IndustrySectorMarket;
  /** Back-header copy. Both markets ship the SET wording for now — mirrors
   *  `MarketCatalog.sectorsTitle`; swap together once US copy lands. */
  title: string;
  sector: SectorRow;
  sectors: SectorRow[];
  description: string;
  stocks: StockRow[];
  /** Total instruments in the sector — the "260 Lists" counter. Mock until the
   *  real total ships alongside the paged endpoint. */
  totalCount: number;
  updatedAt: string;
};

/** Resolves a drill-in slug against whichever taxonomy it names — a bare id is
 *  a SET sector, a `us-`-prefixed one a GICS sector. Returns null for unknown
 *  slugs so the route can fall through to the stock-quote lookup. */
export function getIndustrySectorPage(slug: string): IndustrySectorPage | null {
  const isUs = slug.startsWith(US_SLUG_PREFIX);
  const sectorId = isUs ? slug.slice(US_SLUG_PREFIX.length) : slug;
  const sectors = isUs ? US_INDUSTRY_SECTORS : SET_INDUSTRY_SECTORS;
  const descriptions = isUs ? US_SECTOR_DESCRIPTIONS : SET_SECTOR_DESCRIPTIONS;
  const fallback = isUs ? US_SECTOR_DESCRIPTIONS.energy : SET_SECTOR_DESCRIPTIONS.resources;

  const sector = sectors.find((s) => s.id === sectorId);
  if (!sector) return null;

  const market: IndustrySectorMarket = isUs ? "us" : "th";
  return {
    market,
    title: "SET Industry Sector",
    sector,
    sectors,
    description: descriptions[sectorId] ?? fallback,
    stocks: getSectorStockBatch(0, SECTOR_STOCK_PAGE_SIZE, market),
    totalCount: 260,
    updatedAt: MARKET_LATEST_UPDATE,
  };
}

export function industrySectorHref(sectorId: string, market: IndustrySectorMarket = "th"): string {
  const slug = market === "us" ? `${US_SLUG_PREFIX}${sectorId}` : sectorId;
  return `/product-catalog/stock/${encodeURIComponent(slug)}`;
}
