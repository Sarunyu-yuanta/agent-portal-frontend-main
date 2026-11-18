"use client";

/**
 * Everyone booked into a deal, with the four checks each was booked against —
 * the one booking table, in two places:
 *
 * - **`variant="product"`** — the "Order" tab of a product's page, with its own
 *   จองซื้อ and the deal's totals underneath. It answers "what happened after I
 *   pressed จองซื้อ" without leaving the page the booking was made from.
 * - **`variant="book"`** — the booking list on `/orders/[productId]`. That
 *   page's summary already carries the action and the totals, so the table
 *   comes without either.
 *
 * One kind of row — one booking. Clicking it opens `BookingDetailModal`. Chips
 * above the table sort them by phase; see `bookingPhase`.
 *
 * **The signed-in IC's bookings only.** A basket is shared across the desk,
 * but another IC's clients — their names, accounts, checks and amounts — are
 * not this IC's to see. The rows are filtered with `ownBookings`, and the
 * booking modal can only open one of those rows. The deal's progress is still
 * shown, as aggregate figures in the totals ("ยอดจองทั้งดีล", "สำเร็จทั้งดีล")
 * that name nobody — so those figures are expected to exceed the sum of the
 * rows above them.

 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
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
  PlusIcon,
  UsersThreeIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { usePrivacy } from "@/contexts/privacy-context";
import { useClients } from "@/hooks/use-api";
import { getClientProfile } from "@/data/client-profiles";
import { IC_NAME } from "@/lib/current-ic";
import { getInitial } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import type {
  Booking,
  RequirementItem,
  RequirementKey,
  RequirementStatus,
} from "@/types/domain";
import { bookingModeFor, type BookableProduct } from "./bookable-products";
import { ORDER_WORDS } from "./order-words";
import { useOrderBook, useRosterReadiness } from "./use-order-books";
import {
  BOOKING_PHASE_LABEL,
  bookingPhase,
  bookingPhaseSteps,
  isBookingOpen,
  ownBookings,
  type BookingPhase,
} from "./order-book";
import { BookingDetailModal } from "./BookingDetailModal";
import {
  CLOSED_TAG,
  checksAtBooking,
  dealStatus,
  emailStatus,
  paymentStatus,
} from "./booking-status";

const PAGE_SIZE = 10;

/** One line of the table: a booking, and the date it sorts on. */
type OrderRow = { at: string; booking: Booking };


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

