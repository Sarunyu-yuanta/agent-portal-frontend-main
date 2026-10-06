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
import { ClipboardTextIcon, RowsIcon, SquaresFourIcon } from "@phosphor-icons/react";
import { Button, Chip, TabGroup } from "@sarunyu/system-one";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { useStoredIds } from "@/hooks/use-stored-ids";
import { FadeIn } from "@/components/ui/fade-in";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { setQueryState, withQuery } from "@/lib/query-state";
import { OrderBookCard } from "./OrderBookCard";
import { OrderBookTable } from "./OrderBookTable";
import { OrderSubmissionCard } from "./OrderSubmissionCard";
import { OrderSubmissionTable } from "./OrderSubmissionTable";
import { OrderBooksSkeleton } from "./OrderSkeletons";
import { booksOf, entriesFor, orderRowsOf } from "./order-entries";
import { ViewToggle, type ViewOption } from "./ViewToggle";
import { useOrderBooks } from "./use-order-books";

/**
 * The three things an IC does here — and they are not three states of one
 * object.
 *
 * The first tab lists **products**: one row per book with a round still being
 * filled, because there is one open round on a book and one decision to make
 * about it. The other two list **orders**, one row each. A book that has sent
 * three rounds has three orders with three references and three answers, and
 * folding them into one row per product meant two of them were invisible here
 * and the third wore figures the reader could not attribute. See
 * `order-entries`.
 *
 * `collecting` and `ready` share the first tab because both are the IC's move —
 * one needs more clients, the other needs sending — and splitting them would
 * put the single most actionable state behind a tab that is empty most of the
 * time. The status tag on each card still tells them apart at a glance.
 *
 * ── Wording ──────────────────────────────────────────────────────────────────
 * The last two name the thing they list, because that is what they list: both
 * read "คำสั่งซื้อ …", the same word the book page's own tab uses for the same
 * object. They used to read "ส่งคำสั่งซื้อแล้ว" and "เสร็จสิ้น" — a past-tense
 * action beside a bare state, neither saying what was finished — which was left
 * over from when both tabs listed products rather than orders.
 *
 * The first keeps "จอง" rather than joining them: it lists books being filled,
 * not orders, and "รายการจอง" inside a book is the same word for the same
 * thing.
 */
const TABS: { id: string; title: string; empty: { title: string; body: string } }[] = [
  {
    id: "open",
    title: "กำลังดำเนินการจอง",
    empty: {
      title: "ยังไม่มีรายการที่กำลังจอง",
      body: "เริ่มจองให้ลูกค้าได้จากหน้าสินค้าใน Product Catalog — การจองจะมารวมกันที่นี่",
    },
  },
  {
    id: "sent",
    title: "คำสั่งซื้อรอผล",
    empty: {
      title: "ยังไม่มีคำสั่งซื้อที่รอผล",
      body: "เมื่อรอบไหนครบยอดและส่งเข้าระบบหลังบ้านแล้ว คำสั่งซื้อใบนั้นจะมารออยู่ที่นี่",
    },
  },
  {
    id: "done",
    title: "คำสั่งซื้อเสร็จสิ้น",
    empty: {
      title: "ยังไม่มีคำสั่งซื้อที่เสร็จสิ้น",
      body: "คำสั่งซื้อที่ระบบหลังบ้านตอบกลับแล้ว ทั้งที่สำเร็จและถูกปฏิเสธ จะอยู่ที่นี่",
    },
  },
];

/**
 * Three to a row once there is room, two from tablet up, one on a phone.
 *
 * Shared by both kinds of card and by the skeleton that stands in for them, so
 * the page cannot reflow when the real rows land — and so a column count is
 * changed in one place rather than three.
 *
 * Three rather than two because a card is read down its left edge: the product,
 * the round, the amount. None of that needs half a wide screen, and at two to a
 * row a desk with eight books was a scroll instead of a glance.
 */
/**
 * `items-start` so each card is as tall as its own contents.
 *
 * A grid stretches its items by default, which meant one card carrying the
 * "รอผลจากระบบหลังบ้าน" block made every other card in its row grow a matching
 * strip of empty white — padding that looked like something had failed to
 * render. Cards here are read one at a time, not compared row by row, so there
 * is nothing for a shared baseline to line up.
 */
const CARD_GRID = "grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3";

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
 * How the same books are laid out: a card each, or a row each.
 *
 * Cards first because that is the shape the page was designed in; the table is
 * for the IC with a dozen books open, where lining the amounts and statuses up
 * in columns is what makes them comparable.
 */
