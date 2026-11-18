"use client";

/**
 * One booking, opened from its row in a product's Order Management tab.
 *
 * Built from the same receipt pieces as `TransactionDetailModal`
 * (`detail-sheet-ui`): where the booking stands as a disc and a coloured
 * heading, the product named under it, then a grey panel of label-left /
 * value-right rows ending at the notional. The four checks keep their own
 * cards below — they are a group being scanned, not facts being read off.
 *
 * It used to mirror the booking *form* instead, field for field, on the
 * reasoning that the IC should read it the way they wrote it. What that
 * actually produced was eight label/value pairs of equal weight for something
 * whose first question is only ever "did this go through".
 */

import { useState } from "react";
import {
  BookmarkSimpleIcon,
  CaretDownIcon,
  CheckIcon,
  HourglassMediumIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button, Tag, type ToastStatus } from "@sarunyu/system-one";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { usePrivacy } from "@/contexts/privacy-context";
import { useOrders } from "@/contexts/orders-context";
import { getClientProfile } from "@/data/client-profiles";
import { maskName } from "@/lib/mask-name";
import type { Booking, OrderBook, RequirementItem } from "@/types/domain";
import type { BookableProduct } from "./bookable-products";
import {
  ClientRow,
  CopyRow,
  SHEET_DASHED,
  SHEET_PANEL,
  SHEET_PRESSABLE,
  SheetBlock,
  SheetRow,
  StatusDisc,
  TONE,
  type Tone,
} from "./detail-sheet-ui";
import {
  BOOKING_PHASE_LABEL,
  bookingPhase,
  submissionFor,
  formatLogTime,
  formatOrderAmount,
  type BookingPhase,
} from "./order-book";
import { ORDER_WORDS } from "./order-words";
import { CALL_DIRECTION_LABEL, EVIDENCE_CHANNEL, formatFileSize } from "./order-evidence";
import { STATUS_CHIP } from "./OrderBookingModal";
import type { BookingStatusTag } from "./booking-status";

/**
 * The disc, by the step the booking is at rather than by its deal status.
 *
 * The status is the finer-grained thing ("จองแล้ว", "ถูกปฏิเสธ") and it colours
 * the words; the disc answers the coarse question, so it follows the step.
 *
 * `processing` takes yellow and an hourglass — the colour the bell already
 * rings "ครบยอดแล้ว" in, so the notification and the sheet agree. `pending`
 * keeps the app's own blue, and a bookmark rather than a magnifying glass:
 * nothing is under review, the booking is simply placed.
 */
const PHASE_DISC: Record<
  BookingPhase,
  { tone: Tone; glyph: React.ReactNode }
