"use client";

/**
 * Everyone booked into a deal, with the four checks each was booked against —
 * the one booking table, in two places:
 *
 * - **`variant="product"`** — the "Order" tab of a product's page, with its own
 *   จองซื้อ and the deal's totals underneath. It answers "what happened after I
 *   pressed จองซื้อ" without leaving the page the booking was made from.
 * - **`variant="book"`** — the booking list on `/orders/[productId]`. That
 *   page's summary already carries the booking button and the totals, so the
 *   table comes without either.
 *
 * Two kinds of row, because the flow starts before a booking does: an **offer**
 * the IC sent and the client has not answered (no amount, no statuses), and a
 * **booking** once they have. Clicking either opens it — `OfferDetailModal`
 * or `BookingDetailModal`. Chips above the table sort them by phase; see
 * `bookingPhase` and `offerPhase`.
 *
 * Quota books (bonds) send each booking as its own order, so on the book page
 * their table carries one more column: ส่งคำสั่งซื้อ, live on a row whose funds
 * check has cleared and that has not gone out yet (`onSend`).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Chip,
  Pagination,
  SearchInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
  type ToastStatus,
} from "@sarunyu/system-one";
import {
  CheckCircleIcon,
  ClockIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { usePrivacy } from "@/contexts/privacy-context";
import { useClients } from "@/hooks/use-api";
import { getClientProfile } from "@/data/client-profiles";
import { IC_NAME } from "@/lib/current-ic";
import { maskName } from "@/lib/mask-name";
import type {
  Booking,
  ProductOffer,
  RequirementItem,
  RequirementKey,
  RequirementStatus,
} from "@/types/domain";
import type { BookableProduct } from "./bookable-products";
import { useOrderBook, useRosterReadiness } from "./use-order-books";
import {
  BOOKING_PHASES,
  BOOKING_PHASE_LABEL,
  bookingPhase,
  isBookingOpen,
  offerPhase,
  type BookingPhase,
} from "./order-book";
import { BookingDetailModal } from "./BookingDetailModal";
import { OfferDetailModal } from "./OfferDetailModal";
import { SendOfferModal } from "./SendOfferModal";
import {
  CLOSED_TAG,
  checksAtBooking,
  dealStatus,
  emailStatus,
  paymentStatus,
} from "./booking-status";

const PAGE_SIZE = 10;

/**
 * One line of the table: a client who was offered the product, or one whose
 * booking exists. `at` is whichever date the row sorts on, so the two kinds
 * interleave without the sort having to know which is which.
 */
type OrderRow =
  | { kind: "offer"; at: string; offer: ProductOffer }
  | { kind: "booking"; at: string; booking: Booking };


/**
 * Every cell's style, inline on purpose.
 *
 * The library gives each text cell `min-w-[284px]` (and the table `w-full`)
 * from an unlayered stylesheet, so every column took at least 284px and
 * a row read as scattered words. Neither utilities nor a scoped rule in
 * globals.css reliably beat it; an inline style always does.
 *
 * `width: 1%` with `nowrap` is the standard way to shrink an auto-layout column
 * to its content: the browser cannot go below the unwrapped text, so 1% means
 * "exactly as wide as this". Customer gets no width, so it takes what is left.
 * (Giving Customer `width: 100%` instead squeezed every other column to
 * nothing.)
 */
/** 12px a side instead of the library's 16 — keeps the one-line headers from spreading the row. */
const PAD = { paddingLeft: 12, paddingRight: 12 } as const;
const FIT = { ...PAD, minWidth: 0, width: "1%", whiteSpace: "nowrap" } as const;
const GROW = { ...PAD, minWidth: 0, whiteSpace: "nowrap" } as const;
/**
 * Every column after the name sits on its centre line — statuses, the amount
 * and its currency alike, so the right half of the row reads as one grid. Inline for the same reason as `FIT`: the library's
 * `text-left` on every header would beat a `text-center` class.
 */
const CENTER = { ...FIT, textAlign: "center" } as const;

/** The four checks, in the order the booking form shows them. */
const CHECK_COLUMNS: { key: RequirementKey; title: string }[] = [
  { key: "wealth", title: "Wealth Status" },
  { key: "acknowledge", title: "Acknowledge Status" },
  { key: "kyc", title: "KYC Status" },
  { key: "risk-profile", title: "Risk Profile Status" },
];

