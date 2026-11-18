/**
 * Product Catalog → Product Trending: what is actually selling, ranked.
 *
 * Mock sales figures, real products. The names, ids and detail targets are
 * pulled from the same datasets the individual catalog tabs render, so every
 * row here links somewhere that exists — when a product is renamed or dropped,
 * this list follows instead of rotting into a page of dead links. Only the
 * money is invented: `SALES_LADDER` below.
 *
 * Portfolio Advisory is deliberately absent — it sells plans built per client,
 * not units off a shelf, so it has no "best seller" to rank. TFEX is absent
 * too, for the plainer reason that the catalog has no TFEX products yet.
 */
import {
  FIXED_INCOME_BONDS,
  fixedIncomeBookableId,
  type FixedIncomeBond,
} from "./fixed-income-data";
import {
  GLOBAL_BOND_ISSUERS,
  globalBondBookableId,
  type GlobalBondIssuerId,
  type GlobalBondRow,
} from "./global-bond-data";
import { getTopPerformers } from "./mutual-fund-data";
import { STOCK_TOP_PICK, type Trend } from "./stock-data";
import { getSectorStockBatch } from "./stock-industry-sector-data";
import {
  STRUCTURED_PRODUCTS,
  TOP_PICKS,
  type StructuredProduct,
} from "./structured-product-data";
import {
  THAI_STRUCTURED_PRODUCTS,
  thaiBookableId,
  type ThaiStructuredProduct,
} from "./thai-structured-data";

/** Where a trending row goes when clicked. Mirrors `CatalogNavigation`'s
 *  callbacks so the tab can hand each kind to the handler that already knows
 *  how to open it — in the full-page catalog *and* in the client-detail
 *  embedding, which opens details inline rather than routing. */
export type TrendingTarget =
  | { kind: "stock"; symbol: string }
  | { kind: "mutual-fund"; fundId: string }
  | { kind: "fixed-income"; bond: FixedIncomeBond }
  | { kind: "thai-structured"; product: ThaiStructuredProduct }
  | { kind: "structured"; product: StructuredProduct }
  | { kind: "global-bond"; issuerId: GlobalBondIssuerId };

/**
 * What a group ranks its products by, and therefore which figures its rows
 * carry.
 *
 * - `"sales"` — Stock and Mutual Fund. They trade continuously, so a week's
 *   turnover is a real measure of how a product is selling.
 * - `"fill"` — the four desks that book. A note or a bond opens once, fills,
 *   and closes; there is no weekly turnover to rank by, and the figure an IC
 *   actually wants is how much of *this* window is gone. So those rows carry
 *   their book's fill and no sales figure at all — see `bookFill`.
 *
 * The distinction used to be `showsOrderCount`, which hid one column while
 * leaving the invented sales figure those desks never had sitting beside it.
 */
export type TrendingMeasure = "sales" | "fill";

export type TrendingItem = {
  /** 1-based, within its own asset class. */
  rank: number;
  title: string;
  subtitle: string;
  /**
   * Mock sales for the week, in THB, on a `"sales"` group. Formatted at the
   * edge, not here. Absent on a `"fill"` group — those products have no such
   * figure, and carrying a plausible-looking one is how a number nobody can
   * source ends up quoted back.
   */
  salesThb?: number;
  /** Mock number of orders that made up `salesThb`. `"sales"` groups only. */
  orders?: number;
  /** Week-on-week change in sales, pre-formatted with its sign. */
  changePct?: string;
  trend?: Trend;
  /** Mock: picked by Yuanta's desk — the only rows shown under "Yuanta Highlight". */
  highlight: boolean;
  /** Mock: in line with the CIO's house view — the only rows shown under "CIO View". */
  cioView: boolean;
  target: TrendingTarget;
  /**
   * The id this product's order book is kept under, for the four desks that
   * take bookings — see `bookable-products`. Stock and mutual funds trade
   * continuously and have no book, so theirs is `undefined`.
   *
   * Resolved here, where the source row is still in hand. `target` carries the
   * product for most desks but Global Bond's carries only an issuer, and an
   * issuer is not what is booked — one of its bonds is.
   */
  bookableId?: string;
};

export type TrendingGroup = {
  /** A `PRODUCT_CATEGORIES` id — the tab this group's products live under. */
  id: string;
  title: string;
  /** See {@link TrendingMeasure}. */
  measure: TrendingMeasure;
  /** Every product in the class, ranked. The card shows the first
   *  `TRENDING_CARD_ROWS`; "ดูทั้งหมด" opens the whole list as a table. */
  items: TrendingItem[];
};