> = {
  pending: { tone: "primary", glyph: <BookmarkSimpleIcon size={28} weight="fill" /> },
  processing: { tone: "yellow", glyph: <HourglassMediumIcon size={28} weight="fill" /> },
  completed: { tone: "green", glyph: <CheckIcon size={30} weight="bold" /> },
  cancelled: { tone: "gray", glyph: <XIcon size={30} weight="bold" /> },
};

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
      title={`รายละเอียด${ORDER_WORDS[book.mode].record} ${product.underlying} ${product.coupon}`}
      titleId="booking-detail-title"
      // The sheet opens with its own heading — the deal status in colour, with
      // the product named under it. A second heading above said both again.
      desktopTitleHidden
      desktopMaxWidth="max-w-[560px]"
    >
      {booking && (
        <Body
          booking={booking}
          book={book}
          product={product}
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

/**
 * One check as a row: what was needed, and whether it was there.
 *
 * A rating takes the icon's place rather than sitting beside it — "Aggressive"
 * already answers the row, and an icon next to it would be a second verdict
 * about a value that is its own. Same bargain the booking form's cards strike.
 */
function CheckRow({ item }: { item: RequirementItem }) {
  const chip = STATUS_CHIP[item.status];
  const Icon = chip.icon;
  return (
    <SheetRow label={item.label} hint={item.detail}>
      {item.value ? (
        <span className={`text-body-sm font-bold ${chip.fg}`}>{item.value}</span>
      ) : (
        <Icon size={20} weight="fill" className={`shrink-0 ${chip.fg}`} />
      )}
    </SheetRow>
  );
}

function Body({
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
  booking: Booking;
  book: OrderBook;
  product: BookableProduct;
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
  /** The checks start folded — see the block itself for why. */
  const [checksOpen, setChecksOpen] = useState(false);

  const profile = getClientProfile(booking.clientId);
  const name = maskName(booking.clientName, isPrivate);
  const submission = submissionFor(booking, book);
  const words = ORDER_WORDS[book.mode];
  const passed = checks.filter((i) => i.status === "passed").length;
  const phase = bookingPhase(booking, book);
  // Phase, not `booking.status` — a booking whose order was rejected is still
  // `"booked"`, and the amount below it has to read as struck through under a
  // ยกเลิก disc.
  const cancelled = phase === "cancelled";
  /**
   * Whether the IC can still pull it — one window per desk, and they close for
   * the same reason: the moment the back office has the order, it is theirs.
   *
   * - **basket** — until an order carries the booking at all. The back office
   *   creates that order by collecting the basket, so its existence *is* the
   *   handover.
   * - **quota** — while the order is still `sent`. Creating a bond order sends
   *   it, so there is no before-the-order window to use instead; this is the
   *   gap before pickup (`BACKOFFICE_PICKUP_MS`), and the only one.
   *
   * `booking.status`, not `phase`: a booking whose order was rejected is
   * cancelled-*looking* but was never cancelled, and offering to cancel it
   * again would be offering to undo the back office.
   */
  const cancellable =
    booking.status !== "cancelled" &&
    (book.mode === "quota" ? submission?.status === "sent" : !submission);

  const cancel = async () => {
    setCancelling(true);
    await cancelBooking(booking.id);
    setCancelling(false);
    onClose();
    onNotice(`${words.cancel}ของ ${name} แล้ว`, "information");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-6 pb-6 pt-2 text-center">
          {/* The disc, in the status's own colour, with the step it is at
              named under it. A stepper lived here for a while and said more
              than the sheet needed: three labels and two connectors to answer
              "where is this", which one circle and one word answer. */}
          <StatusDisc variant={PHASE_DISC[phase].tone}>{PHASE_DISC[phase].glyph}</StatusDisc>
          <p className={`pt-3 text-title-lg leading-[32px] font-bold ${TONE[PHASE_DISC[phase].tone].text}`}>
            {BOOKING_PHASE_LABEL[book.mode][phase]}
          </p>
          {/* The product, with the desk as its badge — the sheet is reached
              from a book that is already one desk's, but it is also reached
              from a client's row, where it is the first thing that says which
              desk's paperwork this is. */}
          {/* `pt-4`, not the 6px it had: the heading is 20px bold and the line
              under it is 16px, and at six pixels apart the two read as one
              run-on phrase rather than a verdict and the thing it is about. */}
          <div className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-4">
            <span className="shrink-0 rounded-full bg-[var(--fill-blue-100)] px-2 py-0.5 text-meta font-semibold text-[var(--fill-blue-700)]">
              {words.action}
            </span>
            <span className="text-title-sm leading-[28px] font-bold text-foreground">
              {product.underlying}
            </span>
            <span className="min-w-0 truncate text-label text-muted-foreground">
              {product.coupon}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 pb-5 pt-2 md:px-6">
          <div className={`flex flex-col gap-3 ${SHEET_PANEL}`}>
            <SheetBlock title={`รายละเอียด${words.record}`}>
              <ClientRow clientId={booking.clientId} name={name} />
              <SheetRow label="Full Name (TH)" value={maskName(profile.nameTh, isPrivate)} />
              <SheetRow label="Account No" value={profile.accountNo} />
              <SheetRow label="IC Name" value={booking.createdBy} />
              <SheetRow label={words.placedAt} value={formatLogTime(booking.createdAt)} />
              {submission && <CopyRow label="เลขที่คำสั่งซื้อ" value={submission.backendRef} />}
              {/* The three statuses the table's last three columns carry, in
                  the same order and the same `large` tags. Deal Status is back
                  here now that the heading above names the *step* — "ตรวจสอบ"
                  does not say whether the basket is still filling, and this
                  row does. They run on from the rows above rather than being
                  ruled off from them: all of it describes one booking, and the
                  line implied a change of subject that never happened. */}
              <SheetRow label="Deal Status">
                <Tag text={deal.text} variant={deal.variant} size="large" />
              </SheetRow>
              <SheetRow label="Payment Status">
                <Tag text={payment.text} variant={payment.variant} size="large" />
              </SheetRow>
              <SheetRow label="Email Pre-Confirmation">
                <Tag text={email.text} variant={email.variant} size="large" />
              </SheetRow>
            </SheetBlock>

            {/* Proof of the client's instruction, above the checks because it
                answers the earlier question: the checks say the client was
                allowed to buy, this says they asked to. Every desk asks for it —
                see `evidenceRequired`. */}
            {booking.evidence && (
              <>
                <div className={SHEET_DASHED} />
                <SheetBlock title="หลักฐานการรับคำสั่ง">
                  <SheetRow label="ช่องทาง">
                    <span className="inline-flex items-center gap-1.5 text-body-sm font-bold text-foreground">
                      {(() => {
                        const Icon = EVIDENCE_CHANNEL[booking.evidence.channel].icon;
                        return <Icon size={15} weight="fill" className="shrink-0 text-muted-foreground" />;
                      })()}
                      {EVIDENCE_CHANNEL[booking.evidence.channel].label}
                    </span>
                  </SheetRow>
                  {booking.evidence.source === "call-log" && booking.evidence.callLog ? (
                    <>
                      <SheetRow
                        label="สายจาก Call Log"
                        value={`${booking.evidence.callLog.date} ${booking.evidence.callLog.time}`}
                      />
                      <SheetRow
                        label="ประเภทสาย"
                        value={`${CALL_DIRECTION_LABEL[booking.evidence.callLog.direction]} · ${booking.evidence.callLog.duration}`}
                      />
                      <SheetRow label="สรุปการสนทนา">
                        <span className="text-right text-body-sm font-bold text-foreground">
                          {booking.evidence.callLog.summary}
                        </span>
                      </SheetRow>
                    </>
                  ) : (
                    <>
                      {/* The name wraps rather than truncates: a recording called
                          `call-110002-2026-11-03.m4a` is only useful whole. */}
                      <SheetRow label="ไฟล์">
                        <span className="text-right text-body-sm font-bold break-all text-foreground">
                          {booking.evidence.fileName}
                        </span>
                      </SheetRow>
                      {booking.evidence.fileSize != null && (
                        <SheetRow label="ขนาด" value={formatFileSize(booking.evidence.fileSize)} />
                      )}
                    </>
                  )}
                  {booking.evidence.note && (
                    <SheetRow label="หมายเหตุ">
                      <span className="text-right text-body-sm font-bold whitespace-pre-line text-foreground">
                        {booking.evidence.note}
                      </span>
                    </SheetRow>
                  )}
                  <SheetRow label="แนบเมื่อ" value={formatLogTime(booking.evidence.attachedAt)} />
                </SheetBlock>
              </>
            )}

            <div className={SHEET_DASHED} />

            {/* Folded away by default. The four checks are the one block here
                that is already answered — a booking cannot exist without them
                having passed — so the count in the header is the whole story
                nine times out of ten, and the rows are for the tenth. Open,
                they are the same one-row-each list as everything else on this
                panel. */}
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => setChecksOpen((open) => !open)}
                aria-expanded={checksOpen}
                className={`-mx-2 flex flex-wrap items-center gap-2 px-2 py-1 text-left ${SHEET_PRESSABLE}`}
              >
                <span className="text-body-sm font-bold text-foreground">{words.prereq}</span>
                <span className="text-meta text-muted-foreground">{words.asOf}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-meta tabular-nums ${
                    passed === checks.length
                      ? "bg-[var(--fill-green-100)] text-[var(--fill-green-600)]"
                      : "bg-[var(--fill-gray-200)] text-muted-foreground"
                  }`}
                >
                  {passed}/{checks.length}
                </span>
                {/* Pushed to the far edge, where a disclosure is looked for. */}
                <CaretDownIcon
                  size={16}
                  className={`ml-auto shrink-0 text-muted-foreground transition-transform ${
                    checksOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {checksOpen && checks.map((item) => <CheckRow key={item.key} item={item} />)}
            </div>
          </div>

          {/* Outside the grey panel and on a tint of its own: the figure the
              whole sheet is about, which as a plain line on white was walked
              past on the way to the buttons. The tint and the app's primary
              ink do the work — this is the only value on the sheet in that
              colour — so the size can stay at 20px, in step with the other
              figures rather than a size above them. A cancelled booking keeps
              the strike-through and goes grey: that amount is what it *would*
              have been. */}
          <div
            className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3 ${
              cancelled ? "bg-[var(--fill-gray-100)]" : "bg-[var(--fill-p1-100)]"
            }`}
          >
            <p className="text-body-sm font-bold text-foreground">Notional Amount</p>
            <p
              className={`text-title-lg leading-[32px] font-bold tabular-nums ${
                cancelled ? "text-muted-foreground line-through" : "text-primary-action"
              }`}
            >
              {formatOrderAmount(booking.amount, book.currency)}
            </p>
          </div>

          {/* At the very end, centred — reached only after reading the record
              it would undo. No footer "ปิด": the header's ✕ closes it, and a
              second close button only sat next to this one.

              The only action on this sheet. There is nothing constructive left
              to offer: a basket is collected by the back office and a bond
              order was sent by the press that created it, so whatever happens
              next happens somewhere else. */}
          {cancellable && (
            <div className="flex flex-col items-center gap-1 pt-2">
              <Button
                variant={cancelling ? "disabled" : "plain"}
                size="md"
                disabled={cancelling}
                onClick={cancel}
                className="text-[var(--fill-red-600)]"
              >
                {cancelling ? "กำลังยกเลิก…" : words.cancel}
              </Button>
              {/* Why this one can be pulled when the next one along cannot.
                  Both read "กำลังดำเนินการรับคำสั่งซื้อ" — the difference is
                  whether the back office has taken it up (`OrderSubmissionStatus`
                  `"sent"` vs `"processing"`), which is not a distinction worth a
                  status of its own but is worth a line next to the button that
                  depends on it. */}
              {book.mode === "quota" && (
                <p className="type-caption text-center text-muted-foreground">
                  ยกเลิกได้จนกว่าระบบหลังบ้านจะรับคำสั่งซื้อไปดำเนินการ
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
