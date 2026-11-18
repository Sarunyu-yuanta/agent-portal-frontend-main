/**
 * Which products can be booked, and how an id turns back into one.
 *
 * ─── Scope ───────────────────────────────────────────────────────────────────
 * Four desks, in two booking modes (see {@link BookingMode}):
 *
 * - **basket** — Global Structured (`/product-catalog/product/:id`) and Thai
 *   Structured (`/product-catalog/thai-structured/:theme`). Bookings fill a
 *   notional target and go downstream as one order; the product is then done.
 * - **quota** — Fixed Income (`fi-`) and Global Bond (`gb-`). Each booking is
 *   sent as its own order straight away; the product closes when its issue
 *   quota is used up.
 *
 * Stocks, TFEX and mutual funds are not booked at all — Order Management shows
 * their client transactions instead (`use-transactions.ts`).
 *
 * Adding a desk is this file plus a CTA on that desk's detail page.
 *
 * ─── One namespace ───────────────────────────────────────────────────────────
 * `/orders/:id` is a single route for every desk, so their ids have to be
 * distinguishable. The global desk's are authored (`ko-wmt`,
 * `sp-nvda-amzn-axp`); the others are derived and carry a prefix — `thai-`,
 * `fi-`, `gb-` — which is what {@link findBookableProduct} splits on.
 */

import {
  allStructuredProducts,
  findProductById,
  type StructuredProduct,
} from "../client/[id]/structured-product-data";
import {
  THAI_STRUCTURED_PRODUCTS,
  thaiBookableId,
  toBookableProduct,
} from "../client/[id]/thai-structured-data";
import {
  FIXED_INCOME_BONDS,
  fixedIncomeBookableId,
  fixedIncomeToBookableProduct,
} from "../client/[id]/fixed-income-data";
import {
  allBookableGlobalBonds,
  getBookableGlobalBond,
  globalBondIssuerIdForBookable,
} from "../client/[id]/global-bond-data";

/**
 * What the order machinery needs of a product: a name, a currency, a minimum
 * ticket and a notional target.
 *
 * An alias of the global desk's own type rather than a narrower interface of
 * its own. The Thai desk already converts into that shape for its document
 * modals, so one shared shape is what both desks were going to produce anyway —
 * and a second, nearly identical type is a second place for "which field is the
 * currency" to be answered.
 */
export type BookableProduct = StructuredProduct;

/** The `?tab=` each desk's books are listed under on `/orders` — see `order-tabs.ts`. */
const ORDER_TAB_BY_DESK: Record<Desk, string> = {
  "Global Structured": "structured",
  "Thai Structured": "thai-structured",
  "Fixed Income": "fixed-income",
  "Global Bond": "global-bond",
};

const THAI_BY_ID = new Map<string, StructuredProduct>(
  THAI_STRUCTURED_PRODUCTS.map((p) => [thaiBookableId(p.theme), toBookableProduct(p)]),
);

/**
 * The product an order id refers to, from either desk, or `undefined` when it
 * refers to neither.
 *
 * `undefined` is a real answer rather than a failure to look hard enough: the
 * seed data clones global products under synthetic ids, and a book pointing at
 * one that no longer resolves is a broken fixture, not a row anyone can act on.
 * `/orders` drops those and `/orders/:id` shows "ไม่พบรายการจองนี้".
 */
const FIXED_INCOME_BY_ID = new Map<string, StructuredProduct>(
  FIXED_INCOME_BONDS.map((b) => [fixedIncomeBookableId(b), fixedIncomeToBookableProduct(b)]),
);

export type Desk = "Global Structured" | "Thai Structured" | "Fixed Income" | "Global Bond";

/**
 * How a desk takes bookings.
 *
 * `basket`: bookings fill a notional target, then go downstream together as the
 * product's one order. `quota`: each booking is its own order, sent as soon as
 * its funds check clears, until the product's issue quota is used up.
 */
