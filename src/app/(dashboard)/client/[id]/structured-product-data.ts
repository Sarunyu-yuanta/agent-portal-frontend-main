import structuredProductsRaw from "@/data/structured-products.json";

export type StructuredProduct = {
  id: string;
  underlying: string;
  coupon: string;
  tenor: string;
  ko: string;
  strike: string;
  ki: string;
  tags: string[];
  logos: string[];
  offerDate: string;
  couponPeriod: string;
  detailTenor: string;
  productName: string;
  productType: string;
  currency: string;
  minInvestment: string;
  updatedAt: string;
  requestNotionalSize?: string;
  confirmedRequest?: string;
  issuer?: string;
  underlyingNames?: string[];
  underlyingSectors?: string[];
};

export const TOP_PICKS = structuredProductsRaw.topPicks as StructuredProduct[];
export const STRUCTURED_PRODUCTS = structuredProductsRaw.products as StructuredProduct[];

export const ALL_STRUCTURED_PRODUCTS_COUNT = structuredProductsRaw.meta.allCount;
export const ALL_STRUCTURED_PRODUCTS_UPDATED_AT = structuredProductsRaw.meta.updatedAt;
export const ALL_STRUCTURED_PRODUCTS_UPDATED_AT_TABLET = structuredProductsRaw.meta.updatedAtTablet;

/** How many cards the "all products" page shows. */
export const ALL_STRUCTURED_PRODUCTS_LIMIT = 12;

/**
 * Everything the "all products" page can show, in order — longer than the page,
 * so a product closed by its order going out leaves a gap the next one fills.
 */
export const ALL_STRUCTURED_PRODUCTS_POOL: StructuredProduct[] = [
  ...(structuredProductsRaw.allProductsBase as StructuredProduct[]),
  ...TOP_PICKS.map((p, i) => ({ ...p, id: `asp-repeat-${i}`, updatedAt: "25 Aug 2026 - 09:00" })),
  ...STRUCTURED_PRODUCTS.map((p, i) => ({ ...p, id: `asp-repeat-sp-${i}`, updatedAt: "25 Aug 2026 - 09:00" })),
];

export const ALL_STRUCTURED_PRODUCTS: StructuredProduct[] = ALL_STRUCTURED_PRODUCTS_POOL.slice(
  0,
  ALL_STRUCTURED_PRODUCTS_LIMIT,
);

/**
 * The catalogue's front page in one queue: Top pick takes the first
 * {@link TOP_PICK_COUNT}, the grid under it the next {@link STRUCTURED_GRID_COUNT}.
 * One queue rather than two lists so that when a product closes, everything
 * behind it moves up a place — a grid card into Top pick, a spare into the grid
 * — and no product is ever on both.
 */
export const STRUCTURED_SHELF: StructuredProduct[] = [
  ...TOP_PICKS,
  ...STRUCTURED_PRODUCTS,
  ...(structuredProductsRaw.allProductsBase as StructuredProduct[]),
];
export const TOP_PICK_COUNT = TOP_PICKS.length;
export const STRUCTURED_GRID_COUNT = STRUCTURED_PRODUCTS.length;

export const TOP_IDEA_DETAIL_PRODUCTS: StructuredProduct[] = [
  ...(structuredProductsRaw.topIdeaDetailBase as StructuredProduct[]),
  ...TOP_PICKS.map((p, i) => ({ ...p, id: `ti-repeat-top-${i}` })),
  ...STRUCTURED_PRODUCTS.map((p, i) => ({ ...p, id: `ti-repeat-sp-${i}` })),
  ...TOP_PICKS.map((p, i) => ({ ...p, id: `ti-repeat-top2-${i}` })),
  ...STRUCTURED_PRODUCTS.slice(0, 4).map((p, i) => ({ ...p, id: `ti-repeat-sp2-${i}` })),
].slice(0, 20);

// Lives here rather than in investment-solution-data so every derived product
// collection sits next to the registry below — and so that module can keep
// importing this one without a cycle.
export const INVESTMENT_SOLUTION_DETAIL_PRODUCTS: StructuredProduct[] = [
  ...TOP_PICKS.map((p, i) => ({ ...p, id: `is-top-${i}` })),
  ...STRUCTURED_PRODUCTS.map((p, i) => ({ ...p, id: `is-sp-${i}` })),
  ...TOP_PICKS.map((p, i) => ({ ...p, id: `is-top2-${i}` })),
  ...STRUCTURED_PRODUCTS.slice(0, 4).map((p, i) => ({ ...p, id: `is-sp2-${i}` })),
  ...TOP_PICKS.map((p, i) => ({ ...p, id: `is-top3-${i}` })),
  ...STRUCTURED_PRODUCTS.slice(0, 3).map((p, i) => ({ ...p, id: `is-sp3-${i}` })),
].slice(0, 20);

/**
 * Every product a card anywhere in the app can link to, keyed by id.
 *
 * The detail view is a route now (`/product-catalog/product/[id]`), so a card
 * hands over an id instead of the product object it already had. That makes
 * this lookup the difference between a detail page and a blank screen — any
 * collection a card renders from has to be listed here. Collections are cloned
 * copies of the same few products under new ids, which is exactly why searching
 * only the two base arrays silently missed most of them.
 */
const PRODUCTS_BY_ID: Map<string, StructuredProduct> = new Map();
for (const product of [
  ...TOP_PICKS,
  ...STRUCTURED_PRODUCTS,
  ...ALL_STRUCTURED_PRODUCTS_POOL,
  ...TOP_IDEA_DETAIL_PRODUCTS,
  ...INVESTMENT_SOLUTION_DETAIL_PRODUCTS,
]) {
  // First listed wins, so the base collections stay canonical.
  if (!PRODUCTS_BY_ID.has(product.id)) PRODUCTS_BY_ID.set(product.id, product);
}

export function findProductById(id: string): StructuredProduct | undefined {
  return PRODUCTS_BY_ID.get(id);
}
