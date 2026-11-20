"use client";

/**
 * A desk's orders, **one row per record** — the layout all seven of Order
 * Management's tabs now share.
 *
 * It has been two other shapes. One row per *product* was the shape the data is
 * stored in, and an IC had to read the list end to end to answer "what has this
 * client got". One row per *client*, with an accordion onto their records,
 * fixed that but bought a different problem: every column had to describe a
 * group. "ยอดรวม" summed currencies, "สถานะ" became a row of counted tags that
 * ran to three or four colours at once, and reaching an actual record took two
 * clicks.
 *
 * A record is what the IC acts on, so a record is the row — the same shape
 * `TransactionsPanel` lists stock, TFEX and mutual fund trades in, which is
 * what makes all seven tabs read the same way. Clicking one opens
 * `BookingDetailModal`, its own receipt, over the list rather than away from it.
 *
 * **Two kinds of record, one list.** A booking, and an offer that has produced
 * no booking yet (`openOffersFor`). The offer row carries no amount — nothing
 * has been committed — and opens its own receipt (`ProposalDetailModal`)
 * rather than the booking's, because there is no booking behind it.
 *
 * **Only this IC's own clients.** A basket is shared across the desk: the book
 * for one product holds every IC's bookings, and its notional is the whole
 * desk's. An IC reading a basket was reading other people's clients, which is
 * why this list exists — so it keeps only what `createdBy` says is theirs. The
 * product page's Order tab is the opposite scope, and deliberately.
 *
 * **What a row cannot say**, and does not try to: how full a book is, as a
 * figure of its own. The fill belongs to a deal, not to one person's record of
 * it, so it sits as a quiet line under the product rather than in a column
 * about the record.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppPathname } from "@/i18n/navigation";
import { setQueryState, withQuery } from "@/lib/query-state";
import {
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
  Toaster,
  type ToastStatus,
} from "@sarunyu/system-one";
import { TableRowsSkeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { useOrders } from "@/features/orders/store/orders-context";
import { useClients } from "@/hooks/use-api";
import { useToasts } from "@/hooks/use-toasts";
import { TABLE_EMPTY_MIN_HEIGHT, TableEmptyOverlay } from "@/components/ui/empty-state";
import { getAccountIdentity } from "@/mocks/client-profiles";
import { IC_NAME } from "@/features/auth/lib/current-ic";
import { maskName } from "@/lib/mask-name";
import type { Booking, OrderBook, ProposalLog } from "@/types/domain";
import {
  USD_THB,
  formatLogTime,
  formatOrderAmount,
  headlineRound,
  ownBookings,
  quotaUsedPct,
  type OrderStepFilter,
} from "@/features/orders/lib/order-book";
import { openOffersFor } from "@/features/orders/lib/order-proposals";
import { ProposalChip } from "./ProposalChip";
import { BookingDetailModal } from "./BookingDetailModal";
import { ProposalDetailModal } from "./ProposalDetailModal";
import {
  checksAtBooking,
  dealStatus,
  emailStatus,
  paymentStatus,
} from "@/features/orders/lib/booking-status";
import {
  findBookableProduct,
  type BookableProduct,
  type BookingMode,
} from "@/features/orders/lib/bookable-products";
import { useOrderBook, useRosterReadiness } from "@/features/orders/hooks/use-order-books";
import { useT } from "@/i18n/I18nProvider";
import type { Dictionary } from "@/i18n/dictionaries/th";
import { useLocale } from "@/i18n/I18nProvider";

const COLUMNS = 5;
const PAGE_SIZE = 12;

/**
 * Stands in while no booking is open, so `useRosterReadiness` can be called
 * unconditionally.
 *
 * Its verdict is never read — the modal only renders once a real product has
 * resolved — and it asks for the strictest risk rating there is, so a future
 * edit that *did* read it could not let anything through by accident. Same
 * bargain `PLACEHOLDER_CLIENT` strikes in the booking form.
 */
const FALLBACK_PRODUCT = {
  id: "",
  tags: [],
  currency: "",
  minInvestment: "0",
} as unknown as BookableProduct;

/**
 * One line of the list.
 *
 * `booking` and `offer` are exclusive — a row is one or the other. Both carry
 * their book, because every column after the client reads off it.
 */
type OrderRow = {
  id: string;
  at: string;
  book: OrderBook;
  clientId: string;
  clientName: string;
  booking?: Booking;
  offer?: ProposalLog;
};

