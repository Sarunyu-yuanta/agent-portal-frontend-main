/**
 * Turning a product plus a pile of bookings into the book a screen renders.
 *
 * The product is the authority on currency, minimum ticket and notional target;
 * the bookings are the authority on what has been collected against it. Nothing
 * in `data/order-books.json` restates a product fact, so a book cannot quote a
 * target the catalogue disagrees with.
 */

import type {
  Booking,
  OrderBook,
  OrderBookStatus,
  OrderLogEntry,
  OrderSubmission,
  RequirementRequest,
} from "@/types/domain";
import { BACKOFFICE_ACTOR } from "@/lib/order-mock-data";
import { REQUIREMENT_CATALOG } from "./order-requirements";
import {
  bookingModeFor,
  deskLabelFor,
  type BookableProduct,
  type BookingMode,
} from "./bookable-products";
import { ORDER_WORDS } from "./order-words";

/**
 * A mock FX rate, used only to say what a client's THB cash is worth against a
 * note priced in dollars.
 *
 * One constant rather than a rate per product: the point of the line it feeds
 * is "can this client cover the ticket", and a headline that moves every render
 * would make a booking amount irreproducible. A real backend quotes a rate with
 * the product; when it does, this is the single call site to replace.
 */
export const USD_THB = 36.5;

/** `"10,000 USD"` → `10000`; `"—"` and anything unparseable → `0`. */
export function parseMoney(text: string): number {
  const digits = text.replace(/[^0-9.]/g, "");
  const value = Number.parseFloat(digits);
  return Number.isFinite(value) ? value : 0;
}

/**
 * The notional a book has to fill before its order can go downstream.
 *
 * Read off the right-hand side of the product's own `requestNotionalSize`
 * ("100,000 / 100,000") — that field is the issuer's notional size, which is
 * precisely the number a book is filling. Where a product carries no such
 * field, ten minimum tickets stands in: it keeps the target a multiple of
 * something real rather than a round number picked here.
 */
export function orderTargetFor(product: BookableProduct): number {
  const denominator = product.requestNotionalSize?.split("/")[1];
  const target = denominator ? parseMoney(denominator) : 0;
  return target > 0 ? target : minTicketFor(product) * 10;
}

/** The smallest booking a single client may place. */
export function minTicketFor(product: BookableProduct): number {
  const min = parseMoney(product.minInvestment);
  // A product with no readable minimum still needs a floor, or a zero-amount
  // booking would pass validation.
  return min > 0 ? min : 1;
}

