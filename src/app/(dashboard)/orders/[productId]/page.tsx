"use client";

import { Suspense, use } from "react";
import { redirect, useRouter } from "next/navigation";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { CatalogNotFound } from "../../product-catalog/CatalogNotFound";
import { findBookableProduct } from "../bookable-products";
import { OrderBookDetail } from "../OrderBookDetail";
import { OrderBookDetailSkeleton } from "../OrderSkeletons";
import { useOrderBook } from "../use-order-books";

/**
 * Resolving the book is this route's job, so the loading state belongs here
 * rather than inside `OrderBookDetail` — a component handed a book has nothing
 * left to wait for. Same split as the product detail route.
 *
 * Order matters: the skeleton goes above the not-found branch, so a book still
 * in flight reads as loading rather than as "ไม่พบรายการจองนี้".
 */
export default function OrderBookPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  // Same gate as `/orders` — a bookmarked book has to land somewhere real
  // when the flag is off. Above every hook, so flipping the flag can't change
  // the hook order.
  if (!ORDER_BOOKING_ENABLED) redirect("/product-catalog");
  return (
    // The open list lives in `?view=` so an order row on `/orders` can link
    // straight to it, and `useSearchParams` suspends.
    <Suspense fallback={<OrderBookDetailSkeleton />}>
      <OrderBookPageInner params={params} />
    </Suspense>
  );
}

function OrderBookPageInner({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  const id = decodeURIComponent(productId);
  const { data: book, isLoading } = useOrderBook(id);
  const router = useRouter();

  if (isLoading) {
    return <OrderBookDetailSkeleton />;
  }

  // `useOrderBook` returns `null` for exactly one reason — the id resolves to
  // no product — so the product lookup below cannot fail once there is a book.
  const product = findBookableProduct(id);
  if (!book || !product) {
    return (
      <CatalogNotFound message="ไม่พบรายการจองนี้" onBack={() => router.push("/orders")} />
    );
  }

  return <OrderBookDetail book={book} product={product} />;
}