/** Every record on these books that belongs to the signed-in IC, newest first. */
function buildRows(
  books: OrderBook[],
  isPrivate: boolean,
  step: OrderStepFilter,
  proposals: ProposalLog[],
): OrderRow[] {
  const rows: OrderRow[] = [];

  for (const book of books) {
    // `offered` is not a booking phase and `ownBookings` cannot filter by it —
    // at that step no booking qualifies, and only the offers below do.
    if (step !== "offered") {
      for (const booking of ownBookings(book, IC_NAME, step)) {
        rows.push({
          id: booking.id,
          at: booking.createdAt,
          book,
          clientId: booking.clientId,
          clientName: maskName(booking.clientName, isPrivate),
          booking,
        });
      }
    }
    // Offers with nothing behind them yet — the step before a booking. Only
    // under "ทั้งหมด" and "ส่ง Proposal แล้ว": every other chip names a phase a
    // booking is at, and an offer is at none of them.
    if (step === null || step === "offered") {
      for (const offer of openOffersFor(proposals, book, IC_NAME)) {
        rows.push({
          id: offer.id,
          at: offer.sentAt,
          book,
          clientId: offer.clientId,
          clientName: maskName(offer.clientName, isPrivate),
          offer,
        });
      }
    }
  }

  return rows.sort((a, b) => b.at.localeCompare(a.at));
}

type SortKey = "at" | "client" | "product" | "amount";
type SortDir = "none" | "asc" | "desc";

/**
 * What a column sorts on.
 *
 * Amounts compare as money, not as digits: a row in USD beside one in THB
 * would otherwise sort by the numeral, putting 20,000 USD under 95,000 THB.
 * An offer has no amount and sorts as zero — it has committed nothing, which
 * is where the bottom of that column belongs.
 */
function sortValue(row: OrderRow, key: SortKey): string | number {
  switch (key) {
    case "client":
      return row.clientName;
    case "product":
      return row.book.productName;
    case "amount":
      return row.booking ? row.booking.amount * (row.book.currency === "USD" ? USD_THB : 1) : 0;
    case "at":
      return row.at;
  }
}

/** The book's own fill, in the terms that book has — one line under the product. */
function fillLine(book: OrderBook, mode: BookingMode, t: Dictionary): string {
  const target = book.targetAmount.toLocaleString("en-US");
  if (mode === "quota") {
    return t.orders.records.quotaFill(
      book.quotaUsed.toLocaleString("en-US"),
      target,
      Math.round(quotaUsedPct(book)),
    );
  }
  // `headlineRound`, not `bookedAmount`: that counts only bookings no order has
  // carried yet, so a basket the back office has already collected reads
  // "0 / 100,000" — it filled, which is precisely why it is gone.
  const round = headlineRound(book);
  return t.orders.records.basketFill(
    round.amount.toLocaleString("en-US"),
    target,
    Math.round(round.pct),
  );
}

