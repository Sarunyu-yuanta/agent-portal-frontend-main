"use client";

/**
 * One client's orders on one desk — the middle rung Order Management was
 * missing.
 *
 * The list above it is read by client (`OrderRecordsTable`) because a basket is
 * shared: the book for a product holds every IC's bookings and fills to a
 * notional none of them owns. That made "open the client" the natural next
 * step, and until this page there was nowhere for it to go — the only
 * drill-down was the book, which is the shared basket again.
 *
 * So the three rungs each answer a different question:
 *
 * 1. `/orders?tab=` — which of *my* clients have something on this desk
 * 2. here — what has *this* client got, and where is each of it
 * 3. `/orders/:productId` — will *that deal* fill (the whole desk's basket)
 *
 * Scoped to one desk rather than to everything the client holds: the IC arrived
 * from a desk tab and `?tab=` carries it, so the back button lands where they
 * left. Across all desks is Client 360's job.
 */

import { useMemo, useState } from "react";
import { ArrowLeftIcon, CaretRightIcon, ClipboardTextIcon } from "@phosphor-icons/react";
import {
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
  Toaster,
} from "@sarunyu/system-one";
import { LocaleLink as Link } from "@/i18n/navigation";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { OrdersPanelSkeleton } from "./OrdersPanelSkeleton";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { getInitial } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import {
  checksAtBooking,
  dealStatus,
  emailStatus,
  paymentStatus,
} from "@/features/orders/lib/booking-status";
import {
  formatLogTime,
  formatOrderAmount,
  type BookingPhase,
  BOOKING_PHASES,
  BOOKING_PHASE_VARIANT,
  bookingPhase,
} from "@/features/orders/lib/order-book";
import {
  bookingModeForDesk,
  findBookableProduct,
  ordersListHref,
  type BookableProduct,
  type Desk,
} from "@/features/orders/lib/bookable-products";

/** Stands in while no booking is open — see `OrderRecordsTable`. */
const FALLBACK_PRODUCT = {
  id: "",
  tags: [],
  currency: "",
  minInvestment: "0",
} as unknown as BookableProduct;
import { BookingDetailModal } from "./BookingDetailModal";
import { useClientReadiness } from "@/features/orders/hooks/use-order-books";
import { useToasts } from "@/hooks/use-toasts";
import { useOrderBook, useOrderBooks } from "@/features/orders/hooks/use-order-books";
import { useOrders } from "@/features/orders/store/orders-context";
import { useT } from "@/i18n/I18nProvider";
import { useLocale } from "@/i18n/I18nProvider";
import type { Client } from "@/types/client";
import type { Booking, OrderBook } from "@/types/order";
import { useAccountIdentity } from "@/features/clients/hooks/use-clients";
import { useCurrentIc } from "@/features/auth/hooks/use-current-ic";

/** One product this client holds, with their own bookings on it. */
type Holding = { book: OrderBook; bookings: Booking[] };

