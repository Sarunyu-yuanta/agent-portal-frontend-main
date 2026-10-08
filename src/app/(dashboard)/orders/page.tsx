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

import { Suspense, useMemo, useState } from "react";
import { redirect, usePathname, useSearchParams } from "next/navigation";
import { ClipboardTextIcon, RowsIcon, SquaresFourIcon } from "@phosphor-icons/react";
import { Button, Chip, Dropdown, SearchInput } from "@sarunyu/system-one";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { usePrivacy } from "@/contexts/privacy-context";
import { FadeIn } from "@/components/ui/fade-in";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import type { OrderBookStatus } from "@/types/domain";
import { OrderBookCard } from "./OrderBookCard";
import { OrderBookTable } from "./OrderBookTable";
import { OrderBooksSkeleton } from "./OrderSkeletons";
import { BOOK_STATUS_LABEL_TH, BOOK_STEPS } from "./order-book";
import { ViewToggle, type ViewOption } from "./ViewToggle";
import { useOrderBooks } from "./use-order-books";

/**
 * The steps a product moves through, as filter chips — see `OrderBookStatus`
 * for what each means. One row per product throughout: a product is booked
 * once and sent as one order, so there is never more than one thing about it to
 * list.
 *
 * A fixed list rather than one built from the books on screen, so a chip does
 * not vanish the moment its last product moves on.
 */
const STEPS: { id: OrderBookStatus | "all"; label: string; empty: string }[] = [
  { id: "all", label: "All", empty: "ยังไม่มีรายการจองซื้อ" },
  ...BOOK_STEPS.map((id) => ({
    id,
    label: BOOK_STATUS_LABEL_TH[id],
    empty: `ไม่มีรายการที่อยู่ในขั้น "${BOOK_STATUS_LABEL_TH[id]}"`,
  })),
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
 * Which kind of product to show — a dropdown in front of the search, because it
 * sets the scope the search then runs in.
 *
 * A dropdown rather than chips or tabs: the steps are the page's filter, and a
 * second row of chips competed with them. Matches `OrderBook.desk`, which is
 * what `bookable-products` labels each desk; a new desk is one more line here.
 */
const PRODUCT_TYPES: { id: string; label: string; desk: string | null }[] = [
  { id: "all", label: "ทุกประเภทสินค้า", desk: null },
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
  const { isPrivate } = usePrivacy();
  const [search, setSearch] = useState("");

  // A refinement rather than a destination, so `replace` — the back button
  // should leave the page, not step back through every chip clicked on it. In
  // the URL all the same, so a book's "back to Order Management" lands on the
  // step it was opened from.
  const requestedStep = searchParams.get("step");
  const step = STEPS.find((s) => s.id === requestedStep) ?? STEPS[0];
  const requestedType = searchParams.get("product");
  const productType = PRODUCT_TYPES.find((t) => t.id === requestedType) ?? PRODUCT_TYPES[0];
  // Same reasoning — a layout preference is a refinement, not a place.
  const requestedView = searchParams.get("view");
  const view = VIEWS.find((v) => v.id === requestedView) ?? VIEWS[0];

  // "Search All" — anything a product is recognised by: its name and type,
  // the desk, the order reference, and the clients booked into it.
  const matching = useMemo(() => {
    const ofType = productType.desk
      ? books.filter((book) => book.desk === productType.desk)
      : books;
    const query = search.trim().toLowerCase();
    if (!query) return ofType;
    return ofType.filter((book) =>
      [
        book.productName,
        book.productType,
        book.desk,
        ...book.submissions.map((s) => s.backendRef),
        ...book.allBookings.flatMap((b) => [b.clientId, maskName(b.clientName, isPrivate)]),
      ].some((text) => text.toLowerCase().includes(query)),
    );
  }, [books, productType, search, isPrivate]);

  const visible = useMemo(
    () => (step.id === "all" ? matching : matching.filter((b) => b.status === step.id)),
    [matching, step],
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="type-h5 font-bold text-foreground">รายการจองซื้อ</h1>

      {/* Scope first, then the query within it — read left to right. */}
      {/* Each control in a wrapper that owns its width. No `w-full` on the
          dropdown's wrapper: the component library's unlayered stylesheet also
          defines `.w-full`, which outranks Tailwind's `sm:w-[240px]` — the
          wrapper stayed 100% wide and, unshrinkable, pushed the search off the
          screen. On a phone the column's default stretch makes it full width. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-[240px] sm:shrink-0">
          <Dropdown
            value={productType.id}
            onChange={(id) =>
              setQueryState(
                withQuery(pathname, searchParams, { product: id === "all" ? null : id }),
                "replace",
              )
            }
            options={PRODUCT_TYPES.map((t) => ({ label: t.label, value: t.id }))}
            placeholder="ประเภทสินค้า"
            className="w-full"
          />
        </div>
        <div className="min-w-0 flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            placeholder="Search All"
            className="w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="scrollable-tabs flex min-w-0 flex-1 items-center gap-2">
          {STEPS.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              type="single"
              selected={s.id === step.id}
              onClick={() =>
                setQueryState(
                  withQuery(pathname, searchParams, { step: s.id === "all" ? null : s.id }),
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
          <OrderBookTable books={[]} isLoading />
        ) : (
          <OrderBooksSkeleton />
        )
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon size={40} className="text-[var(--text-default-placeholder)]" />}
          title={search ? "ไม่พบรายการที่ค้นหา" : step.empty}
          body={
            search
              ? "ลองค้นหาด้วยชื่อสินค้า เลขคำสั่งซื้อ หรือชื่อลูกค้า"
              : "เริ่มจองให้ลูกค้าได้จากหน้าสินค้าใน Product Catalog — การจองจะมารวมกันที่นี่"
          }
          actionSlot={
            search ? undefined : (
              <Link href="/product-catalog/product">
                <Button variant="outline" size="md">
                  ไปที่ Product Catalog
                </Button>
              </Link>
            )
          }
        />
      ) : (
        // Keyed on both, so switching either the step or the layout replays the
        // fade — the rows change completely in both cases.
        <FadeIn key={`${step.id}|${view.id}`}>
          {view.id === "table" ? (
            <OrderBookTable books={visible} />
          ) : (
            <div className={CARD_GRID}>
              {visible.map((book) => (
                <OrderBookCard key={book.productId} book={book} />
              ))}
            </div>
          )}
        </FadeIn>
      )}
    </div>
  );
}