export function OrderRecordsTable({
  books,
  mode,
  step,
  isLoading,
  clientId,
}: {
  /** One client's rows only — see the panels' `clientId`. */
  clientId?: string;
  /** Already narrowed to one desk by the panel, which applied `step` too. */
  books: OrderBook[];
  /** This desk's booking mode — what the fill line reads. */
  mode: BookingMode;
  /** The chip's step, or `null` on "ทั้งหมด" — see `bookingPhaseSteps`. */
  step: OrderStepFilter;
  isLoading?: boolean;
}) {
  const locale = useLocale();
  const t = useT();
  const { isPrivate } = usePrivacy();
  const { proposals, bookings: allBookings } = useOrders();
  const clients = useClients();

  // Local, like the other order tables': the page has no use for the sort, and
  // the default (newest first) is what an unsorted list already gives.
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "at", dir: "none" });
  const dirFor = (key: SortKey): SortDir =>
    sort.key === key && sort.dir !== "none" ? sort.dir : "none";
  const onSort = (key: SortKey) => (next: SortDir) => setSort({ key, dir: next });
  const [page, setPage] = useState(1);

  /** The booking whose receipt is open, with the book it belongs to. */
  const [opened, setOpened] = useState<{ book: OrderBook; booking: Booking } | null>(null);
  /** The same, for an offer — its own sheet, since it has no booking. */
  const [openedOffer, setOpenedOffer] = useState<{ book: OrderBook; offer: ProposalLog } | null>(
    null,
  );
  // The modal reports a cancellation somewhere, and the table is the only thing
  // mounted around it — the panels above are a search box and a chip row.
  const { toasts, addToast, removeToast } = useToasts();
  const notice = (message: string, status: ToastStatus) => addToast({ message, status });
  // The receipt reads the LIVE book and booking, not the snapshot taken when
  // the row was clicked. A snapshot kept "ยกเลิก" on offer after the back office
  // had already picked the order up, because it never saw the change.
  const { data: liveBook } = useOrderBook(opened?.book.productId ?? "");
  const live = opened
    ? {
        book: liveBook ?? opened.book,
        booking: allBookings.find((b) => b.id === opened.booking.id) ?? opened.booking,
      }
    : null;
  const openedProduct = opened ? findBookableProduct(opened.book.productId) : undefined;
  const offerProduct = openedOffer ? findBookableProduct(openedOffer.book.productId) : undefined;
  const readiness = useRosterReadiness(clients, openedProduct ?? FALLBACK_PRODUCT);

  /**
   * The order to point at — `?flash=<submissionId>`, set by the bell's order
   * receipt ("ดูใน Order Management"). Its bookings pulse, then stay tinted,
   * with the same `.row-just-added` a product's Order tab uses for a booking
   * just placed.
   *
   * Read once and then taken out of the URL, so a refresh or a back-navigation
   * shows an ordinary list rather than replaying the pulse. Not while loading:
   * the skeleton is a different instance from the real table, and consuming
   * the param there would leave the real one nothing to read.
   */
  const pathname = useAppPathname();
  const searchParams = useSearchParams();
  const [flashId] = useState(() => searchParams.get("flash"));

  const flashBookingIds = useMemo(() => {
    if (!flashId) return new Set<string>();
    for (const book of books) {
      const submission = book.submissions.find((s) => s.id === flashId);
      if (submission) return new Set(submission.bookingIds);
    }
    return new Set<string>();
  }, [books, flashId]);
  const flashFound = flashBookingIds.size > 0;
  useEffect(() => {
    if (isLoading || !searchParams.get("flash")) return;
    // An id that matches no order here (stale bell row, hand-edited link)
    // would otherwise just show the plain list — say why nothing is pointed at.
    if (!flashFound) addToast({ message: t.states.notFoundOrder, status: "warning" });
    setQueryState(withQuery(pathname, searchParams, { flash: null }), "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, as the param is consumed
  }, [isLoading, pathname, searchParams]);
  const flashRowRef = useRef<HTMLTableRowElement | null>(null);

  const rows = useMemo(() => {
    const all = buildRows(books, isPrivate, step, proposals);
    const built = clientId ? all.filter((r) => r.clientId === clientId) : all;
    if (sort.dir === "none") return built;
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...built].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      return sign * (av < bv ? -1 : av > bv ? 1 : 0);
    });
  }, [books, isPrivate, step, proposals, sort, clientId]);

  // Land on the page holding the order's first row — once, as soon as the rows
  // are there. Adjusted during render rather than in an effect, so the first
  // page never paints first. Paging away afterwards is the IC's own choice.
  const [flashPaged, setFlashPaged] = useState(false);
  if (!flashPaged && flashBookingIds.size > 0) {
    const index = rows.findIndex((r) => r.booking && flashBookingIds.has(r.booking.id));
    if (index >= 0) {
      setFlashPaged(true);
      setPage(Math.floor(index / PAGE_SIZE) + 1);
    }
  }

  const isEmpty = !isLoading && rows.length === 0;
  /** A receipt needs its product; one that is gone gets a toast, not a dead click. */
  const openIfProduct = (book: OrderBook, open: () => void) => {
    if (findBookableProduct(book.productId)) open();
    else notice(t.states.notFoundProduct, "warning");
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // Clamped rather than reset: a filter that shortens the list past the current
  // page should land on the last one, not silently on an empty table.
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  // Bring the order's first row into view — once, on arrival.
  const flashLanded = useRef(false);
  useEffect(() => {
    if (flashLanded.current || !flashRowRef.current) return;
    flashLanded.current = true;
    flashRowRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
  });
  const firstFlashId = visible.find((r) => r.booking && flashBookingIds.has(r.booking.id))?.id;

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`table-scroll relative overflow-x-auto overflow-y-hidden rounded-lg border border-[var(--border-default)] ${isEmpty ? TABLE_EMPTY_MIN_HEIGHT : ""}`}
      >
        <Table className="min-w-[880px] table-fixed">
          <TableHead>
            <TableRow>
              <TableHeaderCell
                className="w-[15%] whitespace-nowrap"
                sortDirection={dirFor("at")}
                onSortChange={onSort("at")}
              >
                {t.orders.list.col.time}
              </TableHeaderCell>
              <TableHeaderCell
                className="w-[24%]"
                sortDirection={dirFor("client")}
                onSortChange={onSort("client")}
              >
                {t.orders.list.col.client}
              </TableHeaderCell>
              <TableHeaderCell
                className="w-[30%] whitespace-nowrap"
                sortDirection={dirFor("product")}
                onSortChange={onSort("product")}
              >
                {t.orders.list.col.product}
              </TableHeaderCell>
              <TableHeaderCell
                className="w-[15%] text-right whitespace-nowrap"
                sortDirection={dirFor("amount")}
                onSortChange={onSort("amount")}
              >
                {t.orders.list.col.quantity}
              </TableHeaderCell>
              <TableHeaderCell className="w-[16%] whitespace-nowrap">
                {t.orders.list.col.status}
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRowsSkeleton columns={COLUMNS} />
            ) : (
              visible.map((row) => {
                const profile = getAccountIdentity(row.clientId);
                const booking = row.booking;
                const offer = row.offer;
                const deal = booking ? dealStatus(booking, row.book, t) : null;
                // Each kind opens its own receipt — see the module note.
                const open = booking
                  ? () => openIfProduct(row.book, () => setOpened({ book: row.book, booking }))
                  : offer
                    ? () => openIfProduct(row.book, () => setOpenedOffer({ book: row.book, offer }))
                    : undefined;
                return (
                  <TableRow
                    key={row.id}
                    hoverable={Boolean(open)}
                    tabIndex={open ? 0 : undefined}
                    aria-label={
                      open
                        ? t.orders.list.openRowAria(row.book.productName, row.clientName)
                        : undefined
                    }
                    onClick={open}
                    onKeyDown={
                      open
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              open();
                            }
                          }
                        : undefined
                    }
                    ref={row.id === firstFlashId ? flashRowRef : undefined}
                    className={
                      [
                        open
                          ? "cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#0a6ee7] focus-visible:outline-none focus-visible:ring-inset active:bg-[var(--bg-default-pressed)]"
                          : "",
                        booking && flashBookingIds.has(booking.id) ? "row-just-added" : "",
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                  >
                    <TableCell>
                      <p className="type-caption whitespace-nowrap text-muted-foreground tabular-nums">
                        {formatLogTime(row.at, locale)}
                      </p>
                    </TableCell>

                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="type-body-2 truncate !font-semibold text-foreground">
                          {row.clientName}
                        </p>
                        <p className="type-caption truncate text-muted-foreground">
                          {t.orders.list.clientAccount(row.clientId, profile.accountNo)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="type-body-2 truncate !font-semibold text-foreground">
                          {row.book.productName}
                        </p>
                        {/* The deal's own fill under the product it belongs to,
                            so a figure about the deal never sits in a column
                            about the record. */}
                        <p className="type-caption truncate text-muted-foreground tabular-nums">
                          {row.book.productType} · {fillLine(row.book, mode, t)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {booking ? (
                        <span
                          className={`type-body-2 !font-semibold whitespace-nowrap tabular-nums ${
                            booking.status === "cancelled"
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {formatOrderAmount(booking.amount, row.book.currency)}
                        </span>
                      ) : (
                        // Nothing has been committed, and a figure here would be
                        // the IC's hope rather than the client's money.
                        <span className="type-body-2 text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {deal ? (
                        // `large`, the component's own default: the สถานะ
                        // column is the one an IC scans down, and `small` set
                        // it two sizes under every other value in the row.
                        <Tag text={deal.text} variant={deal.variant} size="large" />
                      ) : (
                        // Not a `Tag` — see `ProposalChip` for why. `lg` so it
                        // sits on the same line as the tags it shares a column
                        // with.
                        <ProposalChip size="lg" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {/* The panels catch an empty desk before mounting this, but a client
            scope is applied in here — a client with nothing on the desk would
            otherwise get a bare header row. */}
        {isEmpty && <TableEmptyOverlay variant="empty" title={t.orders.list.emptyTitle} />}
      </div>

      {!isLoading && !isEmpty && (
        <div className="flex items-center justify-between gap-3">
          <span className="type-body-2 text-muted-foreground">
            {t.orders.list.totalRows(rows.length)}
          </span>
          {totalPages > 1 && (
            <Pagination totalPages={totalPages} currentPage={current} onPageChange={setPage} />
          )}
        </div>
      )}

      {/* Rendered whether or not one is open, so it can animate out. */}
      {openedProduct && live && (
        <BookingDetailModal
          booking={live.booking}
          book={live.book}
          product={openedProduct}
          checks={checksAtBooking(live.booking, readiness.get(live.booking.clientId)?.items ?? [])}
          deal={dealStatus(live.booking, live.book, t)}
          payment={paymentStatus(live.booking, live.book, t)}
          email={emailStatus(live.booking, live.book, t)}
          onClose={() => setOpened(null)}
          onNotice={notice}
        />
      )}
      {offerProduct && openedOffer && (
        <ProposalDetailModal
          proposal={openedOffer.offer}
          book={openedOffer.book}
          product={offerProduct}
          onClose={() => setOpenedOffer(null)}
        />
      )}
      <Toaster items={toasts} onRemove={removeToast} />
    </div>
  );
}
