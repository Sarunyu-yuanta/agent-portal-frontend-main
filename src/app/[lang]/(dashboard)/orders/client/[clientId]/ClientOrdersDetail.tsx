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
import {
  ArrowLeftIcon,
  CaretRightIcon,
  ClipboardTextIcon,
} from "@phosphor-icons/react";
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
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { useSectionBack } from "@/hooks/use-section-back";
import { usePrivacy } from "@/contexts/privacy-context";
import { getClientProfile } from "@/data/client-profiles";
import { IC_NAME } from "@/lib/current-ic";
import { getInitial } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import type { Booking, Client, OrderBook } from "@/types/domain";
import { checksAtBooking, dealStatus, emailStatus, paymentStatus } from "../../booking-status";
import {
  formatLogTime,
  formatOrderAmount,
  type BookingPhase,
  BOOKING_PHASES,
  BOOKING_PHASE_LABEL,
  BOOKING_PHASE_VARIANT,
  bookingPhase,
} from "../../order-book";
import { ORDER_WORDS } from "../../order-words";
import {
  bookingModeForDesk,
  findBookableProduct,
  ordersListHref,
  type BookableProduct,
  type Desk,
} from "../../bookable-products";

/** Stands in while no booking is open — see `OrderRecordsTable`. */
const FALLBACK_PRODUCT = { id: "", tags: [], currency: "", minInvestment: "0" } as unknown as BookableProduct;
import { BookingDetailModal } from "../../BookingDetailModal";
import { useClientReadiness } from "../../use-order-books";
import { useToasts } from "@/hooks/use-toasts";
import { useOrderBooks } from "../../use-order-books";

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
  const { isPrivate } = usePrivacy();
  /** The booking whose receipt is open — the same sheet the list opens. */
  const [opened, setOpened] = useState<{ book: OrderBook; booking: Booking } | null>(null);
  const { toasts, addToast, removeToast } = useToasts();
  const openedProduct = opened ? findBookableProduct(opened.book.productId) : undefined;
  const readiness = useClientReadiness(client, openedProduct ?? FALLBACK_PRODUCT);
  const { data: books } = useOrderBooks();
  const back = useSectionBack(() => `${ordersListHref(tabId)}`);

  const profile = getClientProfile(client.id);
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
            (b) => b.clientId === client.id && b.createdBy === IC_NAME,
          ),
        }))
        .filter((h) => h.bookings.length > 0)
        .sort((a, b) => b.book.productName.localeCompare(a.book.productName)),
    [books, desk, client.id],
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
            aria-label="กลับไป Order Management"
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
              {client.riskProfile && (
                <Tag text={client.riskProfile} variant="blue" size="large" />
              )}
            </div>
            <p className="type-caption truncate text-muted-foreground">
              {client.id} · บัญชี {profile.accountNo} · {desk}
            </p>
          </div>
        </div>

        {/* Their figures, not the deal's: a total they actually own, a count,
            and where their bookings stand. No progress bar — filling is the
            basket's business and the basket is not theirs. */}
        <div className="flex flex-col justify-center gap-0.5 self-stretch border-l border-border px-6">
          <span className="type-caption whitespace-nowrap text-muted-foreground">
            ยอดรวมของลูกค้า
          </span>
          <div className="flex flex-col">
            {totals.size === 0 ? (
              <span className="type-body-2 text-muted-foreground">—</span>
            ) : (
              [...totals].map(([currency, amount]) => (
                <span
                  key={currency}
                  className="type-h5 font-bold whitespace-nowrap tabular-nums text-foreground"
                >
                  {formatOrderAmount(amount, currency)}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-0.5 self-stretch border-l border-border px-6">
          <span className="type-caption whitespace-nowrap text-muted-foreground">สินค้า</span>
          <span className="type-body-2 !font-semibold whitespace-nowrap tabular-nums text-foreground">
            {holdings.length} รายการ
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 self-stretch border-l border-border pl-6">
          {BOOKING_PHASES.filter((p) => phases.get(p)).map((p) => (
            <Tag
              key={p}
              text={`${BOOKING_PHASE_LABEL[mode][p]} ${phases.get(p)}`}
              variant={BOOKING_PHASE_VARIANT[p]}
              size="large"
            />
          ))}
        </div>
      </header>

      {holdings.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon size={40} className="text-[var(--text-default-placeholder)]" />}
          title="ยังไม่มีรายการจองในหมวดนี้"
          body={`${name} ยังไม่มีการจอง ${desk} — เริ่มจองได้จากหน้าสินค้าใน Product Catalog`}
          actionSlot={
            <Link href={catalogHref}>
              <Button variant="outline" size="md">
                ไปที่ Product Catalog
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="relative overflow-x-auto overflow-y-hidden table-scroll rounded-lg border border-[var(--border-default)]">
          <Table className="table-fixed min-w-[880px]">
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-[34%]">สินค้า</TableHeaderCell>
                <TableHeaderCell className="w-[18%] whitespace-nowrap">ยอดจอง</TableHeaderCell>
                <TableHeaderCell className="w-[16%] whitespace-nowrap">สถานะดีล</TableHeaderCell>
                <TableHeaderCell className="w-[16%] whitespace-nowrap">ชำระเงิน</TableHeaderCell>
                <TableHeaderCell className="w-[16%] whitespace-nowrap">อัปเดตล่าสุด</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holdings.flatMap(({ book, bookings }) =>
                // One row per booking, not per product: a client can be booked
                // into the same product twice, and the two can be at different
                // steps — collapsing them would have to pick one status.
                bookings.map((b) => {
                  const deal = dealStatus(b, book);
                  const payment = paymentStatus(b, book);
                  const email = emailStatus(b, book);
                  const cancelled = b.status === "cancelled";
                  const struck = cancelled
                    ? "text-muted-foreground line-through"
                    : "text-foreground";
                  return (
                    <TableRow
                      key={b.id}
                      hoverable
                      tabIndex={0}
                      aria-label={`ดูดีล ${book.productName}`}
                      className="cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a6ee7] active:bg-[var(--bg-default-pressed)]"
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
                              {ORDER_WORDS[book.mode].placedAt} {formatLogTime(b.createdAt)}
                            </p>
                          </div>
                          <CaretRightIcon
                            size={14}
                            className="shrink-0 text-muted-foreground"
                          />
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
                          <p className="type-caption whitespace-nowrap tabular-nums text-muted-foreground">
                            {formatLogTime(book.logs[0]?.at ?? b.createdAt)}
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
      {openedProduct && opened && (
        <BookingDetailModal
          booking={opened.booking}
          book={opened.book}
          product={openedProduct}
          checks={checksAtBooking(opened.booking, readiness.items)}
          deal={dealStatus(opened.booking, opened.book)}
          payment={paymentStatus(opened.booking, opened.book)}
          email={emailStatus(opened.booking, opened.book)}
          onClose={() => setOpened(null)}
          onNotice={(message, status) => addToast({ message, status })}
        />
      )}
      <Toaster items={toasts} onRemove={removeToast} />
    </div>
  );
}
