/**
 * Drill-in model for the Stock tab's market-index cards (SET / SET50 / … and
 * the US board's Dow Jones / S&P 500 / …).
 *
 * Mirrors `stock-industry-sector-data.ts`: the index is the hero, its members
 * are the list. Numbers are mock, like the rest of the Stock tab.
 */

import {
  MARKET_CATALOG,
  seededSeries,
  STOCK_TOP_GAIN,
  STOCK_TOP_LOSS,
  US_STOCK_TOP_GAIN,
  US_STOCK_TOP_LOSS,
  type MarketId,
  type MarketIndex,
  type StockRow,
} from "./stock-data";

/**
 * Index slugs are prefixed so `/product-catalog/stock/<slug>` can tell them
 * apart from the stock symbols and sector ids that share that segment — "SET"
 * as a bare slug would be indistinguishable from a ticker.
 */
const INDEX_SLUG_PREFIX = "index-";

/** "S&P 500" → "s-p-500". Codes carry spaces and `&`, neither of which belongs
 *  in a path segment, and the display code is recovered from the catalog. */
const slugOf = (code: string) =>
  code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function marketIndexHref(code: string, market: MarketId = "th"): string {
  return `/product-catalog/stock/${INDEX_SLUG_PREFIX}${market}-${slugOf(code)}`;
}

/** Hero copy per index. Placeholder wording in the Stock tab's voice until the
 *  real descriptions are supplied — keyed by slug so both markets can collide
 *  on a code without clashing. */
const INDEX_DESCRIPTIONS: Record<string, string> = {
  set: "The SET Index tracks every common stock listed on the Stock Exchange of Thailand, weighted by market capitalisation — the broadest read on the Thai market.",
  set50: "The SET50 Index follows the 50 largest and most liquid names on the SET, the universe most Thai index funds and futures are built on.",
  set100: "The SET100 Index widens SET50 to the 100 leading listed companies, adding mid-caps while staying inside the liquid end of the market.",
  sset: "The sSET Index covers listed companies outside SET100 that still meet the exchange's liquidity and free-float rules — the small-cap end of the SET.",
  mai: "The MAI Index tracks the Market for Alternative Investment, where smaller and faster-growing Thai companies list ahead of a move to the SET.",
  "dow-jones": "The Dow Jones Industrial Average is a price-weighted average of 30 prominent US companies, the oldest widely followed gauge of the US market.",
  "s-p-500": "The S&P 500 tracks 500 leading US companies by market capitalisation and is the standard benchmark for US large-cap equity.",
  "nasdaq-100": "The Nasdaq 100 covers the largest non-financial companies listed on Nasdaq, weighted toward technology and growth.",
  hsi: "The Hang Seng Index tracks the largest companies listed in Hong Kong and is the primary benchmark for that market.",
  hose: "The HOSE Index covers companies listed on the Ho Chi Minh City Stock Exchange, Vietnam's main trading venue.",
  tsx: "The S&P/TSX Composite tracks the largest companies on the Toronto Stock Exchange, the headline benchmark for Canadian equity.",
};

/** Members cycle the market's own gain + loss rows, so a Thai index never shows
 *  US tickers and vice versa — same trick `getSectorStockBatch` uses. */
const INDEX_MEMBERS: Record<MarketId, StockRow[]> = {
  th: [...STOCK_TOP_GAIN, ...STOCK_TOP_LOSS],
  us: [...US_STOCK_TOP_GAIN, ...US_STOCK_TOP_LOSS],
};

export const INDEX_STOCK_PAGE_SIZE = 20;

/** Mock page of index members — cycles the source set so infinite scroll can keep appending. */
export function getIndexStockBatch(
  offset: number,
  count = INDEX_STOCK_PAGE_SIZE,
  market: MarketId = "th",
): StockRow[] {
  const source = INDEX_MEMBERS[market];
  return Array.from({ length: count }, (_, i) => {
    const row = source[(offset + i) % source.length];
    return {
      ...row,
      series: seededSeries(`index-${row.symbol}-${offset + i}`, 20, row.trend),
    };
  });
}

export type MarketIndexPage = {
  market: MarketId;
  /** Back-header copy — names the board the index came from. */
  title: string;
  index: MarketIndex;
  /** Every index on the same board, for the drill-in's tab strip. */
  indices: MarketIndex[];
  description: string;
  stocks: StockRow[];
  /** Total members — the "50 Lists" counter. Mock until a real total ships. */
  totalCount: number;
  updatedAt: string;
};

const BOARD_TITLE: Record<MarketId, string> = {
  th: "Thai Market Index",
  us: "Global Market Index",
};

/** Resolves an `index-<market>-<code>` slug, or null so the route can fall
 *  through to the sector and stock-quote lookups. */
export function getMarketIndexPage(slug: string): MarketIndexPage | null {
  if (!slug.startsWith(INDEX_SLUG_PREFIX)) return null;
  const rest = slug.slice(INDEX_SLUG_PREFIX.length);
  const separator = rest.indexOf("-");
  if (separator < 0) return null;

  const market = rest.slice(0, separator) as MarketId;
  const catalog = MARKET_CATALOG[market];
  if (!catalog) return null;

  const codeSlug = rest.slice(separator + 1);
  const index = catalog.indices.find((i) => slugOf(i.code) === codeSlug);
  if (!index) return null;

  return {
    market,
    title: BOARD_TITLE[market],
    index,
    indices: catalog.indices,
    description: INDEX_DESCRIPTIONS[codeSlug] ?? "",
    stocks: getIndexStockBatch(0, INDEX_STOCK_PAGE_SIZE, market),
    totalCount: 50,
    updatedAt: catalog.indicesUpdatedAt,
  };
}
