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

/**
 * Which state the book is in, decided from the *unsent* bookings rather than
 * from every booking ever placed.
 *
 * That distinction is the whole reason a book can be used twice: once an order
 * has gone downstream its bookings stop counting towards the target, so the
 * next booking starts a fresh round at zero instead of finding the bar already
 * cleared by an order that has already been placed.
 */
function bookStatus(
  openAmount: number,
  target: number,
  latest: OrderSubmission | undefined,
): OrderBookStatus {
  if (latest?.status === "processing") return "processing";
  if (openAmount === 0 && latest?.status === "completed") return "completed";
  if (openAmount === 0 && latest?.status === "rejected") return "rejected";
  return openAmount >= target ? "ready" : "collecting";
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
    currency: product.currency,
    targetAmount: target,
    minTicket: minTicketFor(product),
    bookings: live,
    openBookings: open,
    allBookings: bookings,
    bookedAmount: sum(open),
    confirmedAmount: sum(live.filter((b) => completedIds.has(b.id))),
    status: bookStatus(sum(open), target, ordered[0]),
    submissions: ordered,
    logs: buildLogs(product, bookings, submissions, requests),
  };
}

// ── Presentation ─────────────────────────────────────────────────────────────

export const BOOK_STATUS_LABEL_TH: Record<OrderBookStatus, string> = {
  collecting: "กำลังรวบรวมยอด",
  ready: "ครบยอด รอส่งคำสั่งซื้อ",
  processing: "กำลังดำเนินการ",
  completed: "คำสั่งซื้อสำเร็จ",
  rejected: "คำสั่งซื้อถูกปฏิเสธ",
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
  ready: "green",
  processing: "blue",
  completed: "green",
  rejected: "red",
};

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

/** One fill-and-send cycle of a book. */
export type BookRound = {
  /** 1-based, oldest first. */
  number: number;
  /** The order this round went out as; `null` for the round still open. */
  submission: OrderSubmission | null;
  /** Every booking placed in this round, cancelled ones included. */
  bookings: Booking[];
  /** Sum of the live bookings. */
  amount: number;
};

/**
 * A book split into its rounds, **newest first**.
 *
 * A book can be filled and sent more than once — each send is a new order on
 * the same product — so a round is one submission and the bookings it carried,
 * plus the open round: every booking no submission has carried yet. Cancelled
 * bookings are never sent, so they always sit in the open round; that is where
 * they were cancelled from.
 *
 * The open round is listed only when something is in it — a book whose last
 * order has just gone out has no round 2 until someone books into one.
 */
export function bookRounds(book: OrderBook): BookRound[] {
  const sent = [...book.submissions].reverse(); // oldest first
  const carried = new Set(sent.flatMap((s) => s.bookingIds));
  const rounds: BookRound[] = sent.map((submission, i) => {
    const rows = book.allBookings.filter((b) => submission.bookingIds.includes(b.id));
    return { number: i + 1, submission, bookings: rows, amount: sum(rows) };
  });

  const open = book.allBookings.filter((b) => !carried.has(b.id));
  if (open.length > 0) {
    rounds.push({
      number: sent.length + 1,
      submission: null,
      bookings: open,
      amount: sum(open.filter((b) => b.status !== "cancelled")),
    });
  }
  return rounds.reverse();
}

/** Which round a booking belongs to — see {@link bookRounds}. */
export function roundNumberOf(book: OrderBook, bookingId: string): number {
  const index = book.submissions.findIndex((s) => s.bookingIds.includes(bookingId));
  // `submissions` is newest first, so index 0 is the latest round.
  return index === -1 ? book.submissions.length + 1 : book.submissions.length - index;
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
