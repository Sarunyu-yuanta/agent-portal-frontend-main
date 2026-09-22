/**
 * The Product Catalog's category tabs, and the URLs that address them.
 *
 * Lives in `lib` rather than beside `ProductCatalogTab` because the app header
 * needs to name a tab in a breadcrumb and the detail routes need to link back to
 * one — neither should pull the catalog component tree into its bundle.
 *
 * The tab is carried in the URL as `?category=<id>`.
 */
export const PRODUCT_CATEGORIES = [
  { id: "structured",      title: "Global Structured Product" },
  { id: "thai-structured", title: "Thai Structured Product" },
  { id: "fixed-income",    title: "Fixed Income" },
  { id: "global-bond",     title: "Global Bond" },
  { id: "mutual-fund",     title: "Mutual Fund" },
  { id: "stock",           title: "Stock" },
  { id: "robo-advisory",   title: "Portfolio Advisory" },
];

export const CATALOG_PATH = "/product-catalog";

/** Coerces a URL `?category=` value to a real tab id, falling back to the first. */
export function normalizeProductCategory(value: string | null | undefined): string {
  return PRODUCT_CATEGORIES.some((c) => c.id === value)
    ? value!
    : PRODUCT_CATEGORIES[0].id;
}

/** Display title for a tab id, or `null` when the id isn't a real tab. */
export function productCategoryTitle(id: string | null | undefined): string | null {
  return PRODUCT_CATEGORIES.find((c) => c.id === id)?.title ?? null;
}

/** The catalog list, on a given tab. */
export function catalogListHref(category?: string | null): string {
  return category ? `${CATALOG_PATH}?category=${category}` : CATALOG_PATH;
}

/**
 * A Portfolio Advisory service, scoped to the client it is being read for.
 * Plans differ by the client's risk profile, so the client belongs in the URL.
 */
export function advisoryDetailHref(path: string, clientId: string): string {
  return `${path}?clientId=${encodeURIComponent(clientId)}`;
}

/** The `?category=` a catalog URL carries, if any. */
export function categoryOfUrl(url: string): string | null {
  return new URLSearchParams(url.split("?")[1] ?? "").get("category");
}

/**
 * The one tab a catalog route can only have come from.
 *
 * Single source for two things that must agree: where a detail page's back
 * button lands, and which tab its breadcrumb names. Routes reachable from more
 * than one tab are absent on purpose — for those the tab is only knowable from
 * the navigation trail, and guessing would be worse than saying nothing.
 */
const CATEGORY_BY_PATH: [RegExp, string][] = [
  [/^\/product-catalog\/fixed-income\//, "fixed-income"],
  [/^\/product-catalog\/global-bond(\/|$)/, "global-bond"],
  [/^\/product-catalog\/thai-structured\//, "thai-structured"],
  [/^\/product-catalog\/mutual-fund\//, "mutual-fund"],
  [/^\/product-catalog\/stock\/(?!dr|etf)[^/]+$/, "stock"],
  [/^\/product-catalog\/robo-advisory(\/|$)/, "robo-advisory"],
  [/^\/product-catalog\/definit(\/|$)/, "robo-advisory"],
];

export function catalogCategoryForPath(pathname: string): string | null {
  return CATEGORY_BY_PATH.find(([re]) => re.test(pathname))?.[1] ?? null;
}