/** `100000` in `"USD"` → `"100,000 USD"`. */
export function formatOrderAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currency}`;
}

/** A client's idle cash, in THB — what a booking is measured against. */
export function clientCashThb(client: { aum: number; cashIdlePct: number }): number {
  return client.aum * (client.cashIdlePct / 100);
}

/** That cash expressed in the product's currency, via {@link USD_THB}. */
export function cashInCurrency(cashThb: number, currency: string): number {
  return currency === "THB" ? cashThb : cashThb / USD_THB;
}

// ── Assembly ─────────────────────────────────────────────────────────────────

const sum = (rows: Booking[]) => rows.reduce((total, b) => total + b.amount, 0);

/**
 * Which step the product is at — see {@link OrderBookStatus} for the steps.
 *
 * Before any order exists the step is read off the bookings alone: short of
 * the target is still booking, at the target the book is done and waiting to
 * be collected. There is no funds step between the two — a booking the client
 * could not fund was never placed (see `Booking`).
 *
 * Once an order exists, its own state is the step.
 */
function bookStatus(
  open: Booking[],
  openAmount: number,
  target: number,
  latest: OrderSubmission | undefined,
): OrderBookStatus {
  if (latest?.status === "processing") return "processing";
  if (latest?.status === "completed") return "completed";
  if (latest?.status === "rejected") return "rejected";
  return openAmount < target ? "collecting" : "ready";
}

/**
 * The product's order history as a flat list, newest first.
 *
 * Derived from the bookings, submissions and requests themselves — see the note
 * on {@link OrderLogEntry}. Every line is reconstructed on read, so a log can
 * never describe a booking that was edited out from under it.
 */
function buildLogs(
  product: BookableProduct,
  bookings: Booking[],
  submissions: OrderSubmission[],
  requests: RequirementRequest[],
): OrderLogEntry[] {
  const money = (amount: number) => formatOrderAmount(amount, product.currency);
  const entries: OrderLogEntry[] = [];

  for (const b of bookings) {
    entries.push({
      id: `log-${b.id}-created`,
      productId: product.id,
      at: b.createdAt,
      actor: b.createdBy,
      action: "booking-created",
      summary: `จองให้ ${b.clientName} ${money(b.amount)}`,
      detail: null,
    });
    if (b.status === "cancelled") {
      entries.push({
        id: `log-${b.id}-cancelled`,
        productId: product.id,
        // No cancellation timestamp is kept — a cancelled booking carries the
        // one date it has. Showing the booking's own time is a day out at
        // worst; inventing "now" would reorder the log on every render.
        at: b.createdAt,
        actor: b.createdBy,
        action: "booking-cancelled",
        summary: `ยกเลิกการจองของ ${b.clientName} ${money(b.amount)}`,
        detail: null,
      });
    }
  }

  for (const r of requests) {
    const labels = r.keys.map((k) => REQUIREMENT_CATALOG[k].label).join(", ");
    entries.push({
      id: `log-${r.id}-sent`,
      productId: product.id,
      at: r.sentAt,
      actor: r.sentBy,
      action: "requirement-sent",
      summary: `ส่งคำขอข้อมูลให้ ${r.clientName}`,
      detail: labels,
    });
    if (r.status === "completed" && r.completedAt) {
      entries.push({
        id: `log-${r.id}-completed`,
        productId: product.id,
        at: r.completedAt,
        actor: r.clientName,
        action: "requirement-completed",
        summary: `${r.clientName} กรอกข้อมูลครบแล้ว`,
        detail: labels,
      });
    }
  }

  for (const s of submissions) {
    entries.push({
      id: `log-${s.id}-submitted`,
      productId: product.id,
      at: s.submittedAt,
      actor: s.submittedBy,
      action: "order-submitted",
      // Who did it changes the verb: the IC sent a quota booking, the back
      // office came and took a full basket. `actor` already names them, and a
      // summary reading "ส่ง" under "ระบบหลังบ้าน" would contradict it.
      summary:
        s.submittedBy === BACKOFFICE_ACTOR
          ? `ระบบหลังบ้านรับคำสั่งซื้อไป ${s.bookingIds.length} รายการ`
          : `ส่งคำสั่งซื้อ ${s.bookingIds.length} รายการ`,
      detail: s.backendRef,
    });
    if (s.status !== "processing" && s.settledAt) {
      entries.push({
        id: `log-${s.id}-${s.status}`,
        productId: product.id,
        at: s.settledAt,
        // The answer comes from the downstream system, not from the IC — the
        // log says who did what, and attributing it to the IC would read as
        // though they had marked their own order complete.
        actor: "ระบบหลังบ้าน",
        action: s.status === "completed" ? "order-completed" : "order-rejected",
        summary:
          s.status === "completed"
            ? `คำสั่งซื้อสำเร็จ (${s.backendRef})`
            : `คำสั่งซื้อถูกปฏิเสธ (${s.backendRef})`,
        detail: null,
      });
    }
  }

  return entries.sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * One product's book.
 *
 * `bookings`, `submissions` and `requests` are the whole app's lists filtered
 * to this product by the caller — doing the filtering here would mean this
 * function knowing about the store, and it is called from places that only have
 * a snapshot.
 */
export function assembleOrderBook(
  product: BookableProduct,
  bookings: Booking[],
  submissions: OrderSubmission[],
  requests: RequirementRequest[],
): OrderBook {
  const target = orderTargetFor(product);
  const live = bookings.filter((b) => b.status === "booked");
  const sentIds = new Set(submissions.flatMap((s) => s.bookingIds));
  const open = live.filter((b) => !sentIds.has(b.id));

  const completedIds = new Set(
    submissions.filter((s) => s.status === "completed").flatMap((s) => s.bookingIds),
  );

  const ordered = [...submissions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  // A rejected order hands its amount back to the quota; everything else live
  // — waiting, sent or completed — has taken its share.
  const rejectedIds = new Set(
    submissions.filter((s) => s.status === "rejected").flatMap((s) => s.bookingIds),
  );
  const quotaUsed = sum(live.filter((b) => !rejectedIds.has(b.id)));

  return {
    productId: product.id,
    productName: product.underlying,
    productType: product.productName,
    desk: deskLabelFor(product),
    mode: bookingModeFor(product),
    logos: product.logos,
    currency: product.currency,
    targetAmount: target,
    quotaUsed,
    quotaRemaining: Math.max(0, target - quotaUsed),
    minTicket: minTicketFor(product),
    bookings: live,
    openBookings: open,
    allBookings: bookings,
    bookedAmount: sum(open),
    confirmedAmount: sum(live.filter((b) => completedIds.has(b.id))),
    status: bookStatus(open, sum(open), target, ordered[0]),
    pendingOrders: ordered.filter((s) => s.status === "processing"),
    submissions: ordered,
    logs: buildLogs(product, bookings, submissions, requests),
  };
}

// ── Presentation ─────────────────────────────────────────────────────────────

/**
 * The submission carrying one booking, if any has.
 *
 * Written out four times before this — once in each of `bookingPhase`,
 * `dealStatus`, `paymentStatus`, `emailStatus` — and once more inline in the
 * booking sheet. Every status in the feature hangs off this one lookup, so it
 * is one function.
 */
export function submissionFor(booking: Booking, book: OrderBook): OrderSubmission | undefined {
  return book.submissions.find((s) => s.bookingIds.includes(booking.id));
}

/**
 * Whether the open round has reached the product's notional.
 *
 * Not `book.status === "ready"`, which is what this used to read. `bookStatus`
 * checks the newest *submission* first and only falls through to the fill
 * test when there is no order at all — so on a quota book, where orders go out
 * one at a time while other bookings are still unsent, it answers a different
 * question entirely. `bookedAmount` counts the live bookings no order has
 * carried, so a collected basket reads zero and this goes false on its own.
 */
export function isBookFull(book: Pick<OrderBook, "bookedAmount" | "targetAmount">): boolean {
  return book.targetAmount > 0 && book.bookedAmount >= book.targetAmount;
}

/**
 * Where one booking stands — the words the chips filter by, in the order a
 * booking moves through them.
 *
 * Named for where the booking *sits*, because that is what an IC scanning a
 * list is deciding from: is this still something I can move, or is it with
 * somebody else.
 *
 * - `pending` — **basket only.** The booking is placed and no order carries it;
 *   the basket is still filling. A quota booking cannot be here: creating one
 *   sends it (see `placeOrder` in `contexts/orders-context`).
 * - `processing` — an order exists and is downstream. On a bond that is true
 *   from the moment the IC presses the button, because the press *is* the
 *   send.
 * - `completed` — the back office accepted it.
 * - `cancelled` — the IC pulled the booking, or the back office rejected the
 *   order. Two different events, one chip; `dealStatus` still tells them apart.
 *
 * **Two in-between states are deliberately not phases of their own**, for the
 * same reason: neither is a step the IC takes, and naming them put the back
 * office's queue on a chip instead of the booking's state.
 *
 * - A **full-but-uncollected basket**. The back office collects within seconds
 *   of the basket filling, and the IC has no move either side of it.
 * - A **sent-but-not-picked-up bond order** (`OrderSubmissionStatus` `"sent"`).
 *   It is still a real status — it is the window the IC can cancel in, and
 *   `BookingDetailModal` reads it for exactly that — but from the moment the
 *   order is created it is downstream, and that is what the status says.
 *
 * Coarser than `dealStatus`, which the Deal Status column shows: the chips
 * sort a long list into a few piles, the tag says exactly which step.
 */
export type BookingPhase = "pending" | "processing" | "completed" | "cancelled";

export function bookingPhase(booking: Booking, book: OrderBook): BookingPhase {
  if (booking.status === "cancelled") return "cancelled";
  const submission = submissionFor(booking, book);
  if (submission?.status === "completed") return "completed";
  if (submission?.status === "rejected") return "cancelled";
  // `sent` as well as `processing`: an order the back office has not taken up
  // yet is still an order that has gone, which is all this says.
  if (submission) return "processing";
  // No order carries it yet — a basket still filling.
  return "pending";
}

/** In the order a booking moves through them — the chips' order. */
export const BOOKING_PHASES: BookingPhase[] = [
  "pending",
  "processing",
  "completed",
  "cancelled",
];

/**
 * What each phase is called on each desk.
 *
 * Only the first step differs, and it differs because the desks differ: a
 * basket booking is placed into a notional that still has to fill, while a bond
 * order is already gone downstream. Each desk offers four of the five phases
 * and neither can reach the other's first one, so no chip is ever permanently
 * empty. Everything after the order is one shared vocabulary — the same words
 * `dealStatus` returns, so the chip and the row's own tag stop disagreeing.
 */
export const BOOKING_PHASE_LABEL: Record<
  BookingMode,
  Partial<Record<BookingPhase, string>>
> = {
  basket: {
    pending: "จองแล้ว",
    processing: "กำลังดำเนินการรับคำสั่งซื้อ",
    completed: "รับคำสั่งซื้อสำเร็จ",
    cancelled: "ยกเลิก",
  },
  quota: {
    processing: "กำลังดำเนินการรับคำสั่งซื้อ",
    completed: "รับคำสั่งซื้อสำเร็จ",
    cancelled: "ยกเลิก",
  },
};

/**
 * The tag colour per phase.
 *
 * Lives here rather than in a component because it was declared byte-identical
 * in two of them. Yellow for the with-the-back-office state is the colour the
 * bell already rings "ครบยอดแล้ว" in — see `use-order-notification-feed`. The
 * one variant left over goes to proposals; see `PROPOSAL_VARIANT`.
 */
export const BOOKING_PHASE_VARIANT: Record<
  BookingPhase,
  "lime" | "yellow" | "green" | "gray"
> = {
  // `lime`, and the proposals' tag took the blue — the pair was the other way
  // round and was swapped deliberately. Nothing about either colour is load
  // bearing on its own; what matters is that `pending` and a proposal do not
  // share one, since a client row can show both.
  pending: "lime",
  processing: "yellow",
  completed: "green",
  cancelled: "gray",
};

const PHASE_EMPTY: Record<BookingMode, Partial<Record<BookingPhase | "all", string>>> = {
  basket: {
    all: "ยังไม่มีรายการจอง",
    pending: "ไม่มีรายการที่จองไว้",
    processing: "ไม่มีรายการที่กำลังดำเนินการรับคำสั่งซื้อ",
    completed: "ยังไม่มีรายการที่รับคำสั่งซื้อสำเร็จ",
    cancelled: "ไม่มีรายการที่ยกเลิก",
  },
  quota: {
    all: "ยังไม่มีคำสั่งซื้อ",
    processing: "ไม่มีคำสั่งซื้อที่กำลังดำเนินการ",
    completed: "ยังไม่มีคำสั่งซื้อที่รับสำเร็จ",
    cancelled: "ไม่มีคำสั่งซื้อที่ยกเลิก",
  },
};

/**
 * Order Management's filter chips, in this desk's own wording.
 *
 * A function rather than two constants: the phases, their order and the "all"
 * chip are the same on both desks, and only the labels and the empty-state
 * copy differ. The ids are shared, so `?step=cancelled` resolves on either
 * tab — two sets of ids would silently fall back to "ทั้งหมด" when a link
 * crossed desks.
 *
 * `offered` leads, and is **not** a {@link BookingPhase}: nothing has been
 * booked, so `bookingPhase` cannot produce it and no booking is ever at it. It
 * is the step *before* one exists — an offer the client has not acted on — and
 * it is here because the question an IC scans this list with starts earlier
 * than the first booking. See `openOffersFor`.
 */
export type OrderStep = BookingPhase | "offered" | "all";

/** The same, as the panels and the table pass it: `null` is "ทั้งหมด". */
export type OrderStepFilter = BookingPhase | "offered" | null;

export function bookingPhaseSteps(
  mode: BookingMode,
  /**
   * Whether the list behind these chips can show offers at all.
   *
   * Order Management can — it lists clients, and a client with an offer and no
   * booking is still one. A product page's Order tab cannot: its rows are
   * bookings, ten columns of them, and an offer has none of what they say.
   */
  options?: { offers?: boolean },
): { id: OrderStep; label: string; empty: string }[] {
  return [
    { id: "all", label: "ทั้งหมด", empty: PHASE_EMPTY[mode].all ?? "" },
    ...(options?.offers
      ? [{ id: "offered" as const, label: "ส่ง Proposal แล้ว", empty: OFFERED_EMPTY }]
      : []),
    ...BOOKING_PHASES.filter((p) => BOOKING_PHASE_LABEL[mode][p]).map((p) => ({
      id: p,
      label: BOOKING_PHASE_LABEL[mode][p] as string,
      empty: PHASE_EMPTY[mode][p] ?? "",
    })),
  ];
}

/**
 * One line for both desks: an offer is the same thing either way, and the
 * wording turns on the client not having acted rather than on what they were
 * offered.
 */
const OFFERED_EMPTY = "ไม่มี Proposal ที่ยังรอลูกค้าตัดสินใจ";


/**
 * Whether the product still takes bookings.
 *
 * Basket: a product is booked once, filled, and collected downstream as one
 * order — by the back office, not by anyone here. From the moment that order
 * exists nothing more can be booked: while the back office is still working on
 * it the product reads "กำลังดำเนินการ", and once it answers the book is
 * {@link isBookClosed closed}.
 *
 * Quota: open while at least one minimum ticket of quota is left; orders sent
 * along the way don't close it.
 */
export function isBookingOpen(
  book: Pick<OrderBook, "mode" | "submissions" | "quotaRemaining" | "minTicket">,
): boolean {
  if (book.mode === "quota") return book.quotaRemaining >= book.minTicket;
  return book.submissions.length === 0;
}

/**
 * The cap on a single booking's amount, or `null` where the desk has none.
 *
 * **Only the quota desks have one.** A bond draws down an issue: once the quota
 * is gone there is nothing left to sell, so a booking cannot exceed what is
 * left of it.
 *
 * A basket has **no cap**. Its `targetAmount` is the notional the deal is
 * *aiming* for, not a ceiling — a basket can be over-booked, and the order that
 * goes downstream carries whatever filled it. This used to return
 * `targetAmount - bookedAmount`, which turned the target into a limit: a client
 * wanting more than the deal had room for was refused, and a basket that
 * reached its notional closed its own booking form.
 *
 * `null` rather than `Infinity` so a caller cannot forget: there is no number
 * to compare against, and a type that says so makes the comparison impossible
 * to write by accident.
 */
export function bookingRemaining(book: OrderBook): number | null {
  if (book.mode !== "quota") return null;
  return isBookingOpen(book) ? book.quotaRemaining : 0;
}

/**
 * Whether the back office has answered the product's order — the point at which
 * the product leaves the catalogue (see `useClosedProductIds`).
 *
 * Not at collection: an order still in flight keeps its product listed, just no
 * longer bookable. Rejected counts as answered — a rejection is the outcome of
 * this deal, and re-opening it would bring back the repeat booking this rule
 * replaced.
 */
export function isBookClosed(
  book: Pick<OrderBook, "mode" | "submissions" | "quotaRemaining" | "minTicket">,
): boolean {
  // A quota book is done when its quota is, not when an order is answered.
  if (book.mode === "quota") return !isBookingOpen(book);
  // Answered, named rather than "not in flight": a basket order is created
  // already `processing`, but spelling the two answers out means a third
  // in-flight status could not silently close a product.
  return book.submissions.some((s) => s.status === "completed" || s.status === "rejected");
}

/**
 * Whether a book still takes bookings, in the two words every booking tab's
 * list filters by and tags its rows with. See `isBookingOpen` for what closes
 * each kind: a basket's order being sent, a quota being used up.
 */
/**
 * The signed-in IC's own bookings in this book, optionally at one phase.
 *
 * Two callers and one answer on purpose. A basket is shared across the desk, so
 * a book can be filling nicely on other ICs' clients and have nothing to do
 * with this one; Order Management lists the IC's own work, so the panel drops
 * those books and the table groups what is left. If the two filtered
 * differently, a desk with no matching bookings would render as a table with
 * no rows rather than as an empty state.
 *
 * Cancelled bookings are included at `phase` "cancelled" and in the unfiltered
 * list: a client whose booking was pulled is still the IC's, and their row
 * still has something to say.
 */
export function ownBookings(
  book: OrderBook,
  icName: string,
  phase?: BookingPhase | null,
): Booking[] {
  return book.allBookings.filter(
    (b) => b.createdBy === icName && (!phase || bookingPhase(b, book) === phase),
  );
}

export type BookAvailability = "open" | "closed";

export function bookAvailability(book: OrderBook): BookAvailability {
  return isBookingOpen(book) ? "open" : "closed";
}

/**
 * What a book's availability reads as, in its own desk's words.
 *
 * A function rather than a map because only the open side differs: a basket is
 * เปิดจอง, a bond is เปิดรับคำสั่งซื้อ — see {@link ORDER_WORDS}. Closed is
 * closed on both.
 */
export function bookAvailabilityLabel(
  book: Pick<OrderBook, "mode">,
  availability: BookAvailability,
): string {
  return availability === "open" ? ORDER_WORDS[book.mode].availabilityOpen : "ปิด";
}

export const BOOK_AVAILABILITY_VARIANT: Record<BookAvailability, "green" | "gray"> = {
  open: "green",
  closed: "gray",
};



/** How full a quota book is, capped at 100. */
export function quotaUsedPct(book: OrderBook): number {
  if (book.targetAmount <= 0) return 0;
  return Math.min(100, (book.quotaUsed / book.targetAmount) * 100);
}

/**
 * How much of a book is spoken for, whichever way it fills.
 *
 * One answer for both modes, because every surface that draws a bar or ranks
 * books by fullness has to ask it: a basket collects toward its notional, a
 * bond draws down its issue quota. Which of the two is read is the only
 * difference, and reading it in two places is how a bar and the order it is
 * sorted in come to disagree.
 *
 * `headlineRound` on the basket side rather than `bookedAmount`: that counts
 * only bookings no order has carried, so a collected basket reads zero at the
 * very moment it is fullest. See the note there.
 */
export function bookFill(book: OrderBook): { taken: number; pct: number } {
  if (book.mode === "quota") {
    return { taken: book.quotaUsed, pct: quotaUsedPct(book) };
  }
  const round = headlineRound(book);
  return { taken: round.amount, pct: round.pct };
}

/**
 * A book's fill in THB, for ranking books that are priced differently.
 *
 * One desk can hold both — Fixed Income sells in baht, the rest in dollars —
 * and "which basket has taken the most" is meaningless until they are in the
 * same unit. See {@link USD_THB} for what the rate is and is not.
 */
export function bookFillThb(book: OrderBook): number {
  return bookFill(book).taken * (book.currency === "USD" ? USD_THB : 1);
}



/**
 * The round a book's headline figures should describe.
 *
 * Normally that is the open one — bookings collected so far against the target.
 * But a book whose order has gone downstream has *no* open round until someone
 * books into it again, and showing that empty round as the headline put
 * "0 USD · 0%" and "ยังขาดอีก 100,000 USD" directly under a green
 * "คำสั่งซื้อสำเร็จ" tag. Both numbers were true of the next round and the tag
 * was true of the last one, which is a contradiction the reader has to be told
 * about rather than left to resolve.
 *
 * So when there is nothing open and something has been sent, the headline falls
 * back to the round that was sent, and `previousRef` is set — every surface
 * that shows the headline uses it to say which round it is looking at.
 */
export function headlineRound(book: OrderBook): {
  bookings: Booking[];
  amount: number;
  pct: number;
  /** The submitted order these figures belong to, or `null` for the open round. */
  previousRef: string | null;
  /** 1-based: round 1 is the first order the book sent, or would send. */
  number: number;
  /** Of `amount`, how much the back office has confirmed — only a sent round has any. */
  confirmed: number;
} {
  const latest = book.submissions[0];
  const pctOf = (amount: number) =>
    book.targetAmount <= 0 ? 0 : Math.min(100, (amount / book.targetAmount) * 100);

  if (book.openBookings.length === 0 && latest) {
    const rows = book.allBookings.filter((b) => latest.bookingIds.includes(b.id));
    const amount = sum(rows);
    return {
      bookings: rows,
      amount,
      pct: pctOf(amount),
      previousRef: latest.backendRef,
      number: book.submissions.length,
      confirmed: latest.status === "completed" ? amount : 0,
    };
  }

  return {
    bookings: book.openBookings,
    amount: book.bookedAmount,
    pct: pctOf(book.bookedAmount),
    previousRef: null,
    number: book.submissions.length + 1,
    confirmed: 0,
  };
}

/**
 * A timestamp as this app writes them in a log: `24 Jul 2026 · 14:05`.
 *
 * Forced to UTC because every timestamp in the seed data is stamped at a UTC
 * hour (see `order-mock-data`). Rendering them in the viewer's zone would move
 * a 09:00 entry to 16:00 in Bangkok and, worse, disagree between the server
 * render and the client one.
 */
export function formatLogTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return `${date} · ${time}`;
}
