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

import { LocaleLink as Link } from "@/i18n/navigation";
import { useLocalizedRouter } from "@/i18n/navigation";
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
import { NotFoundState } from "@/components/ui/empty-state";
import { useT } from "@/i18n/I18nProvider";
import { useLocale } from "@/i18n/I18nProvider";

export type OrderSubmissionRef = { productId: string; submissionId: string };

export function OrderSubmissionDetailModal({
  target,
  onClose,
}: {
  /** `null` keeps the modal closed. */
  target: OrderSubmissionRef | null;
  onClose: () => void;
}) {
  const { data: books, isLoading } = useOrderBooks();
  const t = useT();
  const book = target ? books.find((b) => b.productId === target.productId) : undefined;
  const submission = book?.submissions.find((s) => s.id === target?.submissionId);

  // Opens on the click, whatever the lookup finds. It used to open only when
  // both resolved, so a bell row pointing at an order that had gone did nothing
  // at all — indistinguishable from a click that didn't register.
  return (
    <ResponsiveBottomSheetModal
      open={target !== null}
      onClose={onClose}
      title={t.orders.submission.title}
      titleId="order-submission-detail-title"
      desktopTitleHidden
      desktopMaxWidth="max-w-[520px]"
    >
      {target !== null &&
        (isLoading ? (
          <p className="type-body-2 px-6 py-16 text-center text-muted-foreground">
            {t.common.loading}
          </p>
        ) : book && submission ? (
          <Body book={book} submission={submission} onClose={onClose} />
        ) : (
          <NotFoundState
            message={t.states.notFoundOrder}
            onBack={onClose}
            backLabel={t.common.close}
          />
        ))}
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
  const locale = useLocale();
  const t = useT();
  const router = useLocalizedRouter();
  const { isPrivate } = usePrivacy();

  const ok = submission.status === "completed";
  const rejected = submission.status === "rejected";
  const tone = ok ? "green" : rejected ? "red" : "primary";
  const heading = ok
    ? t.orders.submission.completed
    : rejected
      ? t.orders.submission.rejected
      : t.orders.submission.processing;

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
        <div className="flex flex-col items-center px-6 pt-2 pb-6 text-center">
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

        <div className="flex flex-col gap-3 px-5 pt-2 pb-5 md:px-6">
          <div className={`flex flex-col gap-3 ${SHEET_PANEL}`}>
            <SheetBlock title={t.orders.submission.title}>
              <CopyRow label={t.orders.orderRef} value={submission.backendRef} />
              <SheetRow
                label={t.orders.submission.sentAt}
                value={formatLogTime(submission.submittedAt, locale)}
              />
              <SheetRow label={t.orders.submission.sentBy} value={submission.submittedBy} />
              {submission.settledAt && (
                <SheetRow
                  label={
                    rejected ? t.orders.submission.rejectedAt : t.orders.submission.completedAt
                  }
                  value={formatLogTime(submission.settledAt, locale)}
                />
              )}
            </SheetBlock>

            {carried.length > 0 && (
              <>
                <div className={SHEET_DASHED} />
                <SheetBlock title={t.orders.submission.clients(carried.length)}>
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
                      <span className="shrink-0 text-body-sm font-semibold text-foreground tabular-nums">
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
            <p className="text-body-sm font-bold text-foreground">
              {t.orders.field.notionalAmount}
            </p>
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
              {t.orders.submission.viewInOrders}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
