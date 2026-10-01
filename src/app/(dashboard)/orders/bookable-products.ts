/**
 * Which products can be booked, and how an id turns back into one.
 *
 * ─── Scope ───────────────────────────────────────────────────────────────────
 * Two desks, and only two: **Global Structured** (`/product-catalog/product/:id`)
 * and **Thai Structured** (`/product-catalog/thai-structured/:theme`). Mutual
 * funds, stocks, bonds and the rest of the catalogue are deliberately out —
 * each has its own ticket conventions, its own required documents, and in most
 * cases its own downstream system, so adding one is a decision rather than a
 * loop over a longer list.
 *
 * Adding a third desk later is this file plus a CTA on that desk's detail page.
 * Nothing in `order-book.ts`, the booking modal or `/orders` knows which desk a
 * book came from.
 *
 * ─── One namespace ───────────────────────────────────────────────────────────
 * `/orders/:id` is a single route for both desks, so their ids have to be
 * distinguishable. The global desk's are authored (`ko-wmt`,
 * `sp-nvda-amzn-axp`); the Thai desk's are derived from the theme and carry a
 * `thai-` prefix, which is what {@link findBookableProduct} splits on.
 */

import {
  findProductById,
  type StructuredProduct,
} from "../client/[id]/structured-product-data";
import {
  THAI_STRUCTURED_PRODUCTS,
  thaiBookableId,
  toBookableProduct,
} from "../client/[id]/thai-structured-data";

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
export function findBookableProduct(id: string): BookableProduct | undefined {
  // The prefix check first, so a Thai theme can never be shadowed by a global
  // product that happens to share its slug.
  if (id.startsWith("thai-")) return THAI_BY_ID.get(id);
  return findProductById(id);
}

/** Where a book's product sits in the catalogue — the "ดูรายละเอียดสินค้า" link. */
export function catalogHrefFor(product: BookableProduct): string {
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
export function deskLabelFor(product: BookableProduct): string {
  return product.id.startsWith("thai-") ? "Thai Structured" : "Global Structured";
}
