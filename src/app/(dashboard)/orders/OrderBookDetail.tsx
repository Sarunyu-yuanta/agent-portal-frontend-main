"use client";

/**
 * One product's book: who has been booked into it, what has been sent
 * downstream, and everything that has happened to it.
 *
 * The page is built around a single rule — **an order cannot be sent until the
 * book is full**. That is why the summary leads with the shortfall rather than
 * the total, why the submit button carries it in its own label when disabled,
 * and why "จองเพิ่ม" is the primary action right up until the moment it stops
 * being the thing standing in the way.
 *
 * ## Layout
 *
 * Two columns from `lg`, 80/20: the lists on the left, the summary pinned on
 * the right. The booking list is the same eleven-column table as the product
 * page's Order tab (`ProductOrderSection`), so it gets most of the width; the
 * summary is what every decision is made against, so it stays in view while
 * the list scrolls. Below `lg` the summary comes first.
 */

import { useCallback, useState } from "react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  HourglassMediumIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import {
  Button,
  LinearProgress,
  Tag,
  Toaster,
  type ToastStatus,
} from "@sarunyu/system-one";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { usePrivacy } from "@/contexts/privacy-context";
import { useOrders } from "@/contexts/orders-context";
import { usePopover } from "@/hooks/use-popover";
import { useSectionBack } from "@/hooks/use-section-back";
import { useToasts } from "@/hooks/use-toasts";
import { maskName } from "@/lib/mask-name";
import type { Booking, OrderBook } from "@/types/domain";
import type { BookableProduct } from "./bookable-products";
import {
  BOOK_STATUS_LABEL_TH,
  BOOK_STATUS_VARIANT,
  creditOf,
  SUBMISSION_TAG,
  formatLogTime,
  formatOrderAmount,
  headlineRound,
  isBookClosed,
  isBookingOpen,
} from "./order-book";
import { OrderBookingModal } from "./OrderBookingModal";
import { ProductLogos } from "./ProductLogos";
import { ProductOrderSection } from "./ProductOrderSection";
import { ProductTermsModal } from "./ProductTermsModal";