/** ลูกค้า, the four checks, then Notional, Currency, Deal, Payment and Email. */
const TOTAL_COLUMNS = 1 + CHECK_COLUMNS.length + 5;

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
}: {
  product: BookableProduct;
  /**
   * Opens the booking modal — the page owns it, and its toasts.
   *
   * Quota desks only, and optional for that reason: a basket page has no
   * booking modal to open any more (see `canBook`), so requiring one would
   * make every basket host pass a callback nothing can reach.
   */
  onBook?: () => void;
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
  // `bookingModeFor(product)`, not `book?.mode` — the book may still be
  // loading, and the product is the authority on its desk either way.
  const words = ORDER_WORDS[bookingModeFor(product)];
  const { isPrivate } = usePrivacy();
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<BookingPhase | null>(null);
  const [page, setPage] = useState(1);
  // By id rather than the row itself, so a cancel from inside the modal shows
  // up in it straight away instead of in a stale copy.
  const [openId, setOpenId] = useState<string | null>(null);
  // The table box's visible width, so the other-ICs row can pin its content to
  // the middle of what is on screen rather than of the full scrolled width.
  const [viewWidth, setViewWidth] = useState(0);
  const measureView = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver(() => setViewWidth(node.clientWidth));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Only the signed-in IC's bookings — see the module note.
  const own = useMemo(() => (book ? ownBookings(book, IC_NAME) : []), [book]);

  const rows = useMemo(() => {
    if (!book) return [] as OrderRow[];
    const all: OrderRow[] = own
      .map((b) => ({ at: b.createdAt, booking: b }))
      .sort((a, b) => b.at.localeCompare(a.at));
    const inPhase = phase ? all.filter((r) => bookingPhase(r.booking, book) === phase) : all;
    const query = search.trim().toLowerCase();
    if (!query) return inPhase;
    return inPhase.filter((r) => {
      const { clientId, clientName } = r.booking;
      return (
        maskName(clientName, isPrivate).toLowerCase().includes(query) ||
        maskName(getClientProfile(clientId).nameTh, isPrivate).includes(query) ||
        clientId.includes(query) ||
        getClientProfile(clientId).accountNo.includes(query)
      );
    });
  }, [book, own, phase, search, isPrivate]);

  /**
   * Every other IC's bookings, folded into one nameless line under the table —
   * how many and how much, never whose. Follows the phase chip like the rows
   * above it, and is dropped while searching: a search is for a client, and
   * none of these can be one the IC is looking for.
   */
  const others = useMemo(() => {
    if (!book || search.trim()) return null;
    const inPhase = book.allBookings.filter(
      (b) => b.createdBy !== IC_NAME && (!phase || bookingPhase(b, book) === phase),
    );
    if (inPhase.length === 0) return null;
    // Cancelled amounts only count on the cancelled chip — anywhere else they
    // are not part of what fills the deal.
    const counted = phase === "cancelled" ? inPhase : inPhase.filter((b) => b.status !== "cancelled");
    return { count: inPhase.length, amount: counted.reduce((sum, b) => sum + b.amount, 0) };
  }, [book, phase, search]);

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
  const canBook = variant === "product" && isBookingOpen(book);
  // Empty only when there is nothing at all to draw — a page of other ICs'
  // summary alone still explains where the deal's figure comes from.
  const isEmpty = rows.length === 0 && !others;
  // Last page only, so it reads as the foot of the whole list.
  const showOthers = others !== null && current === totalPages;
  const opened = own.find((b) => b.id === openId) ?? null;

  return (
    // No card and no heading of its own — it is a tab inside the product's
    // card, and the tab already names it.
    <section
      className="flex w-full flex-col gap-4"
      aria-label={variant === "product" ? "Order" : `รายการ${words.record}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="scrollable-tabs flex min-w-0 items-center gap-2">
          {bookingPhaseSteps(book.mode).map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              type="single"
              selected={(phase ?? "all") === s.id}
              onClick={() => {
                // `bookingPhaseSteps` is called without `offers`, so every id
                // here is a booking phase or "all".
                setPhase(s.id === "all" || s.id === "offered" ? null : s.id);
                setPage(1);
              }}
            />
          ))}
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto md:shrink-0">
          {/* Gone once the order is sent — the notice above the page's tabs
              says why, on this tab and on Detail alike. */}
          {canBook && (
            <Button
              variant="primary"
              size="md"
              onClick={onBook}
              leftIcon={<PlusIcon size={16} />}
              className="shrink-0"
            >
              {words.ctaShort}
            </Button>
          )}
          <SearchInput
            value={search}
            onChange={(next) => {
              setSearch(next);
              setPage(1);
            }}
            onClear={() => setSearch("")}
            // Just the subject, not the fields: it matches name, client id and
            // Account No alike, and listing them was a placeholder longer than
            // the box, cut mid-phrase by the narrow width this needs to leave
            // the phase chips their row.
            placeholder="ค้นหาลูกค้า"
            size="sm"
            // 260px was sized for the old placeholder's two clauses. One word
            // needs far less, and the width it gives back goes to the phase
            // chips — which are the longer things on this row and the ones that
            // scroll when it is tight. Full width on mobile, where the chips
            // have a row of their own.
            className="min-w-0 flex-1 md:w-[180px] md:flex-none"
          />
        </div>
      </div>

      <div
        ref={measureView}
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
                      named in the header above.

                      One ลูกค้า column where there were three. No "IC Name":
                      the table is filtered to the signed-in IC, so every cell
                      in it would hold the same string; Account No and
                      Full Name (TH) fold into the caption under the name, which
                      is the shape Order Management's own list uses. Three
                      columns of identity on a table already ten wide was the
                      reason the right-hand statuses needed scrolling to reach.

                      Sticky at the left edge, so a row still says whose it is
                      once the table is scrolled across to those statuses. */}
                  <TableHeaderCell
                    sortable={false}
                    style={GROW}
                    fixed="left"
                    fixedOffset={0}
                    fixedShadow="right"
                  >
                    ลูกค้า
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
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((row) => {
                  const b = row.booking;
                  const { clientId, clientName } = b;
                  const status = dealStatus(b, book);
                  const payment = paymentStatus(b, book);
                  const email = emailStatus(b, book);
                  const cancelled = b.status === "cancelled";
                  /* A booking carries the checks it was placed against; the
                     client's live ones only stand in for a seeded one. */
                  const live = readiness.get(clientId)?.items ?? [];
                  const checks = checksAtBooking(b, live);
                  const struck = cancelled ? "text-muted-foreground line-through" : "text-foreground";
                  return (
                    // The whole row opens this booking — a column of arrows only to
                    // say "this is clickable" spent width the table did not have.
                    <TableRow
                      key={b.id}
                      hoverable
                      tabIndex={0}
                      aria-label={`ดูรายละเอียดการจองของ ${maskName(clientName, isPrivate)}`}
                      onClick={() => setOpenId(b.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setOpenId(b.id);
                        }
                      }}
                      // The row just booked pulses, then stays highlighted — see
                      // `.row-just-added` in globals.css.
                      className={`cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a6ee7] active:bg-[var(--bg-default-pressed)] ${
                        b.id === newBookingId ? "row-just-added" : ""
                      }`}
                    >
                      <TableCell style={GROW} fixed="left" fixedOffset={0} fixedShadow="right">
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar
                            type="text"
                            initials={getInitial(maskName(clientName, isPrivate))}
                            size="m"
                          />
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <span className={`type-body-2 truncate !font-semibold ${struck}`}>
                              {maskName(clientName, isPrivate)}
                            </span>
                            {/* The account only. The Thai name was the third
                                spelling of one person in a cell two lines tall,
                                and the account is the number an order is
                                actually placed on. */}
                            <span className="type-caption truncate text-muted-foreground">
                              บัญชี {getClientProfile(clientId).accountNo}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      {CHECK_COLUMNS.map((c) => (
                        <TableCell style={CENTER} key={c.key}>
                          <div className="flex justify-center">
                            <CheckMark item={checks.find((i) => i.key === c.key)} />
                          </div>
                        </TableCell>
                      ))}
                      <TableCell style={CENTER}>
                        <span className={`type-body-2 font-semibold tabular-nums ${struck}`}>
                          {money(b.amount)}
                        </span>
                      </TableCell>
                      <TableCell style={CENTER}>
                        <span className="type-body-2 text-foreground">{book.currency}</span>
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
                    </TableRow>
                  );
                })}
                {showOthers && (
                  // Not a booking, so not clickable: it says the rest of the
                  // deal exists, and nothing about who is in it. One cell across
                  // every column, its content pinned to the middle of what is
                  // on screen — it stays put while the rows above it scroll.
                  <TableRow className="bg-[var(--fill-gray-100)]">
                    <TableCell
                      colSpan={TOTAL_COLUMNS}
                      style={{ minWidth: 0, padding: 0 }}
                    >
                      <div
                        className="type-caption sticky left-0 flex items-center justify-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-muted-foreground"
                        style={{ width: viewWidth || undefined }}
                      >
                        {/* One quiet line — a note at the foot of the table,
                            not a row competing with the IC's own clients. */}
                        <UsersThreeIcon size={14} weight="fill" className="shrink-0" />
                        <span>
                          ลูกค้าของ IC อื่น {others.count} รายการ · ยอดรวม{" "}
                          <span className="font-semibold tabular-nums">
                            {money(others.amount)} {book.currency}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
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
                  ? `ไม่มีรายการที่อยู่ในขั้น "${BOOKING_PHASE_LABEL[book.mode][phase]}"`
                  : `ยังไม่มี${words.record}`}
            </p>
            {!search && !phase && canBook && (
              <p className="type-caption text-muted-foreground">
                กด &quot;{words.ctaShort}&quot; เพื่อทำรายการให้ลูกค้ารายแรก — รายการจะแสดงที่นี่
              </p>
            )}
          </div>
        )}
      </div>

      {variant === "product" && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* Notional is everything booked; confirmed is what the back office
              has accepted of it.

              "ของฉัน" versus the whole product, spelled out rather than left
              as the "IC" suffix these carried before: the table above is this
              IC's rows only, so a reader seeing a bigger number in the third
              cell has to be told it counts clients the list does not show.

              "ทั้งดีล" only on a basket: that desk's bookings add up to one
              deal that has to reach a notional. A bond has no deal — the third
              cell is the issue's quota being drawn down, which is a different
              claim about the same arithmetic. The split of that figure between
              this IC and the rest is on the Detail tab — see `DealProgress`. */}
          <Total label={`ยอด${words.record}ของฉัน`} value={money(notionalIc)} />
          <Total label="สำเร็จของฉัน" value={money(confirmedIc)} tone="green" />
          <Total
            label={book.mode === "basket" ? "ยอดจองทั้งดีล" : "โควตาที่ใช้ไป"}
            value={`${money(book.mode === "basket" ? notional : book.quotaUsed)} / ${money(book.targetAmount)}`}
          />
          <Total
            label={book.mode === "basket" ? "สำเร็จทั้งดีล" : "สำเร็จทั้งหมด"}
            value={money(book.confirmedAmount)}
            tone="green"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="type-body-2 text-muted-foreground">Total {rows.length} Records</span>
        {totalPages > 1 && (
          <Pagination totalPages={totalPages} currentPage={current} onPageChange={setPage} />
        )}
      </div>

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
      <span className="text-xs uppercase leading-[20px] tracking-wide text-[#6a7282]">{label}</span>
      <span
        className={`text-lg font-bold leading-[28px] tabular-nums ${
          tone === "green" ? "text-[var(--fill-green-600)]" : "text-[#101828]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