/** Same icon and colour per state as the booking form's status cards. */
const CHECK_ICON: Record<RequirementStatus, { icon: typeof CheckCircleIcon; fg: string }> = {
  passed: { icon: CheckCircleIcon, fg: "text-[var(--fill-green-600)]" },
  pending: { icon: ClockIcon, fg: "text-[var(--fill-yellow-600)]" },
  expired: { icon: WarningCircleIcon, fg: "text-[var(--fill-orange-600)]" },
  missing: { icon: XCircleIcon, fg: "text-[var(--fill-red-600)]" },
  failed: { icon: XCircleIcon, fg: "text-[var(--fill-red-600)]" },
};

export function ProductOrderSection({
  product,
  onBook,
  onNotice,
  newBookingId = null,
  onNewBookingSeen,
  variant = "product",
  onSend,
}: {
  product: BookableProduct;
  /** Opens the booking modal — the page owns it, and its toasts. */
  onBook: () => void;
  /** The page's toast stack — cancelling from the detail modal reports here. */
  onNotice: (message: string, status: ToastStatus) => void;
  /**
   * The booking just placed from this page, highlighted so the IC landing on
   * this tab after booking can see which row it made. Held by the page, so it
   * is gone once they leave it.
   */
  newBookingId?: string | null;
  /** Called once the IC has left this tab having seen {@link newBookingId}. */
  onNewBookingSeen?: () => void;
  /** Where the table sits — see the module note. */
  variant?: "product" | "book";
  /** Quota books only: send this one booking as its own order. */
  onSend?: (booking: Booking) => void;
}) {
  // Seen once is seen: leaving this tab — for Detail, or another page — clears
  // the highlight, so coming back shows an ordinary row rather than replaying
  // the pulse. Deferred a tick so StrictMode's simulated unmount, which
  // remounts at once and cancels it, does not clear it before it is seen.
  const seenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!newBookingId) return;
    if (seenTimer.current) clearTimeout(seenTimer.current);
    return () => {
      seenTimer.current = setTimeout(() => onNewBookingSeen?.(), 0);
    };
  }, [newBookingId, onNewBookingSeen]);

  const { data: book } = useOrderBook(product.id);
  const clients = useClients();
  const readiness = useRosterReadiness(clients, product);
  const { isPrivate } = usePrivacy();
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<BookingPhase | null>(null);
  const [page, setPage] = useState(1);
  // By id rather than the row itself, so a cancel from inside the modal shows
  // up in it straight away instead of in a stale copy.
  const [openId, setOpenId] = useState<string | null>(null);
  const [openOfferId, setOpenOfferId] = useState<string | null>(null);
  const [offering, setOffering] = useState(false);

  const rows = useMemo(() => {
    if (!book) return [] as OrderRow[];
    // One list, newest first, whichever kind a row is — an offer sent this
    // morning belongs above a booking from last week.
    const all: OrderRow[] = [
      ...book.allBookings.map((b) => ({ kind: "booking" as const, at: b.createdAt, booking: b })),
      ...book.offers.map((o) => ({ kind: "offer" as const, at: o.sentAt, offer: o })),
    ].sort((a, b) => b.at.localeCompare(a.at));
    const inPhase = phase
      ? all.filter((r) =>
          r.kind === "booking" ? bookingPhase(r.booking, book) === phase : offerPhase(r.offer) === phase,
        )
      : all;
    const query = search.trim().toLowerCase();
    if (!query) return inPhase;
    return inPhase.filter((r) => {
      const { clientId, clientName } = r.kind === "booking" ? r.booking : r.offer;
      return (
        maskName(clientName, isPrivate).toLowerCase().includes(query) ||
        maskName(getClientProfile(clientId).nameTh, isPrivate).includes(query) ||
        clientId.includes(query) ||
        getClientProfile(clientId).accountNo.includes(query)
      );
    });
  }, [book, phase, search, isPrivate]);

  if (!book) return null;

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // A search that shrinks the list can leave the page past its end.
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  // "IC" figures are this IC's own share of the deal; the others are the whole
  // deal, every IC's bookings together.
  const sentIds = new Set(
    book.submissions.filter((s) => s.status === "completed").flatMap((s) => s.bookingIds),
  );
  // The whole deal's live bookings, sent or not — a product is booked once, so
  // there is no "round being filled" to narrow the notional to.
  const notional = book.bookings.reduce((sum, b) => sum + b.amount, 0);
  const notionalIc = book.bookings
    .filter((b) => b.createdBy === IC_NAME)
    .reduce((sum, b) => sum + b.amount, 0);
  const confirmedIc = book.bookings
    .filter((b) => b.createdBy === IC_NAME && sentIds.has(b.id))
    .reduce((sum, b) => sum + b.amount, 0);

  const money = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const submittedIds = new Set(book.submissions.flatMap((s) => s.bookingIds));
  /** Live, funded, and not yet carried by any order. */
  const sendable = (b: Booking) =>
    b.status === "booked" && !submittedIds.has(b.id);
  const canBook = variant === "product" && isBookingOpen(book);
  /** The book page has no จองซื้อ of its own, but it does offer. */
  const offerable = isBookingOpen(book);
  const isEmpty = rows.length === 0;
  const opened = book.allBookings.find((b) => b.id === openId) ?? null;
  const openedOffer = book.offers.find((o) => o.id === openOfferId) ?? null;

  return (
    // No card and no heading of its own — it is a tab inside the product's
    // card, and the tab already names it.
    <section
      className="flex w-full flex-col gap-4"
      aria-label={variant === "product" ? "Order" : "รายการจอง"}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="scrollable-tabs flex min-w-0 items-center gap-2">
          {([null, ...BOOKING_PHASES] as (BookingPhase | null)[]).map((p) => (
            <Chip
              key={p ?? "all"}
              label={p ? BOOKING_PHASE_LABEL[p] : "ทั้งหมด"}
              type="single"
              selected={phase === p}
              onClick={() => {
                setPhase(p);
                setPage(1);
              }}
            />
          ))}
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto md:shrink-0">
          {/* Gone once the order is sent — the notice above the page's tabs
              says why, on this tab and on Detail alike. */}
          {/* Offer first, booking second — the order they happen in. Both go
              the moment the book closes: a product that cannot be booked
              cannot be offered either. */}
          {offerable && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setOffering(true)}
              leftIcon={<PaperPlaneTiltIcon size={16} />}
              className="shrink-0"
            >
              ส่ง Offer
            </Button>
          )}
          {canBook && (
            <Button
              variant="primary"
              size="md"
              onClick={onBook}
              leftIcon={<PlusIcon size={16} />}
              className="shrink-0"
            >
              จองซื้อ
            </Button>
          )}
          <SearchInput
            value={search}
            onChange={(next) => {
              setSearch(next);
              setPage(1);
            }}
            onClear={() => setSearch("")}
            // Narrow enough to leave the phase chips the row; the placeholder
            // is cut to fit, but name, client id and Account No all still match.
            placeholder="ค้นหาลูกค้า หรือ Account No"
            size="sm"
            className="min-w-0 flex-1 md:w-[260px] md:flex-none"
          />
        </div>
      </div>

      <div
        // `table-scroll` re-exposes the scrollbar the library's <Table> hides on
        // its own scroller (see globals.css) — ten columns rarely fit, and
        // a hidden scrollbar left the right half of the row undiscoverable.
        // Empty, it is a plain white box with the message and no header row —
        // column titles over nothing read as a table that failed to load.
        className={`table-scroll relative overflow-hidden rounded-xl border border-[var(--border-default)] ${
          isEmpty ? "flex min-h-[160px] items-center justify-center bg-white" : ""
        }`}
      >
        {!isEmpty && (
          <>
            {/* Columns sized to their content, with the slack going to Customer —
                see `FIT` for why this is inline style rather than classes. */}
            <Table style={{ width: "100%" }}>
              <TableHead>
                <TableRow>
                  {/* No product column — every row on this page is the product
                      named in the header above. */}
                  <TableHeaderCell style={FIT} sortable={false}>IC Name</TableHeaderCell>
                  <TableHeaderCell style={FIT} sortable={false}>Account No</TableHeaderCell>
                  {/* Sticky at the left edge: the two columns before it scroll
                      away first, then the name holds, so a row still says whose
                      it is once the table is scrolled across to the statuses. */}
                  <TableHeaderCell
                    sortable={false}
                    style={GROW}
                    fixed="left"
                    fixedOffset={0}
                    fixedShadow="right"
                  >
                    Full Name (TH)
                  </TableHeaderCell>
                  {CHECK_COLUMNS.map((c) => (
                    <TableHeaderCell style={CENTER} key={c.key} sortable={false}>
                      {c.title}
                    </TableHeaderCell>
                  ))}
                  <TableHeaderCell style={CENTER} sortable={false}>
                    Notional Amount
                  </TableHeaderCell>
                  <TableHeaderCell style={CENTER} sortable={false}>Currency</TableHeaderCell>
                  <TableHeaderCell style={CENTER} sortable={false}>Deal Status</TableHeaderCell>
                  <TableHeaderCell style={CENTER} sortable={false}>Payment Status</TableHeaderCell>
                  <TableHeaderCell style={CENTER} sortable={false}>Email Pre-Confirmation</TableHeaderCell>
                  {onSend && (
                    <TableHeaderCell
                      style={CENTER}
                      sortable={false}
                      fixed="right"
                      fixedOffset={0}
                      fixedShadow="left"
                    >
                      คำสั่งซื้อ
                    </TableHeaderCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((row) => {
                  const offer = row.kind === "offer" ? row.offer : null;
                  const b = row.kind === "booking" ? row.booking : null;
                  const clientId = (b ?? offer!).clientId;
                  const clientName = (b ?? offer!).clientName;
                  /* An offer has no deal to report, so its three status cells
                     say where it actually is: with the client. The other two
                     have not started — there is no amount to pay and nothing
                     to confirm until they answer. */
                  const status = b
                    ? dealStatus(b, book)
                    : offer!.status === "declined"
                      ? ({ text: "ลูกค้าปฏิเสธ", variant: "gray" } as const)
                      : ({ text: "รอลูกค้าตอบรับ", variant: "blue" } as const);
                  const payment = b ? paymentStatus(b, book) : ({ text: "—", variant: "gray" } as const);
                  const email = b ? emailStatus(b, book) : ({ text: "—", variant: "gray" } as const);
                  const cancelled = b ? b.status === "cancelled" : offer!.status === "declined";
                  /* A booking carries the checks it was placed against; an
                     offer has none of its own, so the client's live ones are
                     what there is to show. */
                  const live = readiness.get(clientId)?.items ?? [];
                  const checks = b ? checksAtBooking(b, live) : live;
                  const struck = cancelled ? "text-muted-foreground line-through" : "text-foreground";
                  return (
                    // The whole row opens this booking — a column of arrows only to
                    // say "this is clickable" spent width the table did not have.
                    <TableRow
                      key={b?.id ?? offer!.id}
                      hoverable
                      tabIndex={0}
                      aria-label={
                        b
                          ? `ดูรายละเอียดการจองของ ${maskName(clientName, isPrivate)}`
                          : `ดูรายละเอียด Offer ของ ${maskName(clientName, isPrivate)}`
                      }
                      onClick={() => (b ? setOpenId(b.id) : setOpenOfferId(offer!.id))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (b) setOpenId(b.id);
                          else setOpenOfferId(offer!.id);
                        }
                      }}
                      // The row just booked pulses, then stays highlighted — see
                      // `.row-just-added` in globals.css.
                      className={`cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a6ee7] active:bg-[var(--bg-default-pressed)] ${
                        b?.id === newBookingId ? "row-just-added" : ""
                      }`}
                    >
                      <TableCell style={FIT}>
                        <span className="type-body-2 text-foreground">
                          {b?.createdBy ?? offer!.sentBy}
                        </span>
                      </TableCell>
                      <TableCell style={FIT}>
                        <span className="type-body-2 tabular-nums text-foreground">
                          {getClientProfile(clientId).accountNo}
                        </span>
                      </TableCell>
                      <TableCell style={GROW} fixed="left" fixedOffset={0} fixedShadow="right">
                        <span className={`type-body-2 font-medium ${struck}`}>
                          {maskName(getClientProfile(clientId).nameTh, isPrivate)}
                        </span>
                      </TableCell>
                      {CHECK_COLUMNS.map((c) => (
                        <TableCell style={CENTER} key={c.key}>
                          <div className="flex justify-center">
                            <CheckMark item={checks.find((i) => i.key === c.key)} />
                          </div>
                        </TableCell>
                      ))}
                      <TableCell style={CENTER}>
                        {/* An offer has no amount yet — that is the thing the
                            client has not decided. */}
                        <span className={`type-body-2 font-semibold tabular-nums ${struck}`}>
                          {b ? money(b.amount) : "—"}
                        </span>
                      </TableCell>
                      <TableCell style={CENTER}>
                        <span className="type-body-2 text-foreground">
                          {b ? book.currency : "—"}
                        </span>
                      </TableCell>
                      {/* `large`, the top of Tag's two sizes: `small` sets the
                          label at 9px, which is below what the rest of the row
                          is read at and left three columns of squinting. */}
                      <TableCell style={CENTER}>
                        <div className="flex justify-center">
                          <Tag text={status.text} variant={status.variant} size="large" />
                        </div>
                      </TableCell>
                      <TableCell style={CENTER}>
                        <div className="flex justify-center">
                          <Tag text={payment.text} variant={payment.variant} size="large" />
                        </div>
                      </TableCell>
                      <TableCell style={CENTER}>
                        <div className="flex justify-center">
                          <Tag text={email.text} variant={email.variant} size="large" />
                        </div>
                      </TableCell>
                      {onSend && (
                        <TableCell style={CENTER} fixed="right" fixedOffset={0} fixedShadow="left">
                          <div className="flex justify-center">
                            {b && sendable(b) ? (
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<PaperPlaneTiltIcon size={14} />}
                                // The row itself opens the booking; this is a
                                // separate action on it.
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSend(b);
                                }}
                              >
                                ส่งคำสั่งซื้อ
                              </Button>
                            ) : (
                              <span className="type-caption text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center gap-1 px-4 py-8 text-center">
            <p className="type-body-2 font-semibold text-foreground">
              {search
                ? "ไม่พบรายการที่ค้นหา"
                : phase
                  ? `ไม่มีรายการที่อยู่ในขั้น "${BOOKING_PHASE_LABEL[phase]}"`
                  : "ยังไม่มีรายการจองซื้อ"}
            </p>
            {!search && !phase && (
              <p className="type-caption text-muted-foreground">
                กด &quot;{variant === "product" ? "จองซื้อ" : "จองเพิ่มให้ลูกค้า"}&quot;
                เพื่อจองให้ลูกค้ารายแรก — รายการจะแสดงที่นี่
              </p>
            )}
          </div>
        )}
      </div>

      {variant === "product" && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* Notional is everything booked; confirmed is what the back office
              has accepted of it. */}
          <Total label="Total Notional IC" value={money(notionalIc)} />
          <Total label="Total Confirmed IC" value={money(confirmedIc)} tone="green" />
          <Total
            label="Total Notional"
            value={`${money(notional)} / ${money(book.targetAmount)}`}
          />
          <Total label="Total Confirmed" value={money(book.confirmedAmount)} tone="green" />
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="type-body-2 text-muted-foreground">Total {rows.length} Records</span>
        {totalPages > 1 && (
          <Pagination totalPages={totalPages} currentPage={current} onPageChange={setPage} />
        )}
      </div>

      <SendOfferModal
        open={offering}
        product={product}
        book={book}
        onClose={() => setOffering(false)}
        onNotice={onNotice}
      />

      <OfferDetailModal
        offer={openedOffer}
        product={product}
        onClose={() => setOpenOfferId(null)}
        onNotice={onNotice}
      />

      {/* Rendered whether or not one is open, so the modal can animate out. */}
      <BookingDetailModal
        booking={opened}
        book={book}
        product={product}
        checks={
          opened ? checksAtBooking(opened, readiness.get(opened.clientId)?.items ?? []) : []
        }
        deal={opened ? dealStatus(opened, book) : CLOSED_TAG}
        payment={opened ? paymentStatus(opened, book) : CLOSED_TAG}
        email={opened ? emailStatus(opened, book) : CLOSED_TAG}
        onClose={() => {
          // Opening the new booking is looking at it — it closes as an
          // ordinary row, the same as leaving the tab would.
          if (openId === newBookingId) onNewBookingSeen?.();
          setOpenId(null);
        }}
        onNotice={onNotice}
      />
    </section>
  );
}

/** One check in a table cell: the icon, or the rating where the row has one. */
function CheckMark({ item }: { item: RequirementItem | undefined }) {
  if (!item) return <span className="type-body-2 text-muted-foreground">—</span>;
  const { icon: Icon, fg } = CHECK_ICON[item.status];
  if (item.value) {
    return <span className={`type-body-2 whitespace-nowrap font-semibold ${fg}`}>{item.value}</span>;
  }
  return <Icon size={22} weight="fill" className={fg} aria-label={item.status} />;
}

function Total({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green";
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/10 px-4 py-3">
      <span className="text-xs uppercase leading-4 tracking-wide text-[#6a7282]">{label}</span>
      <span
        className={`text-lg font-bold leading-6 tabular-nums ${
          tone === "green" ? "text-[var(--fill-green-600)]" : "text-[#101828]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
