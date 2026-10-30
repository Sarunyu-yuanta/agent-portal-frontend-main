/**
 * Where one booking stands, derived from its book — shared by the product
 * page's Order Management tab, the book page, and the booking detail modal so
 * all three say the same thing about the same booking.
 */

import type { TagVariant } from "@sarunyu/system-one";
import type { Booking, OrderBook, RequirementItem } from "@/types/domain";

export type BookingStatusTag = { text: string; variant: TagVariant };

/** What the detail modal's tags read while it has no booking to describe. */
export const CLOSED_TAG = { text: "", variant: "gray" } as const;

/**
 * Where one booking is, read off the book rather than stored on the booking.
 *
 * Before the order is sent there is only the deal to wait on — the booking's
 * own funds were settled when it was placed (see `Booking`), so a booking is
 * either waiting for the basket to fill or waiting for the IC to send it.
 */
export function dealStatus(booking: Booking, book: OrderBook): BookingStatusTag {
  if (booking.status === "cancelled") return { text: "ยกเลิกแล้ว", variant: "gray" };
  const submission = book.submissions.find((s) => s.bookingIds.includes(booking.id));
  if (submission?.status === "processing") return { text: "กำลังดำเนินการ", variant: "blue" };
  if (submission?.status === "completed") return { text: "สำเร็จ", variant: "green" };
  if (submission?.status === "rejected") return { text: "ถูกปฏิเสธ", variant: "red" };
  // A quota booking is its own order, so it is waiting on nobody but the IC;
  // a basket booking waits for the rest of the deal first.
  return book.mode === "quota" || book.status === "ready"
    ? { text: "รอส่งคำสั่งซื้อ", variant: "lime" }
    : { text: "รอยอดครบ", variant: "green" };
}

/**
 * The checks a booking was placed against — never the client's live status.
 *
 * Booking is gated on all four passing, so a row showing a pending or missing
 * check would be describing something that could not have happened. A booking
 * made in this session carries its own snapshot. A seeded one predates that
 * field, and the gate is what tells us its answer: every check passed. The
 * live items are borrowed only for their labels and the risk rating.
 */
export function checksAtBooking(booking: Booking, live: RequirementItem[]): RequirementItem[] {
  return (
    booking.checks ??
    live.map((item) => ({ ...item, status: "passed" as const, detail: null }))
  );
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
  const submission = book.submissions.find((s) => s.bookingIds.includes(booking.id));
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
  const submission = book.submissions.find((s) => s.bookingIds.includes(booking.id));
  if (submission?.status === "completed") return { text: "ยืนยันแล้ว", variant: "green" };
  if (submission?.status === "rejected") return { text: "ยกเลิก", variant: "gray" };
  return { text: "ส่งแล้ว", variant: "blue" };
}