export function OrderBookDetail({
  book,
  product,
}: {
  book: OrderBook;
  product: BookableProduct;
}) {
  const back = useSectionBack(() => "/orders");
  const { submitOrder } = useOrders();
  const { toasts, addToast, removeToast } = useToasts();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  // The booking just placed here, marked in the table — see `ProductOrderSection`.
  const [newBookingId, setNewBookingId] = useState<string | null>(null);
  const clearNewBooking = useCallback(() => setNewBookingId(null), []);

  const notice = (message: string, status: ToastStatus) => addToast({ message, status });

  // What the figures describe — the bookings collected so far, or, once sent,
  // the order they went out as. See `headlineRound`.
  const round = headlineRound(book);
  const shortfall = Math.max(0, book.targetAmount - book.bookedAmount);
  const hasOpen = book.openBookings.length > 0;
  // Full *and* every booking funded — see `OrderBookStatus`.
  const canSubmit = book.status === "ready";
  const unfunded = book.openBookings.filter((b) => creditOf(b) === "insufficient").length;
  // A product is booked once: nothing more after the order is sent, and closed
  // for good once the back office answers — see `isBookingOpen`/`isBookClosed`.
  const canBook = isBookingOpen(book);
  const closed = isBookClosed(book);
  const order = book.submissions[0];

  const send = async () => {
    setSending(true);
    const submission = await submitOrder(
      book.productId,
      book.openBookings.map((b) => b.id),
    );
    setSending(false);
    setConfirmOpen(false);
    addToast({
      message: `ส่งคำสั่งซื้อแล้ว (${submission.backendRef}) — จะแจ้งเตือนเมื่อระบบหลังบ้านดำเนินการเสร็จ`,
      status: "success",
    });
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="plain"
          size="icon-sm"
          // Back to the list *as it was* — step chip and layout. A hardcoded
          // "/orders" dropped an IC who opened a book from a filtered step back
          // onto "All". Same trail the breadcrumb is built from.
          onClick={back}
          aria-label="กลับไป Order Management"
          className="shrink-0"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        {/* Beside the title rather than above it: the header is one line on a
            phone, and the strip is how the deal is recognised in the catalogue
            and on the list this page was opened from. */}
        <ProductLogos logos={book.logos} className="hidden sm:flex" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="type-h6 truncate font-bold text-foreground">{book.productName}</h1>
          {/* Which desk, and a way back to the product the deal is written on —
              a book is a view of someone else's instrument, and the terms
              (coupon, KO, KI) live on the catalogue page, not here. */}
          <p className="type-caption truncate text-muted-foreground">
            {book.desk} · {book.productType} ·{" "}
            {/* A modal, not a link away: the terms are a glance, and leaving
                would lose the book the IC is working on. */}
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="cursor-pointer text-[#0a6ee7] transition-colors hover:underline"
            >
              ดูรายละเอียดสินค้า
            </button>
          </p>
        </div>
        <Tag
          text={BOOK_STATUS_LABEL_TH[book.status]}
          variant={BOOK_STATUS_VARIANT[book.status]}
          size="large"
        />
      </div>

      {/* 80/20: the booking table is eleven columns wide and gets the room; the
          summary is a narrow column on the right, pinned while the list
          scrolls. No `grid-cols-1`: the library's unlayered stylesheet carries
          that class too and would beat the `lg:` template. A grid with no
          template is one column already — and below `lg` the summary comes
          first, because it is the answer to "where is this deal". */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(280px,1fr)]">
        {/* ── Summary: how full, and what that unlocks ── */}
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-4 lg:order-2">
          <div className="flex flex-col gap-1">
            <span className="type-caption text-muted-foreground">
              {round.previousRef ? `ส่งแล้ว (${round.previousRef})` : "ยังไม่ส่งคำสั่งซื้อ"}
            </span>
            <p className="type-h5 font-bold tabular-nums text-foreground">
              {formatOrderAmount(round.amount, book.currency)}
            </p>
          </div>
          {/* The bar's own numbers sit on it — booked over target, and the
              percentage — so it can be read without the headline above. */}
          <div className="flex flex-col gap-1.5">
            <LinearProgress value={round.pct} />
            <div className="type-caption flex items-baseline justify-between gap-2 tabular-nums text-muted-foreground">
              <span>
                {/* Primary once the target is met — the same rule the
                    product page's "Request / Notional Size" follows. */}
                <span
                  className={`font-semibold ${
                    round.amount >= book.targetAmount ? "text-[#0a6ee7]" : "text-foreground"
                  }`}
                >
                  {round.amount.toLocaleString("en-US")}
                </span>{" "}
                / {book.targetAmount.toLocaleString("en-US")} {book.currency}
              </span>
              <span>{Math.round(round.pct)}%</span>
            </div>
          </div>

          {/* The one sentence the page exists to answer, in the colour of
              whether the IC can act on it yet. */}
          {!round.previousRef && book.status === "collecting" && (
            <div className="flex items-baseline justify-between gap-2 rounded-lg bg-[var(--fill-yellow-100)] px-3 py-2.5">
              <span className="type-body-2 text-[var(--fill-yellow-700)]">ยังขาดอีก</span>
              <span className="type-body-2 !font-bold tabular-nums text-[var(--fill-yellow-700)]">
                {formatOrderAmount(shortfall, book.currency)}
              </span>
            </div>
          )}
          {book.status === "checking" && (
            <div className="flex items-start gap-2 rounded-lg bg-[var(--fill-yellow-100)] px-3 py-2.5">
              <HourglassMediumIcon size={18} weight="fill" className="mt-0.5 shrink-0 text-[var(--fill-yellow-700)]" />
              <span className="type-body-2 text-[var(--fill-yellow-700)]">
                {unfunded > 0
                  ? `ครบยอดแล้ว แต่วงเงินไม่เพียงพอ ${unfunded} ราย — ยกเลิกรายการนั้นแล้วจองให้ลูกค้ารายอื่นแทน`
                  : "ครบยอดแล้ว รอตรวจสอบวงเงินของลูกค้าทุกราย"}
              </span>
            </div>
          )}
          {canSubmit && (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--fill-green-100)] px-3 py-2.5">
              <CheckCircleIcon size={18} weight="fill" className="shrink-0 text-[var(--fill-green-600)]" />
              <span className="type-body-2 text-[var(--fill-green-700)]">
                ครบยอดและมีวงเงินเพียงพอ พร้อมส่งคำสั่งซื้อ
              </span>
            </div>
          )}

          {/* No `overflow-hidden`: the holders row hangs a popover out of this
              panel, and clipping it to the panel's rounded corners cut the
              names off. The rows carry no background of their own, so there is
              nothing left for it to clip. */}
          <dl className="flex flex-col divide-y divide-border rounded-xl bg-[#f3f4f6]">
            <HoldersFigure bookings={round.bookings} currency={book.currency} />
            <Figure label="ขั้นต่ำต่อราย" value={formatOrderAmount(book.minTicket, book.currency)} />
          </dl>

          {/* The one order, once sent — what the "คำสั่งซื้อ" tab used to list. */}
          {order && (
            <dl className="flex flex-col divide-y divide-border rounded-xl bg-[#f3f4f6]">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="type-body-2 text-muted-foreground">คำสั่งซื้อ</dt>
                <dd>
                  <Tag
                    text={SUBMISSION_TAG[order.status].text}
                    variant={SUBMISSION_TAG[order.status].variant}
                    size="small"
                  />
                </dd>
              </div>
              <Figure label="เลขที่" value={order.backendRef} />
              <Figure label="ส่งเมื่อ" value={formatLogTime(order.submittedAt)} />
              <Figure
                label="ตอบกลับเมื่อ"
                value={order.settledAt ? formatLogTime(order.settledAt) : "รอผลจากระบบหลังบ้าน"}
              />
            </dl>
          )}
          {closed && (
            <p className="type-caption text-muted-foreground">
              ส่งคำสั่งซื้อแล้ว — สินค้านี้ปิดรับจองและนำออกจาก Product Catalog แล้ว
            </p>
          )}

          {canBook && (
            <div className="flex flex-col gap-2">
              <Button
                variant={canSubmit ? "primary" : "disabled"}
                size="lg"
                disabled={!canSubmit || sending}
                onClick={() => setConfirmOpen(true)}
                leftIcon={<PaperPlaneTiltIcon size={18} />}
                className="w-full"
              >
                {/* The disabled label says what is missing rather than repeating
                    the action — the shortfall is the only version of "you can't"
                    the IC can act on. */}
                {canSubmit
                  ? "ส่งคำสั่งซื้อ"
                  : book.status === "checking"
                    ? "รอตรวจสอบวงเงิน"
                    : !hasOpen
                      ? "ยังไม่มีรายการจอง"
                      : shortfall > 0
                        ? `ยังขาด ${formatOrderAmount(shortfall, book.currency)}`
                        : "ส่งคำสั่งซื้อ"}
              </Button>
              <Button
                variant={canSubmit ? "outline" : "primary"}
                size="lg"
                onClick={() => setBookingOpen(true)}
                leftIcon={<PlusIcon size={18} />}
                className="w-full"
              >
                จองเพิ่มให้ลูกค้า
              </Button>
            </div>
          )}
        </section>

        {/* ── Bookings ──
            One list, no tabs: a product is booked once and sent as one order,
            so the order is a few lines in the summary rather than a list of its
            own. The same table as the product page's Order tab — one booking
            list, one set of columns, wherever it is read. */}
        <div className="flex min-w-0 flex-col gap-3 lg:order-1">
          <ProductOrderSection
            variant="book"
            product={product}
            onBook={() => setBookingOpen(true)}
            onNotice={notice}
            newBookingId={newBookingId}
            onNewBookingSeen={clearNewBooking}
          />
        </div>
      </div>

      <ProductTermsModal product={product} open={termsOpen} onClose={() => setTermsOpen(false)} />

      <OrderBookingModal
        open={bookingOpen}
        product={product}
        onClose={() => setBookingOpen(false)}
        onNotice={notice}
        // The new row is marked in the table, the same as the product page does.
        onBooked={(booking) => setNewBookingId(booking.id)}
      />

      <ResponsiveBottomSheetModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="ยืนยันส่งคำสั่งซื้อ"
        titleId="order-submit-title"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-3">
          <p className="type-body-2 leading-5 text-muted-foreground">
            ส่งการจองทั้งหมด {book.openBookings.length} รายการของ {book.productName}{" "}
            เข้าระบบหลังบ้านเป็นคำสั่งซื้อเดียว หลังส่งแล้วจะแก้ไขรายการจองเหล่านี้ไม่ได้
          </p>
          {/* Grey panel, divided inside — the same frame as the booking form's
              customer list, so a list of people reads the same everywhere. */}
          <ul className="flex max-h-[40dvh] min-h-0 flex-col divide-y divide-border overflow-y-auto rounded-xl bg-[#f3f4f6]">
            {book.openBookings.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                <span className="type-body-2 min-w-0 flex-1 truncate text-foreground">
                  {b.clientName}
                </span>
                <span className="type-body-2 !font-semibold shrink-0 text-foreground">
                  {formatOrderAmount(b.amount, book.currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between gap-2">
            <span className="type-body-2 text-muted-foreground">รวมทั้งสิ้น</span>
            <span className="type-subtitle-2 font-bold text-foreground">
              {formatOrderAmount(book.bookedAmount, book.currency)}
            </span>
          </div>
          <Button
            variant={sending ? "disabled" : "primary"}
            size="lg"
            disabled={sending}
            onClick={send}
            className="w-full"
          >
            {sending ? "กำลังส่ง…" : "ยืนยันส่งคำสั่งซื้อ"}
          </Button>
        </div>
      </ResponsiveBottomSheetModal>

      <Toaster items={toasts} onRemove={removeToast} />
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-3">
      <dt className="type-body-2 text-muted-foreground">{label}</dt>
      <dd className="type-body-2 !font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

/**
 * "ลูกค้าที่จอง · N ราย", with the names behind a hover.
 *
 * The count is the figure the summary needs; the names are the question it
 * raises, and they are already a click away in the booking list — so they
 * belong in a hover rather than in a row of their own, which would push the
 * send button below the fold on a laptop.
 *
 * Hover *and* click, via the project's own `usePopover`: a hover-only panel is
 * unreachable on a touch screen, and the hook's short close delay is what lets
 * the pointer travel from the row into the panel without it vanishing.
 *
 * Grouped by client, because one client can book the same product twice —
 * listing them as two rows would disagree with the "N ราย" the trigger shows.
 */
function HoldersFigure({
  bookings,
  currency,
}: {
  bookings: Booking[];
  currency: string;
}) {
  const { isPrivate } = usePrivacy();
  const { open, setOpen, ref, hoverProps } = usePopover();

  const holders = Array.from(
    bookings
      .reduce((byClient, b) => {
        const seen = byClient.get(b.clientId);
        byClient.set(b.clientId, {
          clientId: b.clientId,
          clientName: b.clientName,
          amount: (seen?.amount ?? 0) + b.amount,
        });
        return byClient;
      }, new Map<string, { clientId: string; clientName: string; amount: number }>())
      .values(),
  ).sort((a, b) => b.amount - a.amount);

  return (
    <div
      ref={ref}
      {...hoverProps}
      className="relative flex items-baseline justify-between gap-3 px-4 py-3"
    >
      <dt className="type-body-2 text-muted-foreground">ลูกค้าที่จอง</dt>
      <dd>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="type-body-2 cursor-pointer tabular-nums !font-semibold text-foreground underline decoration-dotted decoration-from-font underline-offset-4"
        >
          {holders.length} ราย
        </button>
      </dd>

      {open && holders.length > 0 && (
        // Anchored to this row's right edge: the summary column sits against
        // the viewport's, and a left-anchored panel ran off it.
        <div className="absolute right-4 top-full z-50 mt-1 w-[260px] overflow-hidden rounded-xl border border-border bg-white shadow-xl">
          <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            ลูกค้าที่จอง
          </p>
          <ul className="flex max-h-[220px] flex-col divide-y divide-border overflow-y-auto">
            {holders.map((h) => (
              <li key={h.clientId} className="flex items-baseline gap-2 px-4 py-2">
                <span className="type-caption min-w-0 flex-1 truncate text-foreground">
                  {h.clientId} - {maskName(h.clientName, isPrivate)}
                </span>
                <span className="type-caption shrink-0 !font-semibold tabular-nums text-foreground">
                  {formatOrderAmount(h.amount, currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Panels ───────────────────────────────────────────────────────────────────