/** The four desks that book, by `PRODUCT_CATEGORIES` id. */
const BOOKED_GROUPS = new Set(["structured", "thai-structured", "global-bond", "fixed-income"]);

function measureOf(groupId: string): TrendingMeasure {
  return BOOKED_GROUPS.has(groupId) ? "fill" : "sales";
}

/** How many of a group's rows its card shows before "ดูทั้งหมด". */
export const TRENDING_CARD_ROWS = 5;

export const PRODUCT_TRENDING_UPDATED_AT =
  "ยอดขาย 7 วันล่าสุด | Latest update: 30 Apr 2025 - 09:22";

/**
 * The same line for a single group's page, in terms that group can stand
 * behind.
 *
 * A `"fill"` group has no weekly sales figure and no "latest update" either —
 * its numbers are the live book, which is as current as the page. Printing the
 * sales line over a table of basket fills was quoting a date for figures that
 * do not have one.
 */
export function trendingUpdatedAt(measure: TrendingMeasure): string {
  return measure === "sales"
    ? PRODUCT_TRENDING_UPDATED_AT
    : "ยอดจองในตะกร้าตามเวลาจริง — แสดงเฉพาะตะกร้าที่ยังเปิดให้จอง";
}

/**
 * The invented part: five rungs of [sales THB, orders, week-on-week] per asset
 * class, descending — so the rank a row is given and the number printed beside
 * it always agree. Scales differ by asset class on purpose: a structured note
 * sells in far fewer, far larger tickets than a mutual fund.
 */
const SALES_LADDER: Record<string, [salesThb: number, orders: number, changePct: string, trend: Trend][]> = {
  "mutual-fund": [
    [1_482_000_000, 2_418, "+18.4%", "up"],
    [1_126_000_000, 1_974, "+11.2%", "up"],
    [884_000_000, 1_503, "+6.8%", "up"],
    [612_000_000, 1_142, "-3.1%", "down"],
    [471_000_000, 905, "+2.4%", "up"],
  ],
  stock: [
    [518_000_000, 3_142, "+21.3%", "up"],
    [402_000_000, 2_576, "+8.8%", "up"],
    [341_000_000, 2_104, "-4.4%", "down"],
    [275_000_000, 1_688, "+2.7%", "up"],
    [198_000_000, 1_245, "-9.1%", "down"],
  ],
};

/**
 * Rungs past the hand-written five, for the full table: each one a step down
 * from the last written rung, so the ranking still reads top-down. The
 * week-on-week figures cycle through a fixed list — deterministic, so the
 * table doesn't reshuffle between renders.
 */
const TAIL_DECAY = 0.86;
const TAIL_CHANGES: [changePct: string, trend: Trend][] = [
  ["+3.2%", "up"],
  ["-1.8%", "down"],
  ["+0.9%", "up"],
  ["0.0%", "flat"],
  ["-4.1%", "down"],
  ["+5.6%", "up"],
  ["-0.7%", "down"],
];

function rung(ladder: (typeof SALES_LADDER)[string], i: number) {
  if (i < ladder.length) return ladder[i];
  const [lastSales, lastOrders] = ladder[ladder.length - 1];
  const factor = TAIL_DECAY ** (i - ladder.length + 1);
  const [changePct, trend] = TAIL_CHANGES[(i - ladder.length) % TAIL_CHANGES.length];
  return [
    Math.round((lastSales * factor) / 1_000_000) * 1_000_000,
    Math.max(1, Math.round(lastOrders * factor)),
    changePct,
    trend,
  ] as const;
}

function dedupeBy<T>(items: T[], keyOf: (item: T) => string): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    const key = keyOf(item);
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}

/**
 * Pairs the real products of one asset class with that class's sales ladder —
 * or with nothing, on a `"fill"` group, which has no sales to pair with.
 *
 * The ranks written here are the *source* order, and on a fill group that is
 * the catalogue's order, not a ranking. `trendingRows` reorders by fill and
 * renumbers; see `sortTrendingItems`.
 */
function group<T>(
  id: string,
  title: string,
  source: T[],
  row: (item: T) => {
    title: string;
    subtitle: string;
    target: TrendingTarget;
    bookableId?: string;
  },
): TrendingGroup {
  const measure = measureOf(id);
  const ladder = SALES_LADDER[id];
  const items = source.map((item, i) => {
    const [salesThb, orders, changePct, trend] = measure === "sales"
      ? rung(ladder, i)
      : ([] as const);
    return {
      rank: i + 1,
      salesThb,
      orders,
      changePct,
      trend,
      // Invented like the sales: a fixed pattern, so the two editorial views
      // don't pick the same rows.
      highlight: i % 2 === 0,
      cioView: i % 3 !== 1,
      ...row(item),
    };
  });
  return { id, title, measure, items };
}

