"use client";

/**
 * One booking, opened from its row in a product's Order Management tab.
 *
 * Laid out like the booking form it came from — who, which account, the four
 * checks — so the IC reads it the same way they wrote it, with the order's own
 * progress (amount, deal, payment, email) underneath where the amount field
 * used to be.
 */

import { useState } from "react";
import { Button, Tag, type ToastStatus } from "@sarunyu/system-one";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { usePrivacy } from "@/contexts/privacy-context";
import { useOrders } from "@/contexts/orders-context";
import { getClientProfile } from "@/data/client-profiles";
import { maskName } from "@/lib/mask-name";
import type { Booking, OrderBook, RequirementItem } from "@/types/domain";
import type { BookableProduct } from "./bookable-products";
import { formatLogTime, formatOrderAmount } from "./order-book";
import { FieldCard, ReadOnlyField, StatusField } from "./OrderBookingModal";
import type { BookingStatusTag } from "./booking-status";

export function BookingDetailModal({
  booking,
  book,
  product,
  checks,
  deal,
  payment,
  email,
  onClose,
  onNotice,
}: {
  /** `null` keeps the modal closed. */
  booking: Booking | null;
  book: OrderBook;
  product: BookableProduct;
  /** The four checks as they stood when this booking was placed. */
  checks: RequirementItem[];
  deal: BookingStatusTag;
  payment: BookingStatusTag;
  email: BookingStatusTag;
  onClose: () => void;
  /** The page owns the toast stack — cancelling closes this, taking its DOM. */
  onNotice: (message: string, status: ToastStatus) => void;
}) {
  return (
    <ResponsiveBottomSheetModal
      open={booking !== null}
      onClose={onClose}
      title={`รายละเอียดการจอง ${product.underlying} ${product.coupon}`}
      titleId="booking-detail-title"
      desktopMaxWidth="max-w-[614px]"
    >
      {booking && (
        <Body
          booking={booking}
          book={book}
          checks={checks}
          deal={deal}
          payment={payment}
          email={email}
          onClose={onClose}
          onNotice={onNotice}
        />
      )}
    </ResponsiveBottomSheetModal>
  );
}

function Body({
  booking,
  book,
  checks,
  deal,
  payment,
  email,
  onClose,
  onNotice,
}: {
  booking: Booking;
  book: OrderBook;
  checks: RequirementItem[];
  deal: BookingStatusTag;
  payment: BookingStatusTag;
  email: BookingStatusTag;
  onClose: () => void;
  onNotice: (message: string, status: ToastStatus) => void;
}) {
  const { isPrivate } = usePrivacy();
  const { cancelBooking } = useOrders();
  const [cancelling, setCancelling] = useState(false);

  const profile = getClientProfile(booking.clientId);
  const name = maskName(booking.clientName, isPrivate);
  const submission = book.submissions.find((s) => s.bookingIds.includes(booking.id));
  const passed = checks.filter((i) => i.status === "passed").length;
  // Only a booking still on the open round can be pulled — once an order has
  // carried it downstream, the portal is no longer the record of it.
  const cancellable = booking.status !== "cancelled" && !submission;

  const cancel = async () => {
    setCancelling(true);
    await cancelBooking(booking.id);
    setCancelling(false);
    onClose();
    onNotice(`ยกเลิกการจองของ ${name} แล้ว`, "information");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 md:px-6">
        <div className="grid grid-cols-1 gap-x-3 gap-y-4 md:grid-cols-2">
          <ReadOnlyField label="Customer" value={`${booking.clientId} - ${name}`} />
          <ReadOnlyField label="Full Name (TH)" value={maskName(profile.nameTh, isPrivate)} />
          <ReadOnlyField label="Account No" value={profile.accountNo} />
          <ReadOnlyField label="IC Name" value={booking.createdBy} />
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
          <span className="type-body-2 !font-semibold text-foreground">
            ข้อมูลที่ต้องมีก่อนจองซื้อ
          </span>
          <span className="type-caption text-muted-foreground">ณ วันที่จอง</span>
          <span
            className={`type-caption rounded-full px-2 py-0.5 tabular-nums ${
              passed === checks.length
                ? "bg-[var(--fill-green-100)] text-[var(--fill-green-600)]"
                : "bg-[var(--fill-gray-100)] text-muted-foreground"
            }`}
          >
            {passed}/{checks.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 pt-3 md:grid-cols-2">
          {checks.map((item) => (
            <StatusField key={item.key} item={item} />
          ))}
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <span className="type-body-2 !font-semibold text-foreground">รายการจอง</span>
          <div className="grid grid-cols-1 gap-x-3 gap-y-4 pt-3 md:grid-cols-2">
            <FieldCard label="Notional Amount">
              <span
                className={`type-body-2 !font-semibold tabular-nums ${
                  booking.status === "cancelled"
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {formatOrderAmount(booking.amount, book.currency)}
              </span>
            </FieldCard>
            <ReadOnlyField label="จองเมื่อ" value={formatLogTime(booking.createdAt)} />
            <StatusCard label="Deal Status" tag={deal} />
            <StatusCard label="Payment Status" tag={payment} />
            <StatusCard label="Email Pre-Confirmation" tag={email} />
            {submission && (
              <ReadOnlyField label="เลขที่คำสั่งซื้อ" value={submission.backendRef} />
            )}
          </div>
        </div>

        {/* Inside the body, at the very end, centred — reached only after
            reading the booking it would undo. No footer "ปิด": the header's ✕
            closes it, and a second close button only sat next to this one. */}
        {cancellable && (
          <div className="mt-6 flex justify-center">
            <Button
              variant={cancelling ? "disabled" : "plain"}
              size="md"
              disabled={cancelling}
              onClick={cancel}
              className="text-[var(--fill-red-600)]"
            >
              {cancelling ? "กำลังยกเลิก…" : "ยกเลิกการจอง"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({ label, tag }: { label: string; tag: BookingStatusTag }) {
  return (
    <FieldCard label={label}>
      <div className="flex">
        <Tag text={tag.text} variant={tag.variant} size="small" />
      </div>
    </FieldCard>
  );
}
