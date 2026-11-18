"use client";

/**
 * The order books behind Product Trending's four booked desks.
 *
 * Product Trending ranks by sales, which says how a product *has* sold and
 * nothing about whether an IC can still sell it. On Global Structured, Thai
 * Structured, Fixed Income and Global Bond that gap is the difference between
 * a shelf and a sales report: a basket whose order has gone downstream, or a
 * bond whose issue quota is spent, is a row an IC can click, read and then
 * discover is unbookable. So those four groups show only what is still open,
 * and each row carries its book's fill — the number that says how much of the
 * window is left.
 *
 * Stock and Mutual Fund are untouched. They trade continuously, have no book,
 * and nothing about them is ever closed.
 *
 * Gated on `ORDER_BOOKING_ENABLED`: with booking off there are no books, and
 * the shelf is the plain sales ranking it was before.
 */

import { useMemo } from "react";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { bookFillThb, isBookingOpen } from "@/app/(dashboard)/orders/order-book";
import { useBooksByIds } from "@/app/(dashboard)/orders/use-order-books";
import type { OrderBook } from "@/types/domain";
import {
  isRankedSort,
  sortTrendingItems,
  TRENDING_BOOKABLE_IDS,
  type TrendingGroup,
  type TrendingItem,
  type TrendingSort,
} from "./product-trending-data";

/** Every trending product's book, keyed by the id on `TrendingItem.bookableId`. */
export function useTrendingBooks(): Map<string, OrderBook> {
  const books = useBooksByIds(TRENDING_BOOKABLE_IDS);
  const empty = useMemo(() => new Map<string, OrderBook>(), []);
  return ORDER_BOOKING_ENABLED ? books : empty;
}

/** One trending row's book, or `null` where the product has none. */
export function bookForItem(
  item: TrendingItem,
  books: Map<string, OrderBook>,
): OrderBook | null {
  return (item.bookableId && books.get(item.bookableId)) || null;
}

/**
 * A group's rows as a surface should render them: open products only, in the
 * group's own ranking, then narrowed by whichever view is active.
 *
 * One function for the card grid and the full table both, because the order of
 * the three steps is load-bearing and was getting written out at each call
 * site. `sortTrendingItems` renumbers whatever it is handed, so it has to run
 * last — filter after it and the ranks skip the dropped rows; rank after it and
 * the editorial sorts are undone.
 */
export function trendingRows(
  group: TrendingGroup,
  books: Map<string, OrderBook>,
  sort: TrendingSort,
): TrendingItem[] {
  const open = openTrendingItems(group.items, books);
  // The editorial picks are unranked, so they skip the fill ranking and stay
  // in the catalogue's order.
  const ranked = group.measure === "fill" && isRankedSort(sort) ? byFill(open, books) : open;
  return sortTrendingItems(ranked, sort);
}

/**
 * Fullest basket first.
 *
 * By amount rather than by percentage: "ยอดจองในตะกร้า" is the money taken, and
 * a desk's products can have different notionals — a bond issue 20× the size of
 * the one beside it would otherwise rank below it on a single ticket. In THB,
 * because Fixed Income sells in baht and the other three in dollars.
 *
 * A row with no book sorts last rather than being dropped: see
 * {@link openTrendingItems} for why it is still here at all.
 */
function byFill(items: TrendingItem[], books: Map<string, OrderBook>): TrendingItem[] {
  return [...items].sort((a, b) => {
    const bookA = bookForItem(a, books);
    const bookB = bookForItem(b, books);
    return (bookB ? bookFillThb(bookB) : -1) - (bookA ? bookFillThb(bookA) : -1);
  });
}

/**
 * `items` without the products that can no longer be booked.
 *
 * {@link isBookingOpen}, not `isBookClosed` — the two differ on a basket whose
 * order is with the back office, and that one is exactly the case this exists
 * for. It is still in the catalogue (the IC may need to read its terms, and
 * `useClosedProductIds` rightly keeps it there) but nothing more can be booked
 * into it, so it has no business on a shelf of what is for sale.
 *
 * A row whose book cannot be found is kept: that is "unknown", not "closed",
 * and a shelf must not hide a product it merely failed to look up.
 *
 * Ranks are **not** fixed up here — `sortTrendingItems` renumbers whatever it
 * is handed, and it runs after this.
 */
export function openTrendingItems(
  items: TrendingItem[],
  books: Map<string, OrderBook>,
): TrendingItem[] {
  if (!ORDER_BOOKING_ENABLED) return items;
  return items.filter((item) => {
    const book = bookForItem(item, books);
    return book === null || isBookingOpen(book);
  });
}
