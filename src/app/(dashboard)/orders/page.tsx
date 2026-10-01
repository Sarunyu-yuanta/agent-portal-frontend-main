"use client";

/**
 * Order Management — every product this IC has a book open on.
 *
 * The catalogue is where a deal is found; this is where one that has already
 * been started is tracked. A product with no booking, no submission and no
 * outstanding request is therefore not on this page at all (see
 * `useOrderBooks`) — an empty list means there is no work in progress, not that
 * the catalogue is empty.
 */

import { Suspense, useMemo } from "react";
import { redirect, usePathname, useSearchParams } from "next/navigation";
import { ClipboardTextIcon } from "@phosphor-icons/react";
import { Button, TabGroup } from "@sarunyu/system-one";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/fade-in";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { setQueryState, withQuery } from "@/lib/query-state";
import type { OrderBookStatus } from "@/types/domain";
import { OrderBookCard } from "./OrderBookCard";
import { OrderBooksSkeleton } from "./OrderSkeletons";
import { useOrderBooks } from "./use-order-books";

/**
 * The three things an IC does with a book, not the five states one can be in.
 *
 * `collecting` and `ready` share a tab because both are the IC's move — one
 * needs more clients, the other needs sending — and splitting them would put
 * the single most actionable state behind a tab that is empty most of the time.
 * The status tag on each card still tells them apart at a glance.
 */
const TABS: { id: string; title: string; match: (s: OrderBookStatus) => boolean }[] = [
  { id: "open", title: "กำลังดำเนินการจอง", match: (s) => s === "collecting" || s === "ready" },
  { id: "sent", title: "ส่งคำสั่งซื้อแล้ว", match: (s) => s === "processing" },
  { id: "done", title: "เสร็จสิ้น", match: (s) => s === "completed" || s === "rejected" },
];

export default function OrdersPage() {
  // Gated like `/notes` and `/calendar` are: the route keeps existing and
  // redirects somewhere real, so a bookmarked link doesn't 404 when the flag
  // is off. The page body is a separate component so this guard sits above
  // every hook rather than in front of them.
  if (!ORDER_BOOKING_ENABLED) redirect("/product-catalog");
  return (
    // `useSearchParams` suspends, and the tab lives in the URL so a book's
    // "back to Order Management" lands on the tab it came from.
    <Suspense fallback={null}>
      <OrdersPageInner />
    </Suspense>
  );
}

function OrdersPageInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: books, isLoading } = useOrderBooks();

  // The tab is a destination, not a refinement — it goes in the URL, and
  // `push` so the back button walks out of it. Same rule as Insights.
  const requested = searchParams.get("tab");
  const activeId = TABS.some((t) => t.id === requested) ? requested! : "open";
  const active = TABS.find((t) => t.id === activeId)!;

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((t) => [t.id, books.filter((b) => t.match(b.status)).length]),
      ) as Record<string, number>,
    [books],
  );

  const visible = books.filter((b) => active.match(b.status));

  return (
    <div className="flex flex-col gap-4">
      <TabGroup
        items={TABS.map((t) => ({
          id: t.id,
          title: t.title,
          // Zero is left off rather than shown: a badge reading "0" is the
          // only number on a tab that tells you not to click it, which the
          // empty state below says better once you have.
          notification: counts[t.id] || undefined,
        }))}
        activeId={activeId}
        onChange={(id) =>
          setQueryState(withQuery(pathname, searchParams, { tab: id }), "push")
        }
      />

      {/* Loading sits above the empty check — otherwise, once orders have a real
          endpoint, every visit flashes "ยังไม่มีรายการจอง" before the data
          lands. The project-wide rule, see `docs/handover.md`. */}
      {isLoading ? (
        <OrderBooksSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon size={40} className="text-[var(--text-default-placeholder)]" />}
          title="ยังไม่มีรายการในแท็บนี้"
          body="เริ่มจองให้ลูกค้าได้จากหน้าสินค้าใน Product Catalog — การจองจะมารวมกันที่นี่"
          actionSlot={
            <Link href="/product-catalog/product">
              <Button variant="outline" size="md">
                ไปที่ Product Catalog
              </Button>
            </Link>
          }
        />
      ) : (
        <FadeIn>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {visible.map((book) => (
              <OrderBookCard key={book.productId} book={book} />
            ))}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
