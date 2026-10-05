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

import { Suspense, useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { redirect, usePathname, useSearchParams } from "next/navigation";
import { ClipboardTextIcon } from "@phosphor-icons/react";
import { Button, Chip, TabGroup } from "@sarunyu/system-one";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { useStoredIds } from "@/hooks/use-stored-ids";
import { FadeIn } from "@/components/ui/fade-in";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { setQueryState, withQuery } from "@/lib/query-state";
import type { OrderBook, OrderBookStatus } from "@/types/domain";
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

/**
 * Which desk's books to show. A fixed list rather than one built from the books
 * on screen, so a chip does not vanish the moment its last book moves tabs.
 */
const PRODUCTS: { id: string; label: string; desk: string | null }[] = [
  { id: "all", label: "ทั้งหมด", desk: null },
  { id: "global", label: "Global Structured", desk: "Global Structured" },
  { id: "thai", label: "Thai Structured", desk: "Thai Structured" },
];

/**
 * One book's latest event, as seen from one tab.
 *
 * Keyed on the book's newest log line, so anything that adds one — a booking,
 * a cancellation, a client finishing their forms, the back office answering —
 * makes the book new again. Keyed per tab too: a book that moves from
 * "กำลังดำเนินการจอง" to "ส่งคำสั่งซื้อแล้ว" is new on the tab it arrived in,
 * whatever was seen of it on the one it left.
 */
/** `false` during the hydration render, `true` from the render after it. */
const subscribeNever = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

const seenKey = (tabId: string, book: OrderBook) =>
  `${tabId}|${book.productId}|${book.logs[0]?.id ?? ""}`;

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

  // A refinement rather than a destination, so `replace` — the back button
  // should leave the page, not step back through every chip clicked on it.
  const requestedProduct = searchParams.get("product");
  const product = PRODUCTS.find((p) => p.id === requestedProduct) ?? PRODUCTS[0];
  const ofProduct = useMemo(
    () => (product.desk ? books.filter((b) => b.desk === product.desk) : books),
    [books, product],
  );

  // Tab badges count within the chosen product, so the number on a tab is
  // what clicking it would actually show.
  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((t) => [t.id, ofProduct.filter((b) => t.match(b.status)).length]),
      ) as Record<string, number>,
    [ofProduct],
  );

  const visible = ofProduct.filter((b) => active.match(b.status));

  // ── What is new on each tab ────────────────────────────────────────────────
  // Same mechanism as the header bell's unread badge: ids in localStorage,
  // pruned to the ones still live so the entry cannot grow without bound.
  const liveKeys = useMemo(
    () =>
      new Set(
        TABS.flatMap((t) => books.filter((b) => t.match(b.status)).map((b) => seenKey(t.id, b))),
      ),
    [books],
  );
  const isKnown = useCallback((id: string) => liveKeys.has(id), [liveKeys]);
  const [seen, setSeen] = useStoredIds("orders:seen-tabs", isKnown);

  const keysOn = useCallback(
    (tabId: string) =>
      ofProduct
        .filter((b) => TABS.find((t) => t.id === tabId)!.match(b.status))
        .map((b) => seenKey(tabId, b)),
    [ofProduct],
  );

  // Opening a tab is looking at it — everything on it stops being new. This
  // also covers a booking landing while the tab is open.
  //
  // Not until hydration is done: until then `seen` is the server's empty
  // snapshot, and writing "empty + this tab" would wipe every other tab's
  // seen ids — a reload turned tabs already looked at red again.
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return;
    const unseen = keysOn(activeId).filter((k) => !seen.has(k));
    if (unseen.length > 0) setSeen(new Set([...seen, ...unseen]));
  }, [hydrated, activeId, keysOn, seen, setSeen]);

  /** 1-based, for the `nth-child` rules behind `.count-tabs` in globals.css. */
  const newTabs = TABS.flatMap((t, i) =>
    t.id !== activeId && keysOn(t.id).some((k) => !seen.has(k)) ? [String(i + 1)] : [],
  ).join(" ");

  return (
    <div className="flex flex-col gap-4">
      {/* `transparent-tabs` lets the page's grey show through — the library
          paints each tab white, which read as a white box on this page.
          `count-tabs` restyles the count badges — red only where `data-new`
          says the tab has something unseen. */}
      <div className="transparent-tabs count-tabs scrollable-tabs" data-new={newTabs}>
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
      </div>

      <div className="scrollable-tabs flex items-center gap-2">
        {PRODUCTS.map((p) => (
          <Chip
            key={p.id}
            label={p.label}
            type="single"
            size="small"
            selected={p.id === product.id}
            onClick={() =>
              setQueryState(
                withQuery(pathname, searchParams, { product: p.id === "all" ? null : p.id }),
                "replace",
              )
            }
          />
        ))}
      </div>

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
