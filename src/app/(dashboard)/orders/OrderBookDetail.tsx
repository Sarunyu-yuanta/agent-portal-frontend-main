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
 * the right. The booking list is the same wide table as the product page's
 * Order tab (`ProductOrderSection`), so it gets most of the width; the
 * summary is what every decision is made against, so it stays in view while
 * the list scrolls. Below `lg` the summary comes first.
 */

import { useCallback, useState } from "react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
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
import { useOrders } from "@/contexts/orders-context";
import { useSectionBack } from "@/hooks/use-section-back";
import { useToasts } from "@/hooks/use-toasts";
import type { Booking, OrderBook } from "@/types/domain";
import { ordersListHref, type BookableProduct } from "./bookable-products";
import {
  BOOK_AVAILABILITY_LABEL,
  BOOK_AVAILABILITY_VARIANT,
  bookAvailability,
  SUBMISSION_TAG,
  formatLogTime,
  formatOrderAmount,
  headlineRound,
  isBookClosed,
  isBookingOpen,
  quotaOrderCounts,
  quotaUsedPct,
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
  // With no trail behind it, back lands on the tab this desk is listed under.
  const back = useSectionBack(() => ordersListHref(book.productId));
  const { submitOrder } = useOrders();
  const { toasts, addToast, removeToast } = useToasts();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  // What the confirm sheet would send: a basket book's whole open round, or
  // one booking of a quota book. `null` while the sheet is closed.
  const [confirming, setConfirming] = useState<Booking[] | null>(null);
  const quota = book.mode === "quota";
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
  // Full — see `OrderBookStatus`. Nothing else gates sending: every booking
  // was funded to be placed.
  const canSubmit = book.status === "ready";
  // A product is booked once: nothing more after the order is sent, and closed
  // for good once the back office answers — see `isBookingOpen`/`isBookClosed`.
  const canBook = isBookingOpen(book);
  const closed = isBookClosed(book);
  const order = book.submissions[0];

  const send = async () => {
    setSending(true);
    const submission = await submitOrder(
      book.productId,
      (confirming ?? []).map((b) => b.id),
    );
    setSending(false);
    setConfirming(null);
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
          text={BOOK_AVAILABILITY_LABEL[bookAvailability(book)]}
          variant={BOOK_AVAILABILITY_VARIANT[bookAvailability(book)]}
          size="large"
        />
      </div>

      {/* 80/20: the booking table is ten columns wide and gets the room; the
          summary is a narrow column on the right, pinned while the list
          scrolls. No `grid-cols-1`: the library's unlayered stylesheet carries
          that class too and would beat the `lg:` template. A grid with no
          template is one column already — and below `lg` the summary comes
          first, because it is the answer to "where is this deal". */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(280px,1fr)]">
        {/* ── Summary: how full, and what that unlocks ── */}
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-4 lg:order-2">
          {quota ? (
            <QuotaSummary book={book} canBook={canBook} onBook={() => setBookingOpen(true)} />
          ) : (
            <>
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
              {canSubmit && (
                <div className="flex items-center gap-2 rounded-lg bg-[var(--fill-green-100)] px-3 py-2.5">
                  <CheckCircleIcon size={18} weight="fill" className="shrink-0 text-[var(--fill-green-600)]" />
                  <span className="type-body-2 text-[var(--fill-green-700)]">
                    ครบยอดแล้ว พร้อมส่งคำสั่งซื้อ
                  </span>
                </div>
              )}

              <dl className="flex flex-col divide-y divide-border rounded-xl bg-[#f3f4f6]">
                {/* The count only — who they are is the booking list on this very
                    page, so a panel repeating it earned nothing. Counted by client:
                    one client can book the same product twice. */}
                <Figure
                  label="ลูกค้าที่จอง"
                  value={`${new Set(round.bookings.map((b) => b.clientId)).size} ราย`}
                />
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
                    onClick={() => setConfirming(book.openBookings)}
                    leftIcon={<PaperPlaneTiltIcon size={18} />}
                    className="w-full"
                  >
                    {/* The disabled label says what is missing rather than repeating
                        the action — the shortfall is the only version of "you can't"
                        the IC can act on. */}
                    {canSubmit
                      ? "ส่งคำสั่งซื้อ"
                      : !hasOpen
                        ? "ยังไม่มีรายการจอง"
                        : `ยังขาด ${formatOrderAmount(shortfall, book.currency)}`}
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
            </>
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
            onSend={quota ? (b) => setConfirming([b]) : undefined}
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
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title="ยืนยันส่งคำสั่งซื้อ"
        titleId="order-submit-title"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-3">
          <p className="type-body-2 leading-5 text-muted-foreground">
            {quota
              ? `ส่งการจองนี้ของ ${book.productName} เข้าระบบหลังบ้านเป็นคำสั่งซื้อ หลังส่งแล้วจะแก้ไขรายการนี้ไม่ได้`
              : `ส่งการจองทั้งหมด ${book.openBookings.length} รายการของ ${book.productName} เข้าระบบหลังบ้านเป็นคำสั่งซื้อเดียว หลังส่งแล้วจะแก้ไขรายการจองเหล่านี้ไม่ได้`}
          </p>
          {/* Grey panel, divided inside — the same frame as the booking form's
              customer list, so a list of people reads the same everywhere. */}
          <ul className="flex max-h-[40dvh] min-h-0 flex-col divide-y divide-border overflow-y-auto rounded-xl bg-[#f3f4f6]">
            {(confirming ?? []).map((b) => (
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
              {formatOrderAmount(
                (confirming ?? []).reduce((sum, b) => sum + b.amount, 0),
                book.currency,
              )}
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
 * A quota book's summary: how much of the issue is gone, what is left, and
 * where its orders are. No "send" here — each booking is sent from its own
 * row in the list beside it.
 */
function QuotaSummary({
  book,
  canBook,
  onBook,
}: {
  book: OrderBook;
  canBook: boolean;
  onBook: () => void;
}) {
  const pct = quotaUsedPct(book);
  const counts = quotaOrderCounts(book);
  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="type-caption text-muted-foreground">ใช้โควตาแล้ว</span>
        <p className="type-h5 font-bold tabular-nums text-foreground">
          {formatOrderAmount(book.quotaUsed, book.currency)}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <LinearProgress value={pct} />
        <div className="type-caption flex items-baseline justify-between gap-2 tabular-nums text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">
              {book.quotaUsed.toLocaleString("en-US")}
            </span>{" "}
            / {book.targetAmount.toLocaleString("en-US")} {book.currency}
          </span>
          <span>{Math.round(pct)}%</span>
        </div>
      </div>

      {canBook ? (
        <div className="flex items-baseline justify-between gap-2 rounded-lg bg-[var(--fill-green-100)] px-3 py-2.5">
          <span className="type-body-2 text-[var(--fill-green-700)]">โควตาคงเหลือ</span>
          <span className="type-body-2 !font-bold tabular-nums text-[var(--fill-green-700)]">
            {formatOrderAmount(book.quotaRemaining, book.currency)}
          </span>
        </div>
      ) : (
        <p className="type-caption text-muted-foreground">
          ใช้โควตาครบแล้ว — สินค้านี้ปิดรับจองและนำออกจาก Product Catalog แล้ว
        </p>
      )}

      {counts.toSend > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-[var(--fill-green-100)] px-3 py-2.5">
          <PaperPlaneTiltIcon size={18} weight="fill" className="mt-0.5 shrink-0 text-[var(--fill-green-600)]" />
          <span className="type-body-2 text-[var(--fill-green-700)]">
            รอส่งคำสั่งซื้อ {counts.toSend} รายการ — กด &quot;ส่งคำสั่งซื้อ&quot; ที่รายการได้เลย
          </span>
        </div>
      )}

      <dl className="flex flex-col divide-y divide-border rounded-xl bg-[#f3f4f6]">
        <Figure label="ลูกค้าที่จอง" value={`${new Set(book.bookings.map((b) => b.clientId)).size} ราย`} />
        <Figure label="ขั้นต่ำต่อราย" value={formatOrderAmount(book.minTicket, book.currency)} />
        <Figure label="รอผลหลังบ้าน" value={`${counts.processing} รายการ`} />
        <Figure label="สำเร็จ" value={`${counts.completed} รายการ`} />
      </dl>

      {canBook && (
        <Button
          variant="primary"
          size="lg"
          onClick={onBook}
          leftIcon={<PlusIcon size={18} />}
          className="w-full"
        >
          จองเพิ่มให้ลูกค้า
        </Button>
      )}
    </>
  );
}

// ── Panels ───────────────────────────────────────────────────────────────────
