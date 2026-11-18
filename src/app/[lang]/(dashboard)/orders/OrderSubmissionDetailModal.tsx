"use client";

/**
 * One order the back office has answered, opened from its row in the header
 * bell.
 *
 * The bell row says "คำสั่งซื้อสำเร็จ" and a reference — this is the receipt
 * behind it: the verdict as a disc, the product, when it went and when it came
 * back, and the bookings it carried, ending at the notional. Built from the
 * same pieces as `BookingDetailModal` (`detail-sheet-ui`) so the two read as
 * one house style.
 *
 * Takes ids rather than the records: the book is read live here, so a sheet
 * left open while the data moves shows the data as it is now, and a book that
 * has gone away simply closes the sheet.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CaretRightIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import { Avatar, Button } from "@sarunyu/system-one";
import { getInitial } from "@/lib/client-utils";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import type { OrderBook, OrderSubmission } from "@/types/domain";
import { ordersListHref } from "./bookable-products";
import {
  CopyRow,
  SHEET_DASHED,
  SHEET_PANEL,
  SHEET_PRESSABLE,
  SheetBlock,
  SheetRow,
  StatusDisc,
  TONE,
} from "./detail-sheet-ui";
import { formatLogTime, formatOrderAmount } from "./order-book";
import { useOrderBooks } from "./use-order-books";

export type OrderSubmissionRef = { productId: string; submissionId: string };

export function OrderSubmissionDetailModal({
  target,
  onClose,
}: {
  /** `null` keeps the modal closed. */
  target: OrderSubmissionRef | null;
  onClose: () => void;
}) {
  const { data: books } = useOrderBooks();
  const book = target ? books.find((b) => b.productId === target.productId) : undefined;
  const submission = book?.submissions.find((s) => s.id === target?.submissionId);

  return (
    <ResponsiveBottomSheetModal
      open={!!book && !!submission}
      onClose={onClose}
      title="รายละเอียดคำสั่งซื้อ"
      titleId="order-submission-detail-title"
      desktopTitleHidden
      desktopMaxWidth="max-w-[520px]"
    >
      {book && submission && <Body book={book} submission={submission} onClose={onClose} />}
    </ResponsiveBottomSheetModal>
  );
}

function Body({
  book,
  submission,
  onClose,
}: {
  book: OrderBook;
  submission: OrderSubmission;
  onClose: () => void;
}) {
  const router = useRouter();
  const { isPrivate } = usePrivacy();

  const ok = submission.status === "completed";
  const rejected = submission.status === "rejected";
  const tone = ok ? "green" : rejected ? "red" : "primary";
  const heading = ok
    ? "คำสั่งซื้อสำเร็จ"
    : rejected
      ? "คำสั่งซื้อถูกปฏิเสธ"
      : "กำลังดำเนินการรับคำสั่งซื้อ";

  // `allBookings`, not `bookings`: what the order carried is history, and a
  // booking's later state should not drop it from the order that took it.
  const carried = submission.bookingIds
    .map((id) => book.allBookings.find((b) => b.id === id))
    .filter((b): b is NonNullable<typeof b> => !!b);
  const total = carried.reduce((sum, b) => sum + b.amount, 0);

  const goToOrders = () => {
    onClose();
    // `flash` points the list at this order: its rows pulse on arrival — see
    // `OrderRecordsTable`.
    router.push(`${ordersListHref(book.productId)}&flash=${encodeURIComponent(submission.id)}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-6 pb-6 pt-2 text-center">
          <StatusDisc variant={tone}>
            {rejected ? <XIcon size={30} weight="bold" /> : <CheckIcon size={30} weight="bold" />}
          </StatusDisc>
          <p className={`pt-3 text-title-lg leading-[32px] font-bold ${TONE[tone].text}`}>
            {heading}
          </p>
          <div className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-4">
            <span className="shrink-0 rounded-full bg-[var(--fill-blue-100)] px-2 py-0.5 text-meta font-semibold text-[var(--fill-blue-700)]">
              {book.desk}
            </span>
            <span className="text-title-sm leading-[28px] font-bold text-foreground">
              {book.productName}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 pb-5 pt-2 md:px-6">
          <div className={`flex flex-col gap-3 ${SHEET_PANEL}`}>
            <SheetBlock title="รายละเอียดคำสั่งซื้อ">
              <CopyRow label="เลขที่คำสั่งซื้อ" value={submission.backendRef} />
              <SheetRow label="ส่งเมื่อ" value={formatLogTime(submission.submittedAt)} />
              <SheetRow label="ส่งโดย" value={submission.submittedBy} />
              {submission.settledAt && (
                <SheetRow
                  label={rejected ? "ปฏิเสธเมื่อ" : "สำเร็จเมื่อ"}
                  value={formatLogTime(submission.settledAt)}
                />
              )}
            </SheetBlock>

            {carried.length > 0 && (
              <>
                <div className={SHEET_DASHED} />
                <SheetBlock title={`ลูกค้าในคำสั่งซื้อนี้ (${carried.length})`}>
                  {/* One line per client — the name to their profile on the
                      left, what they put in on the right. */}
                  {carried.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-4 py-1">
                      <Link
                        href={`/client/${b.clientId}`}
                        onClick={onClose}
                        className={`-ml-2 flex min-w-0 items-center gap-2 px-2 py-0.5 no-underline ${SHEET_PRESSABLE}`}
                      >
                        <Avatar type="text" initials={getInitial(b.clientName)} size="xs" />
                        <span className="truncate text-body-sm font-semibold text-foreground">
                          {maskName(b.clientName, isPrivate)}
                        </span>
                        <CaretRightIcon size={14} className="shrink-0 text-muted-foreground" />
                      </Link>
                      <span className="shrink-0 text-body-sm font-semibold tabular-nums text-foreground">
                        {formatOrderAmount(b.amount, book.currency)}
                      </span>
                    </div>
                  ))}
                </SheetBlock>
              </>
            )}
          </div>

          <div
            className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3 ${
              rejected ? "bg-[var(--fill-gray-100)]" : "bg-[var(--fill-p1-100)]"
            }`}
          >
            <p className="text-body-sm font-bold text-foreground">Notional Amount</p>
            <p
              className={`text-title-lg leading-[32px] font-bold tabular-nums ${
                rejected ? "text-muted-foreground line-through" : "text-primary-action"
              }`}
            >
              {formatOrderAmount(total, book.currency)}
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              variant="plain"
              size="md"
              onClick={goToOrders}
              rightIcon={<ArrowRightIcon size={16} />}
            >
              ดูใน Order Management
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