export function ClientOrdersDetail({
  client,
  desk,
  tabId,
  catalogHref,
}: {
  client: Client;
  desk: Desk;
  /** The `?tab=` the IC came from — what `back` and the catalogue link read. */
  tabId: string;
  catalogHref: string;
}) {
  const currentIc = useCurrentIc();
  const getAccountIdentity = useAccountIdentity();
  const locale = useLocale();
  const t = useT();
  const { isPrivate } = usePrivacy();
  /** The booking whose receipt is open — the same sheet the list opens. */
  const [opened, setOpened] = useState<{ book: OrderBook; booking: Booking } | null>(null);
  const { toasts, addToast, removeToast } = useToasts();
  // Live, not the snapshot from the click — see `OrderRecordsTable`.
  const { data: liveBook } = useOrderBook(opened?.book.productId ?? "");
  const { bookings: allBookings } = useOrders();
  const live = opened
    ? {
        book: liveBook ?? opened.book,
        booking: allBookings.find((b) => b.id === opened.booking.id) ?? opened.booking,
      }
    : null;
  const openedProduct = opened ? findBookableProduct(opened.book.productId) : undefined;
  const readiness = useClientReadiness(client, openedProduct ?? FALLBACK_PRODUCT);
  const {
    data: books,
    isLoading: booksLoading,
    error: booksError,
    retry: retryBooks,
  } = useOrderBooks();
  const back = useSectionBack(() => `${ordersListHref(tabId)}`);

  const profile = getAccountIdentity(client.id);
  const name = maskName(client.name, isPrivate);
  // One desk per page, so one mode — the same thing the panel resolved.
  const mode = bookingModeForDesk(desk);

  const holdings: Holding[] = useMemo(
    () =>
      books
        .filter((book) => book.desk === desk)
        .map((book) => ({
          book,
          // This IC's bookings for this client — the rest of the book is other
          // ICs' clients, the same filter the list applies.
          bookings: book.allBookings.filter(
            (b) => b.clientId === client.id && b.createdBy === currentIc.name,
          ),
        }))
        .filter((h) => h.bookings.length > 0)
        .sort((a, b) => b.book.productName.localeCompare(a.book.productName)),
    [books, desk, client.id, currentIc.name],
  );

  /** Their money on this desk, per currency — see `OrderRecordsTable`. */
  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const { book, bookings } of holdings) {
      for (const b of bookings) {
        // Phase, not `b.status` — see `OrderRecordsTable`'s own note: a
        // rejected booking is still `"booked"` and must not count.
        if (bookingPhase(b, book) === "cancelled") continue;
        map.set(book.currency, (map.get(book.currency) ?? 0) + b.amount);
      }
    }
    return map;
  }, [holdings]);

  const phases = useMemo(() => {
    const map = new Map<BookingPhase, number>();
    for (const { book, bookings } of holdings) {
      for (const b of bookings) {
        const phase = bookingPhase(b, book);
        map.set(phase, (map.get(phase) ?? 0) + 1);
      }
    }
    return map;
  }, [holdings]);

  return (
    <div className="flex w-full flex-col gap-4">
      {/* The same full-bleed band the book page wears, so the two drill-downs
          read as the same kind of page — see `OrderBookDetail` for the
          `-mx-[9999px]` trick and why the band has no rounding. */}
      <header className="-mx-[9999px] flex flex-wrap items-center gap-y-4 border-b border-border bg-card px-[9999px] py-4 xl:-mt-6">
        <div className="flex min-w-[320px] flex-1 items-center gap-2 pr-6">
          <Button
            variant="plain"
            size="icon-sm"
            onClick={back}
            aria-label={t.orders.clientPage.backToOrders}
            className="shrink-0"
          >
            <ArrowLeftIcon size={20} />
          </Button>
          <Avatar type="text" initials={getInitial(name)} size="s" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="type-h6 min-w-0 truncate font-bold text-foreground">{name}</h1>
              {/* The client's own rating, which is a fact about the person and
                  so belongs on the person's page. What any one product asks of
                  it is on that product's booking form. */}
              {client.riskProfile && <Tag text={client.riskProfile} variant="blue" size="large" />}
            </div>
            <p className="type-caption truncate text-muted-foreground">
              {t.orders.clientPage.subtitle(client.id, profile.accountNo, desk)}
            </p>
          </div>
        </div>

        {/* Their figures, not the deal's: a total they actually own, a count,
            and where their bookings stand. No progress bar — filling is the
            basket's business and the basket is not theirs. */}
        <div className="flex flex-col justify-center gap-0.5 self-stretch border-l border-border px-6">
          <span className="type-caption whitespace-nowrap text-muted-foreground">
            {t.orders.clientPage.clientTotal}
          </span>
          <div className="flex flex-col">
            {totals.size === 0 ? (
              <span className="type-body-2 text-muted-foreground">—</span>
            ) : (
              [...totals].map(([currency, amount]) => (
                <span
                  key={currency}
                  className="type-h5 font-bold whitespace-nowrap text-foreground tabular-nums"
                >
                  {formatOrderAmount(amount, currency)}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-0.5 self-stretch border-l border-border px-6">
          <span className="type-caption whitespace-nowrap text-muted-foreground">
            {t.orders.clientPage.products}
          </span>
          <span className="type-body-2 !font-semibold whitespace-nowrap text-foreground tabular-nums">
            {t.orders.clientPage.productCount(holdings.length)}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 self-stretch border-l border-border pl-6">
          {BOOKING_PHASES.filter((p) => phases.get(p)).map((p) => (
            <Tag
              key={p}
              text={`${t.orders.phase[mode][p]} ${phases.get(p)}`}
              variant={BOOKING_PHASE_VARIANT[p]}
              size="large"
            />
          ))}
        </div>
      </header>

      {booksLoading ? (
        <OrdersPanelSkeleton />
      ) : booksError ? (
        <ErrorState onRetry={retryBooks} />
      ) : holdings.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon size={40} className="text-[var(--text-default-placeholder)]" />}
          title={t.orders.clientPage.emptyTitle}
          body={t.orders.clientPage.emptyBody(name, desk)}
          actionSlot={
            <Link href={catalogHref}>
              <Button variant="outline" size="md">
                {t.orders.books.goToCatalog}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="table-scroll relative overflow-x-auto overflow-y-hidden rounded-lg border border-[var(--border-default)]">
          <Table className="min-w-[880px] table-fixed">
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-[34%]">
                  {t.orders.clientPage.col.product}
                </TableHeaderCell>
                <TableHeaderCell className="w-[18%] whitespace-nowrap">
                  {t.orders.clientPage.col.booked}
                </TableHeaderCell>
                <TableHeaderCell className="w-[16%] whitespace-nowrap">
                  {t.orders.clientPage.col.deal}
                </TableHeaderCell>
                <TableHeaderCell className="w-[16%] whitespace-nowrap">
                  {t.orders.clientPage.col.payment}
                </TableHeaderCell>
                <TableHeaderCell className="w-[16%] whitespace-nowrap">
                  {t.orders.clientPage.col.updated}
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holdings.flatMap(({ book, bookings }) =>
                // One row per booking, not per product: a client can be booked
                // into the same product twice, and the two can be at different
                // steps — collapsing them would have to pick one status.
                bookings.map((b) => {
                  const deal = dealStatus(b, book, t);
                  const payment = paymentStatus(b, book, t);
                  const email = emailStatus(b, book, t);
                  const cancelled = b.status === "cancelled";
                  const struck = cancelled
                    ? "text-muted-foreground line-through"
                    : "text-foreground";
                  return (
                    <TableRow
                      key={b.id}
                      hoverable
                      tabIndex={0}
                      aria-label={t.orders.clientPage.openDealAria(book.productName)}
                      className="cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#0a6ee7] focus-visible:outline-none focus-visible:ring-inset active:bg-[var(--bg-default-pressed)]"
                      // The booking's own receipt, over this page rather than
                      // away from it — the same sheet the list opens.
                      onClick={() => setOpened({ book, booking: b })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setOpened({ book, booking: b });
                        }
                      }}
                    >
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <p className="type-body-2 truncate !font-semibold text-foreground">
                              {book.productName}
                            </p>
                            <p className="type-caption truncate text-muted-foreground">
                              {book.productType} · {book.currency} ·{" "}
                              {t.orders.words[book.mode].placedAt}{" "}
                              {formatLogTime(b.createdAt, locale)}
                            </p>
                          </div>
                          <CaretRightIcon size={14} className="shrink-0 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`type-body-2 !font-semibold whitespace-nowrap tabular-nums ${struck}`}
                        >
                          {formatOrderAmount(b.amount, book.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Tag text={deal.text} variant={deal.variant} size="small" />
                      </TableCell>
                      <TableCell>
                        <Tag text={payment.text} variant={payment.variant} size="small" />
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 flex-col gap-1">
                          <p className="type-caption whitespace-nowrap text-muted-foreground tabular-nums">
                            {formatLogTime(book.logs[0]?.at ?? b.createdAt, locale)}
                          </p>
                          {/* The pre-confirmation, which has nowhere else to go
                              now that the table is five columns wide. */}
                          <Tag text={email.text} variant={email.variant} size="small" />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }),
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Rendered whether or not one is open, so it can animate out. */}
      {openedProduct && live && (
        <BookingDetailModal
          booking={live.booking}
          book={live.book}
          product={openedProduct}
          checks={checksAtBooking(live.booking, readiness.items)}
          deal={dealStatus(live.booking, live.book, t)}
          payment={paymentStatus(live.booking, live.book, t)}
          email={emailStatus(live.booking, live.book, t)}
          onClose={() => setOpened(null)}
          onNotice={(message, status) => addToast({ message, status })}
        />
      )}
      <Toaster items={toasts} onRemove={removeToast} />
    </div>
  );
}
