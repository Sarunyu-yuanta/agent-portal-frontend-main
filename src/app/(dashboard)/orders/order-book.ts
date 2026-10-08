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
  CreditStatus,
  OrderBook,
  OrderBookStatus,
  OrderLogEntry,
  OrderSubmission,
  RequirementRequest,
} from "@/types/domain";
import { REQUIREMENT_CATALOG } from "./order-requirements";
import { deskLabelFor, type BookableProduct } from "./bookable-products";

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

/** A booking's funds check; seeded bookings predate it and read as funded. */
export const creditOf = (booking: Booking): CreditStatus => booking.credit ?? "sufficient";

/**
 * Which step the product is at — see {@link OrderBookStatus} for the steps.
 *
 * Before anything is sent the step is read off the bookings: short of the
 * target is still booking; at the target, it waits until every booking's funds
 * check has come back sufficient, and only then can the IC send. One
 * insufficient booking holds the whole product at the check until the IC
 * cancels it and books someone else in its place.
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
  if (openAmount < target) return "collecting";
  return open.every((b) => creditOf(b) === "sufficient") ? "ready" : "checking";
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
): OrderBook {
  const target = orderTargetFor(product);
  const live = bookings.filter((b) => b.status === "booked");
  const sentIds = new Set(submissions.flatMap((s) => s.bookingIds));
  const open = live.filter((b) => !sentIds.has(b.id));

  const completedIds = new Set(
    submissions.filter((s) => s.status === "completed").flatMap((s) => s.bookingIds),
  );

  const ordered = [...submissions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return {
    productId: product.id,
    productName: product.underlying,
    productType: product.productName,
    desk: deskLabelFor(product),
    logos: product.logos,
    currency: product.currency,
    targetAmount: target,
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

/** The steps, in the order a product moves through them — the page's filter chips. */
export const BOOK_STEPS: OrderBookStatus[] = [
  "collecting",
  "checking",
  "ready",
  "processing",
  "completed",
  "rejected",
];

export const BOOK_STATUS_LABEL_TH: Record<OrderBookStatus, string> = {
  collecting: "ยืนยันการจองซื้อ",
  checking: "รอตรวจสอบวงเงิน",
  ready: "มีวงเงินเพียงพอ",
  processing: "ยืนยันรับคำสั่งซื้อ",
  completed: "รับคำสั่งซื้อสำเร็จ",
  rejected: "ยกเลิก",
};

/**
 * The design system's `Tag` variant for each state.
 *
 * `ready` is green rather than blue: it is the one state that asks the IC to do
 * something, and it earns the colour that says "go" over the one every neutral
 * chip in this app already uses.
 */
export const BOOK_STATUS_VARIANT: Record<
  OrderBookStatus,
  "blue" | "green" | "yellow" | "red" | "gray"
> = {
  collecting: "gray",
  checking: "yellow",
  ready: "green",
  processing: "blue",
  completed: "green",
  rejected: "red",
};

/**
 * How one sent order reads, wherever it is listed.
 *
 * Deliberately shorter than {@link BOOK_STATUS_LABEL_TH}: a book's tag has to
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
 * A product is booked once: filled and sent as one order. From the moment that
 * order goes downstream nothing more can be booked — while the back office is
 * still working on it the product reads "กำลังดำเนินการ", and once it answers
 * the book is {@link isBookClosed closed}.
 */
export function isBookingOpen(book: Pick<OrderBook, "submissions">): boolean {
  return book.submissions.length === 0;
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
export function isBookClosed(book: Pick<OrderBook, "submissions">): boolean {
  return book.submissions.some((s) => s.status !== "processing");
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