export type BookingMode = "basket" | "quota";

/** Which desk an id belongs to — read off its prefix, so it needs no lookup. */
export function deskForId(id: string): Desk {
  if (id.startsWith("thai-")) return "Thai Structured";
  if (id.startsWith("fi-")) return "Fixed Income";
  if (id.startsWith("gb-")) return "Global Bond";
  return "Global Structured";
}

export function bookingModeForDesk(desk: Desk): BookingMode {
  return desk === "Fixed Income" || desk === "Global Bond" ? "quota" : "basket";
}

export function bookingModeForId(id: string): BookingMode {
  return bookingModeForDesk(deskForId(id));
}

export function bookingModeFor(product: Pick<BookableProduct, "id">): BookingMode {
  return bookingModeForId(product.id);
}

export function findBookableProduct(id: string): BookableProduct | undefined {
  // The prefix checks first, so a derived id can never be shadowed by a global
  // product that happens to share its slug.
  switch (deskForId(id)) {
    case "Thai Structured":
      return THAI_BY_ID.get(id);
    case "Fixed Income":
      return FIXED_INCOME_BY_ID.get(id);
    case "Global Bond":
      return getBookableGlobalBond(id);
    case "Global Structured":
      return findProductById(id);
  }
}

/** Every product a desk can book — the list Order Management's "สร้าง Order" picks from. */
export function bookableProductsForDesk(desk: Desk): BookableProduct[] {
  switch (desk) {
    case "Thai Structured":
      return [...THAI_BY_ID.values()];
    case "Fixed Income":
      return [...FIXED_INCOME_BY_ID.values()];
    case "Global Bond":
      return allBookableGlobalBonds();
    case "Global Structured":
      return allStructuredProducts();
  }
}

/** Where a book's product sits in the catalogue — the "ดูรายละเอียดสินค้า" link. */
export function catalogHrefFor(product: BookableProduct): string {
  if (deskForId(product.id) === "Fixed Income") {
    return `/product-catalog/fixed-income/bond/${encodeURIComponent(product.id.slice("fi-".length))}`;
  }
  if (deskForId(product.id) === "Global Bond") {
    const issuerId = globalBondIssuerIdForBookable(product.id);
    return issuerId ? `/product-catalog/global-bond/${issuerId}` : "/product-catalog";
  }
  if (product.id.startsWith("thai-")) {
    const theme = THAI_STRUCTURED_PRODUCTS.find(
      (p) => thaiBookableId(p.theme) === product.id,
    )?.theme;
    return theme
      ? `/product-catalog/thai-structured/${encodeURIComponent(theme)}`
      : "/product-catalog";
  }
  return `/product-catalog/product/${encodeURIComponent(product.id)}`;
}

/** Which desk wrote this deal — printed beside the product type on a book. */
export function deskLabelFor(product: BookableProduct): Desk {
  return deskForId(product.id);
}

/** The Order Management tab a product's desk is listed under. */
export function ordersListHref(productId: string): string {
  return `/orders?tab=${ORDER_TAB_BY_DESK[deskForId(productId)]}`;
}

/**
 * One client's orders on one desk — the middle rung between the list and a
 * book. See `orders/client/[clientId]/ClientOrdersDetail`.
 *
 * The tab is carried rather than derived: a client holds products on more than
 * one desk, so there is nothing in the id to read it off, and the page has to
 * know which desk it is showing.
 */
export function clientOrdersHref(clientId: string, tabId: string): string {
  return `/orders/client/${encodeURIComponent(clientId)}?tab=${tabId}`;
}

/*
 * There is no `orderBookHref`.
 *
 * `/orders/:productId` was a page per basket; a booking is read in
 * `BookingDetailModal` over the list now, because the back office collects a
 * full basket on its
 * own and the page had nothing for the IC to do. Anything that used to link to
 * a book links to its desk's tab instead — see {@link ordersListHref}.
 */
