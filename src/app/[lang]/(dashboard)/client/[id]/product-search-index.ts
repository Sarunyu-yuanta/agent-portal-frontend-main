import { TOP_PICKS, STRUCTURED_PRODUCTS, type StructuredProduct } from "./structured-product-data";
import { THAI_STRUCTURED_PRODUCTS, type ThaiStructuredProduct } from "./thai-structured-data";
import { FIXED_INCOME_BONDS, type FixedIncomeBond } from "./fixed-income-data";
import { ALL_OVERSEAS_BONDS, type GlobalBondRow } from "./global-bond-data";

/** Matches `PRODUCT_CATEGORIES` ids in `@/lib/product-catalog-routes` — lets
 *  the search modal's filter chips reuse the same category identifiers as
 *  the catalog's own tabs. */
export type ProductSearchItem =
  | { kind: "structured"; key: string; title: string; subtitle: string; categoryLabel: string; product: StructuredProduct }
  | { kind: "thai-structured"; key: string; title: string; subtitle: string; categoryLabel: string; product: ThaiStructuredProduct }
  | { kind: "fixed-income"; key: string; title: string; subtitle: string; categoryLabel: string; bond: FixedIncomeBond }
  | { kind: "global-bond"; key: string; title: string; subtitle: string; categoryLabel: string; bond: GlobalBondRow };

function dedupeByKey<T>(items: T[], keyOf: (item: T) => string): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    const key = keyOf(item);
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}

const structuredItems: ProductSearchItem[] = dedupeByKey(
  [...TOP_PICKS, ...STRUCTURED_PRODUCTS],
  (p) => p.id,
).map((product) => ({
  kind: "structured",
  key: `structured-${product.id}`,
  title: product.productName,
  subtitle: product.underlying,
  categoryLabel: "Global Structured Product",
  product,
}));

const thaiItems: ProductSearchItem[] = dedupeByKey(THAI_STRUCTURED_PRODUCTS, (p) => p.theme).map(
  (product) => ({
    kind: "thai-structured",
    key: `thai-${product.theme}`,
    title: product.theme,
    subtitle: `${product.product} · ${product.bbg1} ${product.bbg2} ${product.bbg3}`,
    categoryLabel: "Thai Structured Product",
    product,
  }),
);

const fixedIncomeItems: ProductSearchItem[] = dedupeByKey(FIXED_INCOME_BONDS, (b) => b.id).map(
  (bond) => ({
    kind: "fixed-income",
    key: `fi-${bond.id}`,
    title: bond.symbol,
    subtitle: bond.companyName,
    categoryLabel: "Fixed Income",
    bond,
  }),
);

const globalBondItems: ProductSearchItem[] = dedupeByKey(ALL_OVERSEAS_BONDS, (b) => b.isin).map(
  (bond) => ({
    kind: "global-bond",
    key: `gb-${bond.isin}`,
    title: bond.name,
    subtitle: bond.ticker ?? "",
    categoryLabel: "Global Bond",
    bond,
  }),
);

/** Every searchable/browsable product across all categories, flattened. */
export const PRODUCT_SEARCH_INDEX: ProductSearchItem[] = [
  ...structuredItems,
  ...thaiItems,
  ...fixedIncomeItems,
  ...globalBondItems,
];

function haystack(item: ProductSearchItem): string {
  switch (item.kind) {
    case "structured":
      return [item.product.productName, item.product.underlying, item.product.productType, item.product.issuer]
        .filter(Boolean)
        .join(" ");
    case "thai-structured":
      return [item.product.theme, item.product.product, item.product.bbg1, item.product.bbg2, item.product.bbg3].join(" ");
    case "fixed-income":
      return [item.bond.symbol, item.bond.companyName, item.bond.fullCompanyName, item.bond.bondCategory].join(" ");
    case "global-bond":
      return [item.bond.name, item.bond.ticker, item.bond.isin].filter(Boolean).join(" ");
  }
}

export function matchesProductQuery(item: ProductSearchItem, query: string): boolean {
  return haystack(item).toLowerCase().includes(query.trim().toLowerCase());
}
