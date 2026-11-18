/**
 * Where one booking stands, derived from its book — shared by the product
 * page's Order Management tab, the book page, and the booking detail modal so
 * all three say the same thing about the same booking.
 */

import type { TagVariant } from "@sarunyu/system-one";
import type { Booking, OrderBook, RequirementItem, RequirementKey } from "@/types/domain";
import { REQUIREMENT_CATALOG } from "./order-requirements";
import { submissionFor } from "./order-book";

/** The four, in the order every surface lists them — see `productRequirementKeys`. */
const CHECK_ORDER: RequirementKey[] = ["wealth", "acknowledge", "kyc", "risk-profile"];

export type BookingStatusTag = { text: string; variant: TagVariant };

/** What the detail modal's tags read while it has no booking to describe. */
export const CLOSED_TAG = { text: "", variant: "gray" } as const;

/**
 * Where one booking is, read off the book rather than stored on the booking.
 *
 * The booking's own funds were settled when it was placed (see `Booking`), so
 * nothing here is ever waiting on money. What is left to report is how far
 * downstream the order has got — and on a bond that starts the moment the
 * booking does, because creating one sends it.
 */
export function dealStatus(booking: Booking, book: OrderBook): BookingStatusTag {
  if (booking.status === "cancelled") return { text: "ยกเลิกแล้ว", variant: "gray" };
  const submission = submissionFor(booking, book);
  if (submission?.status === "completed")
    return { text: "รับคำสั่งซื้อสำเร็จ", variant: "green" };
  if (submission?.status === "rejected") return { text: "ถูกปฏิเสธ", variant: "red" };
  // `sent` reads the same as `processing` — see `BookingPhase`. The difference
  // between them is whether the IC can still pull it, and the cancel button's
  // presence is where that is said.
  if (submission) return { text: "กำลังดำเนินการรับคำสั่งซื้อ", variant: "yellow" };
  // No order carries it, which on a basket is the normal first step and on a
  // bond cannot happen — `placeOrder` creates the two together. `lime` to
  // match `BOOKING_PHASE_VARIANT.pending`, which is where the choice is made.
  return { text: "จองแล้ว", variant: "lime" };
}

/**
 * The checks a booking was placed against — never the client's live status.
 *
 * Booking is gated on all four passing, so a row showing a pending or missing
 * check would be describing something that could not have happened. Three
 * sources, in order of how much they know:
 *
 * 1. the booking's own snapshot, taken when it was placed;
 * 2. the client's live items, borrowed for their labels and the risk rating —
 *    a seeded booking predates the snapshot field, and the gate is what tells
 *    us its answer;
 * 3. the catalogue alone, for a booking whose client this app has no record of.
 *
 * (3) is another IC's client on a shared basket. There is no readiness to
 * borrow — their KYC is their desk's business — but the booking exists, so the
 * checks passed, and four em dashes would say the opposite about a row sitting
 * next to ours. Passed with no values: the tick is what the gate proves, while
 * a risk *rating* is a fact about a person this app does not hold.
 */
export function checksAtBooking(booking: Booking, live: RequirementItem[]): RequirementItem[] {
  if (booking.checks) return booking.checks;
  if (live.length > 0) {
    return live.map((item) => ({ ...item, status: "passed" as const, detail: null }));
  }
  return CHECK_ORDER.map((key) => ({
    key,
    ...REQUIREMENT_CATALOG[key],
    value: null,
    status: "passed" as const,
    detail: null,
  }));
}

// ── Stand-ins for the back office ─────────────────────────────────────────────
//
// Payment and the pre-confirmation email are owned by systems this portal does
// not talk to yet, so neither is stored anywhere. Both are read off the
// booking's own submission instead, so the columns move with the deal in the
// demo rather than showing a fixed value. When those systems report back,
// replace these two.
//
// Both now have an answer from the moment the booking exists, because the
// booking itself is the event that starts them: the amount was checked against
// the client's cash to be placed at all (see `Booking`), and the
// pre-confirmation goes out on the back of that. Neither says "ยังไม่…" for a
// live booking any more — that wording came from when a booking sat waiting on
// a funds check that no longer happens.

/**
 * Where the money is.
 *
 * A placed booking already has the cash behind it — the form would not have
 * let it through otherwise — so it reads as held, not as "ยังไม่ถึงกำหนด".
 * Settlement proper happens when the back office accepts the order.
 */
export function paymentStatus(booking: Booking, book: OrderBook): BookingStatusTag {
  if (booking.status === "cancelled") return { text: "—", variant: "gray" };
  const submission = submissionFor(booking, book);
  if (submission?.status === "completed") return { text: "ชำระแล้ว", variant: "green" };
  if (submission?.status === "processing") return { text: "รอชำระ", variant: "yellow" };
  if (submission?.status === "rejected") return { text: "ไม่ต้องชำระ", variant: "gray" };
  return { text: "กันเงินแล้ว", variant: "lime" };
}

/**
 * The pre-confirmation email.
 *
 * Sent when the booking is placed — that is the thing being confirmed to the
 * client — and confirmed back when the order completes.
 */
export function emailStatus(booking: Booking, book: OrderBook): BookingStatusTag {
  if (booking.status === "cancelled") return { text: "—", variant: "gray" };
  const submission = submissionFor(booking, book);
  if (submission?.status === "completed") return { text: "ยืนยันแล้ว", variant: "green" };
  if (submission?.status === "rejected") return { text: "ยกเลิก", variant: "gray" };
  return { text: "ส่งแล้ว", variant: "blue" };
}