/**
 * The issuer pages' own bond rows — the one list where every bond is distinct
 * *and* bookable.
 *
 * Not `ALL_OVERSEAS_BONDS`, which this used to read. That list is seed-expanded
 * and mixes issuer names with coupons and maturities from elsewhere, so most of
 * its rows name a bond that exists nowhere else: "Microsoft Corp 3.05% 2032"
 * has no issuer row, no quota and no book. That was survivable while a trending
 * row only had to link at an issuer page, and stopped being so when the rows
 * started carrying their book's fill — three of the five showed no bar, because
 * there was no book to read one from.
 *
 * Round-robin across issuers rather than issuer by issuer: `SALES_LADDER`
 * assigns a rung by position, so reading the issuer pages in order made the
 * card's five best sellers Apple's first five bonds. Interleaved, the top of
 * the card is five issuers — which is what a reader takes "best selling global
 * bonds" to mean.
 */
const globalBondRows = (() => {
  const byIssuer = Object.values(GLOBAL_BOND_ISSUERS).map((issuer) =>
    issuer.bonds.map((row) => ({ issuer, row })),
  );
  const rows: { issuer: (typeof byIssuer)[number][number]["issuer"]; row: GlobalBondRow }[] = [];
  const deepest = Math.max(...byIssuer.map((b) => b.length));
  for (let i = 0; i < deepest; i += 1) {
    for (const bonds of byIssuer) if (i < bonds.length) rows.push(bonds[i]);
  }
  return rows;
})();

const stockRows = dedupeBy(
  [...STOCK_TOP_PICK, ...getSectorStockBatch(0, 10)],
  (row) => row.symbol,
);

const structuredRows = dedupeBy([...TOP_PICKS, ...STRUCTURED_PRODUCTS], (p) => p.id);

/**
 * Card order on the page — a layout decision, not a ranking, so it is written
 * out rather than derived from the numbers. What it is built around: the two
 * structured-product cards sit side by side on the two-column grid (same
 * instrument in two markets — an IC comparing Thai against Global shouldn't
 * have to read down a column to do it), and the two flagship retail products,
 * Stock and Mutual Fund, open the page as the top row. Any id missing here
 * sorts to the end.
 */
const GROUP_ORDER = [
  "stock",
  "mutual-fund",
  "structured",
  "thai-structured",
  "global-bond",
  "fixed-income",
];

function orderOf(id: string): number {
  const i = GROUP_ORDER.indexOf(id);
  return i === -1 ? GROUP_ORDER.length : i;
}

/** Every asset class that sells units, each ranked internally by sales. */
export const PRODUCT_TRENDING_GROUPS: TrendingGroup[] = [
  // Top picks lead (they are the card's five); the SET sector stocks follow so
  // the full table has more than the card. Both resolve on `stockProductHref`
  // — `getStockProductDetail` searches the same sector batch.
  group("stock", "Stock", stockRows, (row) => ({
    title: row.symbol,
    subtitle: row.name,
    target: { kind: "stock", symbol: row.symbol },
  })),
  group(
    "mutual-fund",
    "Mutual Fund",
    dedupeBy(getTopPerformers("global-equity"), (fund) => fund.id),
    (fund) => ({
      title: fund.symbol,
      subtitle: fund.name,
      target: { kind: "mutual-fund", fundId: fund.id },
    }),
  ),
  group("fixed-income", "Fixed Income", dedupeBy(FIXED_INCOME_BONDS, (b) => b.symbol), (bond) => ({
    title: bond.symbol,
    subtitle: `${bond.companyName} · YTM ${bond.ytm}`,
    target: { kind: "fixed-income", bond },
    bookableId: fixedIncomeBookableId(bond),
  })),
  // The basket leads and the theme follows, matching the Global Structured
  // rows above and the All Thai FCN table's own columns — "Chips" names a
  // shelf, AMD/NVDA/QCOM is the thing being sold.
  group("thai-structured", "Thai Structured Product", THAI_STRUCTURED_PRODUCTS, (product) => ({
    title: [product.bbg1, product.bbg2, product.bbg3].filter(Boolean).join(" - "),
    subtitle: `${product.theme} · ${product.product} · Coupon ${product.couponPa} · ${product.tenor}M`,
    target: { kind: "thai-structured", product },
    bookableId: thaiBookableId(product.theme),
  })),
  // Underlying first, unlike the search index's productName-first rows: every
  // product here is a "Global FCN", so the basket is the only thing that tells
  // one rank from the next.
  group("structured", "Global Structured Product", structuredRows, (product) => ({
    title: product.underlying,
    subtitle: `${product.productName} · Coupon ${product.coupon}`,
    target: { kind: "structured", product },
    bookableId: product.id,
  })),
  group("global-bond", "Global Bond", globalBondRows, ({ issuer, row }) => ({
    title: row.name,
    subtitle: `${row.currency} · Yield ${row.yieldPct} · Maturity ${row.maturity}`,
    // The issuer page, which is where a bond is read — there is no page per
    // bond, and the row the IC pressed is on the one this opens.
    target: { kind: "global-bond", issuerId: issuer.id },
    bookableId: globalBondBookableId(row),
  })),
].sort((a, b) => orderOf(a.id) - orderOf(b.id));