const VIEWS: ViewOption[] = [
  { id: "card", label: "มุมมองการ์ด", Icon: SquaresFourIcon },
  { id: "table", label: "มุมมองตาราง", Icon: RowsIcon },
];

/** `false` during the hydration render, `true` from the render after it. */
const subscribeNever = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

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
  /** The two tabs whose rows are orders rather than books. */
  const isOrderTab = activeId !== "open";

  // A refinement rather than a destination, so `replace` — the back button
  // should leave the page, not step back through every chip clicked on it.
  const requestedProduct = searchParams.get("product");
  const product = PRODUCTS.find((p) => p.id === requestedProduct) ?? PRODUCTS[0];
  // Same reasoning as the product chip — a layout preference is a refinement of
  // the page, not a place on it, so `replace`. It still lives in the URL so a
  // book's "back to Order Management" returns to the view it was opened from.
  const requestedView = searchParams.get("view");
  const view = VIEWS.find((v) => v.id === requestedView) ?? VIEWS[0];

  const ofProduct = useMemo(
    () => (product.desk ? books.filter((b) => b.desk === product.desk) : books),
    [books, product],
  );

  // Tab badges count within the chosen product, so the number on a tab is
  // what clicking it would actually show — books on the first tab, orders on
  // the other two.
  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((t) => [t.id, entriesFor(t.id, ofProduct).length]),
      ) as Record<string, number>,
    [ofProduct],
  );

  const visible = useMemo(() => entriesFor(activeId, ofProduct), [activeId, ofProduct]);

  // ── What is new on each tab ────────────────────────────────────────────────
  // Same mechanism as the header bell's unread badge: ids in localStorage,
  // pruned to the ones still live so the entry cannot grow without bound.
  const liveKeys = useMemo(
    () => new Set(TABS.flatMap((t) => entriesFor(t.id, books).map((e) => e.key))),
    [books],
  );
  const isKnown = useCallback((id: string) => liveKeys.has(id), [liveKeys]);
  const [seen, setSeen] = useStoredIds("orders:seen-tabs", isKnown);

  const keysOn = useCallback(
    (tabId: string) => entriesFor(tabId, ofProduct).map((e) => e.key),
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

      <div className="flex items-center gap-3">
        <div className="scrollable-tabs flex min-w-0 flex-1 items-center gap-2">
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

        <ViewToggle
          options={VIEWS}
          value={view.id}
          onChange={(id) =>
            setQueryState(
              withQuery(pathname, searchParams, {
                view: id === VIEWS[0].id ? null : id,
              }),
              "replace",
            )
          }
        />
      </div>

      {/* Loading sits above the empty check — otherwise, once orders have a real
          endpoint, every visit flashes "ยังไม่มีรายการจอง" before the data
          lands. The project-wide rule, see `docs/handover.md`. */}
      {isLoading ? (
        view.id === "table" ? (
          isOrderTab ? (
            <OrderSubmissionTable rows={[]} isLoading />
          ) : (
            <OrderBookTable books={[]} isLoading />
          )
        ) : (
          <OrderBooksSkeleton />
        )
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon size={40} className="text-[var(--text-default-placeholder)]" />}
          title={active.empty.title}
          body={active.empty.body}
          actionSlot={
            // Only the first tab has somewhere to send them: an order appears
            // here by being sent, not by being started, so "go and book
            // something" is not the next step on the other two.
            activeId === "open" ? (
              <Link href="/product-catalog/product">
                <Button variant="outline" size="md">
                  ไปที่ Product Catalog
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        // Keyed on both, so switching either the tab or the layout replays the
        // fade — the rows change completely in both cases.
        <FadeIn key={`${activeId}|${view.id}`}>
          {isOrderTab ? (
            view.id === "table" ? (
              <OrderSubmissionTable rows={orderRowsOf(visible)} />
            ) : (
              <div className={CARD_GRID}>
                {orderRowsOf(visible).map((row) => (
                  <OrderSubmissionCard key={row.submission.id} row={row} />
                ))}
              </div>
            )
          ) : view.id === "table" ? (
            <OrderBookTable books={booksOf(visible)} />
          ) : (
            <div className={CARD_GRID}>
              {booksOf(visible).map((book) => (
                <OrderBookCard key={book.productId} book={book} />
              ))}
            </div>
          )}
        </FadeIn>
      )}
    </div>
  );
}
