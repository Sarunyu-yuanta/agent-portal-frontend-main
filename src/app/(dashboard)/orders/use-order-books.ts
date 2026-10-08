"use client";

/**
 * The read side of the order store: the store's flat lists, joined with the
 * product catalogue and assembled into books.
 *
 * Kept apart from `contexts/orders-context` so that file stays a store — it
 * holds rows and mutates them, and knows nothing about products. Everything
 * that needs a product to make sense (the currency a booking is in, the target
 * it fills, the log that quotes both) is derived here.
 *
 * Both hooks return a {@link Resource}, so the pages that read them render
 * skeletons against `isLoading` and keep doing so once orders get an endpoint.
 */

import { useMemo } from "react";
import { useOrders } from "@/contexts/orders-context";
import type { Resource } from "@/hooks/use-api";
import type { ClientReadiness, OrderBook, RequirementRequest } from "@/types/domain";
import type { Client } from "@/types/domain";
import { assembleOrderBook } from "./order-book";
import { clientReadiness } from "./order-requirements";
import { findBookableProduct, type BookableProduct } from "./bookable-products";

/** One product's book, or `null` when the id resolves to no product. */
export function useOrderBook(productId: string): Resource<OrderBook | null> {
  const { bookings, submissions, requirementRequests, isLoading } = useOrders();

  const data = useMemo(() => {
    const product = findBookableProduct(productId);
    if (!product) return null;
    return assembleOrderBook(
      product,
      bookings.filter((b) => b.productId === productId),
      submissions.filter((s) => s.productId === productId),
      requirementRequests.filter((r) => r.productId === productId),
    );
  }, [productId, bookings, submissions, requirementRequests]);

  return { data, isLoading };
}

/**
 * Every book with something on it, newest activity first.
 *
 * Products with no booking, no submission and no outstanding request are not
 * books yet — the catalogue is where an IC goes to find one of those. What this
 * lists is work in progress.
 *
 * A product id that no longer resolves is dropped rather than rendered as a
 * blank row: the seed data clones products under synthetic ids, and a book
 * pointing at one that has since been renamed is a bug in the fixture, not a
 * row the IC can act on.
 */
export function useOrderBooks(): Resource<OrderBook[]> {
  const { bookings, submissions, requirementRequests, isLoading } = useOrders();

  const data = useMemo(() => {
    const ids = new Set([
      ...bookings.map((b) => b.productId),
      ...submissions.map((s) => s.productId),
      ...requirementRequests.map((r) => r.productId),
    ]);

    const books: OrderBook[] = [];
    for (const id of ids) {
      const product = findBookableProduct(id);
      if (!product) continue;
      books.push(
        assembleOrderBook(
          product,
          bookings.filter((b) => b.productId === id),
          submissions.filter((s) => s.productId === id),
          requirementRequests.filter((r) => r.productId === id),
        ),
      );
    }

    // By latest activity, which is the log's own first line — a book whose
    // newest event is today belongs above one that has been quiet for a week,
    // whatever state either is in.
    return books.sort((a, b) => (b.logs[0]?.at ?? "").localeCompare(a.logs[0]?.at ?? ""));
  }, [bookings, submissions, requirementRequests]);

  return { data, isLoading };
}

/**
 * The products whose order the back office has answered — gone from the
 * catalogue. One still processing stays listed (not bookable, see
 * `isBookingOpen`).
 *
 * Read off the submissions directly rather than by assembling every book: the
 * catalogue only needs the ids, and it renders on pages that never show a book.
 * Same rule as `isBookClosed`.
 */
export function useClosedProductIds(): Set<string> {
  const { submissions } = useOrders();
  return useMemo(
    () => new Set(submissions.filter((s) => s.status !== "processing").map((s) => s.productId)),
    [submissions],
  );
}

/**
 * The products whose order is with the back office right now — still listed in
 * the catalogue, not bookable, and tagged "กำลังดำเนินการสั่งซื้อ" on its card
 * so the IC can tell from the outside.
 */
export function useProcessingProductIds(): Set<string> {
  const { submissions } = useOrders();
  return useMemo(
    () => new Set(submissions.filter((s) => s.status === "processing").map((s) => s.productId)),
    [submissions],
  );
}

/**
 * `items` without the closed products, cut to `limit` afterwards — so a fixed
 * shelf of `limit` cards stays full, the next product in line moving up into
 * the gap a closed one left.
 */
export function useOpenProducts<T>(
  items: T[],
  idOf: (item: T) => string,
  limit?: number,
): T[] {
  const closed = useClosedProductIds();
  return useMemo(() => {
    const open = items.filter((item) => !closed.has(idOf(item)));
    return limit === undefined ? open : open.slice(0, limit);
    // `idOf` is an inline accessor at every call site; it never changes what it reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, closed, limit]);
}

/** This client's requirement requests for this product — the readiness input. */
export function useRequestsFor(clientId: string, productId: string): RequirementRequest[] {
  const { requirementRequests } = useOrders();
  return useMemo(
    () =>
      requirementRequests.filter((r) => r.clientId === clientId && r.productId === productId),
    [requirementRequests, clientId, productId],
  );
}

/**
 * One client's checklist against one product, live against the request store.
 *
 * The store is what makes this a hook rather than a call to
 * {@link clientReadiness}: a request that has come back changes the answer, and
 * the panel showing it has to re-render when it does.
 */
export function useClientReadiness(
  client: Client,
  product: BookableProduct,
): ClientReadiness {
  const requests = useRequestsFor(client.id, product.id);
  return useMemo(
    () => clientReadiness(client, product, requests),
    [client, product, requests],
  );
}

/**
 * Readiness for a whole roster in one pass — what the customer list reads to
 * say who can be booked before anyone is picked.
 *
 * One hook over the list rather than one per row: a row cannot call a hook
 * conditionally, and a component per client just to hold one would remount the
 * lot on every keystroke in the search box.
 */
export function useRosterReadiness(
  clients: Client[],
  product: BookableProduct,
): Map<string, ClientReadiness> {
  const { requirementRequests } = useOrders();
  return useMemo(() => {
    const byClient = new Map<string, ClientReadiness>();
    for (const client of clients) {
      const requests = requirementRequests.filter(
        (r) => r.clientId === client.id && r.productId === product.id,
      );
      byClient.set(client.id, clientReadiness(client, product, requests));
    }
    return byClient;
  }, [clients, product, requirementRequests]);
}