export function getTrendingGroup(id: string): TrendingGroup | undefined {
  return PRODUCT_TRENDING_GROUPS.find((g) => g.id === id);
}

/**
 * Every product on this shelf that has an order book.
 *
 * Module-level, and therefore the same array on every render — which is what
 * lets `useTrendingBooks` memoise on it instead of reassembling thirty books
 * each time a parent re-renders.
 */
export const TRENDING_BOOKABLE_IDS: string[] = [
  ...new Set(
    PRODUCT_TRENDING_GROUPS.flatMap((g) =>
      g.items.map((i) => i.bookableId).filter((id): id is string => id !== undefined),
    ),
  ),
];

/**
 * 1..n again, after something has reordered or dropped rows.
 *
 * The rank is a position in the list the reader is looking at, not a property
 * of the product — leave it alone after a filter and the podium reads
 * "1, 2, 4, 5" with no explanation of where 3 went.
 */
function reranked(items: TrendingItem[]): TrendingItem[] {
  return items.map((item, i) => ({ ...item, rank: i + 1 }));
}

/** `?sort=` — omitted from the URL while it holds its default value. */
export const TRENDING_SORT_PARAM = "sort";

export type TrendingSort = "best-seller" | "highlight" | "cio-view";

export const DEFAULT_TRENDING_SORT: TrendingSort = "best-seller";

export const TRENDING_SORTS: { id: TrendingSort; label: string }[] = [
  { id: "best-seller", label: "รายการขายดี" },
  { id: "highlight", label: "Yuanta Highlight" },
  { id: "cio-view", label: "CIO View" },
];

export function normalizeTrendingSort(value: string | null | undefined): TrendingSort {
  return TRENDING_SORTS.some((f) => f.id === value)
    ? (value as TrendingSort)
    : DEFAULT_TRENDING_SORT;
}

/**
 * Whether `sort` is a ranking. Only "รายการขายดี" is: the two editorial views
 * are a desk's picks, a set with no order to them, so they show no rank
 * numbers and no "อันดับ" column.
 */
export function isRankedSort(sort: TrendingSort): boolean {
  return sort === "best-seller";
}

/**
 * A group's rows as a sort asks for them, numbered 1..n.
 *
 * "รายการขายดี" keeps every row in the group's own ranking. The two editorial
 * views are curated shelves instead: only the products that desk picked, in
 * the catalogue's order, unranked — so a card can come up short, or empty.
 * `rank` is still filled in there, but only as a stable row key; nothing
 * shows it (see `isRankedSort`).
 *
 * A desk's closed products are dropped before this — see `openTrendingItems`.
 * Both filters have to run before the renumbering here, or the podium reads
 * "1, 2, 4" with a gap where a dropped row was.
 */
export function sortTrendingItems(items: TrendingItem[], sort: TrendingSort): TrendingItem[] {
  if (sort === "best-seller") return reranked(items);
  const picked = sort === "highlight" ? (i: TrendingItem) => i.highlight : (i: TrendingItem) => i.cioView;
  return reranked(items.filter(picked));
}

/** What an empty card or table says under `sort` — only the curated views can be empty by choice. */
export function emptyTrendingMessage(sort: TrendingSort): string {
  if (sort === "best-seller") return "ยังไม่มีสินค้าที่เปิดขายในกลุ่มนี้";
  const label = TRENDING_SORTS.find((f) => f.id === sort)?.label;
  return `${label} ยังไม่ได้เลือกสินค้าในกลุ่มนี้`;
}

/** A group's full ranking — the sub-page its card's "ดูทั้งหมด" opens. */
export function trendingGroupHref(id: string, sort: TrendingSort = DEFAULT_TRENDING_SORT): string {
  const path = `/product-catalog/product-trending/${encodeURIComponent(id)}`;
  return sort === DEFAULT_TRENDING_SORT ? path : `${path}?${TRENDING_SORT_PARAM}=${sort}`;
}
