/**
 * Where one booking stands, derived from its book — shared by the product
 * page's Order Management tab, the book page, and the booking detail modal so
 * all three say the same thing about the same booking.
 */

import type { TagVariant } from "@sarunyu/system-one";
import type { Booking, OrderBook, RequirementItem } from "@/types/domain";
import { creditOf } from "./order-book";

export type BookingStatusTag = { text: string; variant: TagVariant };

/** What the detail modal's tags read while it has no booking to describe. */
export const CLOSED_TAG = { text: "", variant: "gray" } as const;

/**
 * Where one booking is, read off the book rather than stored on the booking.
 *
 * Before the order is sent, the booking's own funds check comes first — a
 * booking still being checked, or one that failed, is what the IC has to look
 * at. A funded one is waiting on the rest of the deal: still filling, or full
 * and waiting for the IC to send.
 */
export function dealStatus(booking: Booking, book: OrderBook): BookingStatusTag {
  if (booking.status === "cancelled") return { text: "ยกเลิกแล้ว", variant: "gray" };
  const submission = book.submissions.find((s) => s.bookingIds.includes(booking.id));
  if (submission?.status === "processing") return { text: "กำลังดำเนินการ", variant: "blue" };
  if (submission?.status === "completed") return { text: "สำเร็จ", variant: "green" };
  if (submission?.status === "rejected") return { text: "ถูกปฏิเสธ", variant: "red" };
  const credit = creditOf(booking);
  if (credit === "pending") return { text: "รอตรวจสอบวงเงิน", variant: "yellow" };
  if (credit === "insufficient") return { text: "วงเงินไม่เพียงพอ", variant: "red" };
  return book.status === "ready"
    ? { text: "รอส่งคำสั่งซื้อ", variant: "lime" }
    : { text: "มีวงเงินเพียงพอ", variant: "green" };
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
// booking's own submission instead — which is the order they really happen in
// (an email goes out once the order is placed, payment is due once it is
// accepted) — so the columns move with the deal in the demo rather than
// showing a fixed value. When those systems report back, replace these two.

/** Whether the client has paid — only asked once the order has gone in. */
export function paymentStatus(booking: Booking, book: OrderBook): BookingStatusTag {
  if (booking.status === "cancelled") return { text: "—", variant: "gray" };
  const submission = book.submissions.find((s) => s.bookingIds.includes(booking.id));
  if (submission?.status === "completed") return { text: "ชำระแล้ว", variant: "green" };
  if (submission?.status === "processing") return { text: "รอชำระ", variant: "yellow" };
  if (submission?.status === "rejected") return { text: "ไม่ต้องชำระ", variant: "gray" };
  return { text: "ยังไม่ถึงกำหนด", variant: "gray" };
}

/** The pre-confirmation email the client receives when their order is placed. */
export function emailStatus(booking: Booking, book: OrderBook): BookingStatusTag {
  if (booking.status === "cancelled") return { text: "—", variant: "gray" };
  const submission = book.submissions.find((s) => s.bookingIds.includes(booking.id));
  if (submission?.status === "completed") return { text: "ยืนยันแล้ว", variant: "green" };
  if (submission?.status === "processing") return { text: "ส่งแล้ว", variant: "blue" };
  if (submission?.status === "rejected") return { text: "ยกเลิก", variant: "gray" };
  return { text: "ยังไม่ส่ง", variant: "gray" };
}
