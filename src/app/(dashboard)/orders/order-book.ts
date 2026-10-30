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
  ProductOffer,
  OrderBookStatus,
  OrderLogEntry,
  OrderSubmission,
  RequirementRequest,
} from "@/types/domain";
import { REQUIREMENT_CATALOG } from "./order-requirements";
import { bookingModeFor, deskLabelFor, type BookableProduct } from "./bookable-products";

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
 * Before anything is sent the step is read off the bookings alone: short of
 * the target is still booking, at the target the IC can send. There is no
 * funds step between the two — a booking the client could not fund was never
 * placed (see `Booking`).
 *
 * Once sent, the order's own state is the step.
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
      summary: `ส่งคำสั่งซื้อ ${s.bookingIds.length} รายการ`,
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
  offers: ProductOffer[] = [],
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

  // An offer the client answered by booking has had its answer: the booking
  // row says everything the offer row would, and with a number on it.
  const booked = new Set(bookings.map((b) => b.clientId));
  const liveOffers = offers.filter((o) => o.status === "declined" || !booked.has(o.clientId));

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
    offers: liveOffers,
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
 * Where one client stands on a product, in the four words the chips filter by.
 * The order they happen in:
 *
 * - `offer` — the IC put the product in front of them and they have not
 *   answered. The only phase with no booking behind it (see {@link ProductOffer}).
 * - `review` — they took it, or the IC booked for them. A booking exists, so
 *   the money was checked when it was placed; from here it is the deal and the
 *   back office that are being waited on.
 * - `completed` — the back office accepted the order.
 * - `cancelled` — the booking was cancelled, the order rejected, or the client
 *   declined the offer.
 *
 * Coarser than `dealStatus`, which the table's Deal Status column still shows:
 * the chips sort a long list into a few piles, the tag says exactly which step.
 */
export type BookingPhase = "offer" | "review" | "completed" | "cancelled";

/**
 * A booking is past the offer by definition — it is what answering one looks
 * like — so it is never in that phase, however new it is.
 */
export function bookingPhase(booking: Booking, book: OrderBook): BookingPhase {
  if (booking.status === "cancelled") return "cancelled";
  const submission = book.submissions.find((s) => s.bookingIds.includes(booking.id));
  if (submission?.status === "completed") return "completed";
  if (submission?.status === "rejected") return "cancelled";
  return "review";
}

/** An offer is the `offer` phase until the client says no. */
export function offerPhase(offer: ProductOffer): BookingPhase {
  return offer.status === "declined" ? "cancelled" : "offer";
}

/** In the order a booking moves through them — the chips' order. */
export const BOOKING_PHASES: BookingPhase[] = ["offer", "review", "completed", "cancelled"];

export const BOOKING_PHASE_LABEL: Record<BookingPhase, string> = {
  offer: "Offer",
  review: "ตรวจสอบ",
  completed: "รับคำสั่งซื้อสำเร็จ",
  cancelled: "ยกเลิก",
};

/**
 * How one sent order reads, wherever it is listed.
 *
 * Deliberately shorter than {@link BOOK_PHASE_LABEL}: a book's tag has to
 * name the whole state ("ครบยอด รอส่งคำสั่งซื้อ"), while an order sits beside
 * its own reference and round, so "สำเร็จ" is unambiguous.
 */
export const SUBMISSION_TAG: Record<
  OrderSubmission["status"],
  { text: string; variant: "blue" | "green" | "red" }
> = {
  processing: { text: "กำลังดำเนินการ", variant: "blue" },
  completed: { text: "สำเร็จ", variant: "green" },
  rejected: { text: "ถูกปฏิเสธ", variant: "red" },
};

/**
 * Whether the product still takes bookings.
 *
 * Basket: a product is booked once, filled and sent as one order. From the
 * moment that order goes downstream nothing more can be booked — while the back
 * office is still working on it the product reads "กำลังดำเนินการ", and once it
 * answers the book is {@link isBookClosed closed}.
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

/** How much more can be booked right now — the cap on the next booking's amount. */
export function bookingRemaining(book: OrderBook): number {
  if (!isBookingOpen(book)) return 0;
  return book.mode === "quota"
    ? book.quotaRemaining
    : Math.max(0, book.targetAmount - book.bookedAmount);
}

/**
 * Whether the back office has answered the product's order — the point at which
 * the product leaves the catalogue (see `useClosedProductIds`).
 *
 * Not at sending: an order still in flight keeps its product listed, just no
 * longer bookable. Rejected counts as answered — a rejection is the outcome of
 * this deal, and re-opening it would bring back the repeat booking this rule
 * replaced.
 */
export function isBookClosed(
  book: Pick<OrderBook, "mode" | "submissions" | "quotaRemaining" | "minTicket">,
): boolean {
  // A quota book is done when its quota is, not when an order is answered.
  if (book.mode === "quota") return !isBookingOpen(book);
  return book.submissions.some((s) => s.status !== "processing");
}

/**
 * Whether a book still takes bookings, in the two words every booking tab's
 * list filters by and tags its rows with. See `isBookingOpen` for what closes
 * each kind: a basket's order being sent, a quota being used up.
 */
export type BookAvailability = "open" | "closed";

export function bookAvailability(book: OrderBook): BookAvailability {
  return isBookingOpen(book) ? "open" : "closed";
}

export const BOOK_AVAILABILITY_LABEL: Record<BookAvailability, string> = {
  open: "เปิดจอง",
  closed: "ปิด",
};

export const BOOK_AVAILABILITY_VARIANT: Record<BookAvailability, "green" | "gray"> = {
  open: "green",
  closed: "gray",
};

/** The list's filter chips, shared by the basket and quota tabs. */
export const BOOK_AVAILABILITY_STEPS: { id: BookAvailability | "all"; label: string; empty: string }[] = [
  { id: "all", label: "ทั้งหมด", empty: "ยังไม่มีรายการจองซื้อ" },
  { id: "open", label: BOOK_AVAILABILITY_LABEL.open, empty: "ไม่มีสินค้าที่ยังเปิดจอง" },
  { id: "closed", label: BOOK_AVAILABILITY_LABEL.closed, empty: "ไม่มีสินค้าที่ปิดแล้ว" },
];

/** How full a quota book is, capped at 100. */
export function quotaUsedPct(book: OrderBook): number {
  if (book.targetAmount <= 0) return 0;
  return Math.min(100, (book.quotaUsed / book.targetAmount) * 100);
}

/**
 * A quota book's bookings sorted by where their order is — waiting to be sent,
 * with the back office, done.
 */
export function quotaOrderCounts(book: OrderBook): {
  toSend: number;
  processing: number;
  completed: number;
} {
  const sentIds = new Set(book.submissions.flatMap((s) => s.bookingIds));
  const bySub = (status: OrderSubmission["status"]) =>
    new Set(book.submissions.filter((s) => s.status === status).flatMap((s) => s.bookingIds));
  const processing = bySub("processing");
  const completed = bySub("completed");
  const unsent = book.bookings.filter((b) => !sentIds.has(b.id));
  return {
    toSend: unsent.length,
    processing: book.bookings.filter((b) => processing.has(b.id)).length,
    completed: book.bookings.filter((b) => completed.has(b.id)).length,
  };
}

/** How full the book is, capped at 100 so an over-subscribed bar stays a bar. */
export function bookProgressPct(book: OrderBook): number {
  if (book.targetAmount <= 0) return 0;
  return Math.min(100, (book.bookedAmount / book.targetAmount) * 100);
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
