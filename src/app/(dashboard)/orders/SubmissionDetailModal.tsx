"use client";

/**
 * One sent order, opened from the "รอบก่อนหน้า" list.
 *
 * A past round used to switch the page to the orders tab, which answered the
 * question eventually — the reader still had to find the row they had just
 * clicked among the others. A modal answers it where it was asked and leaves
 * the book underneath untouched.
 *
 * Laid out like {@link BookingDetailModal}: the facts in a two-column grid,
 * then the list the order carried, in the same grey divided frame the submit
 * confirmation uses. What this modal cannot do is anything — an order that has
 * gone downstream is a record, not a form, so there is no action in the footer
 * to put under it.
 */

import { Tag } from "@sarunyu/system-one";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import type { OrderBook, OrderSubmission } from "@/types/domain";
import { FieldCard, ReadOnlyField } from "./OrderBookingModal";
import {
  SUBMISSION_TAG,
  formatLogTime,
  formatOrderAmount,
  roundOfSubmission,
  submissionRows,
} from "./order-book";

export function SubmissionDetailModal({
  submission,
  book,
  onClose,
}: {
  /** `null` keeps the modal closed. */
  submission: OrderSubmission | null;
  book: OrderBook;
  onClose: () => void;
}) {
  return (
    <ResponsiveBottomSheetModal
      open={submission !== null}
      onClose={onClose}
      title={
        submission
          ? `คำสั่งซื้อรอบที่ ${roundOfSubmission(book, submission.id)}`
          : "คำสั่งซื้อ"
      }
      titleId="submission-detail-title"
      desktopMaxWidth="max-w-[614px]"
    >
      {submission && <Body submission={submission} book={book} />}
    </ResponsiveBottomSheetModal>
  );
}

function Body({
  submission,
  book,
}: {
  submission: OrderSubmission;
  book: OrderBook;
}) {
  const { isPrivate } = usePrivacy();
  const { rows, amount, holders } = submissionRows(book, submission);
  const tag = SUBMISSION_TAG[submission.status];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 md:px-6">
        <div className="grid grid-cols-1 gap-x-3 gap-y-4 md:grid-cols-2">
          <ReadOnlyField label="เลขที่คำสั่งซื้อ" value={submission.backendRef} />
          <FieldCard label="สถานะ">
            <div className="flex">
              <Tag text={tag.text} variant={tag.variant} size="small" />
            </div>
          </FieldCard>
          <ReadOnlyField
            label="ส่งเมื่อ"
            value={`${formatLogTime(submission.submittedAt)} · ${submission.submittedBy}`}
          />
          {/* An order still out has no answer to show, and an empty field reads
              better than a dash once it says what is being waited for. */}
          <ReadOnlyField
            label="ตอบกลับเมื่อ"
            value={
              submission.settledAt
                ? formatLogTime(submission.settledAt)
                : "รอผลจากระบบหลังบ้าน"
            }
          />
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
          <span className="type-body-2 !font-semibold text-foreground">
            รายการในคำสั่งซื้อนี้
          </span>
          <span className="type-caption rounded-full bg-[var(--fill-gray-100)] px-2 py-0.5 tabular-nums text-muted-foreground">
            {holders} ราย
          </span>
        </div>
        {/* Same grey, divided panel as the submit confirmation's list — this is
            that list, after the fact. */}
        <ul className="mt-3 flex flex-col divide-y divide-border overflow-hidden rounded-xl bg-[#f3f4f6]">
          {rows.map((b) => (
            <li key={b.id} className="flex items-center gap-3 px-4 py-3">
              <span className="type-body-2 min-w-0 flex-1 truncate text-foreground">
                {b.clientId} - {maskName(b.clientName, isPrivate)}
              </span>
              <span className="type-body-2 shrink-0 !font-semibold tabular-nums text-foreground">
                {formatOrderAmount(b.amount, book.currency)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <span className="type-body-2 text-muted-foreground">รวมทั้งสิ้น</span>
          <span className="type-subtitle-2 font-bold tabular-nums text-foreground">
            {formatOrderAmount(amount, book.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
