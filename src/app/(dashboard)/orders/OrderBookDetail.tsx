"use client";

/**
 * One product's book: who has been booked into it, what has been sent
 * downstream, and everything that has happened to it.
 *
 * The page is built around a single rule — **an order cannot be sent until the
 * book is full**. That is why the target sits in the hero rather than in a
 * detail row, why the submit button carries the shortfall in its own label when
 * it is disabled, and why "จองเพิ่ม" is the primary action right up until the
 * moment it stops being the thing standing in the way.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ClockCounterClockwiseIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  ReceiptIcon,
  TrashIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import {
  Alert,
  Avatar,
  Button,
  LinearProgress,
  TabGroup,
  Tag,
  Toaster,
  type ToastStatus,
} from "@sarunyu/system-one";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { EmptyState } from "@/components/ui/empty-state";
import { usePrivacy } from "@/contexts/privacy-context";
import { useOrders } from "@/contexts/orders-context";
import { useToasts } from "@/hooks/use-toasts";
import { getInitial } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import type { OrderBook, OrderLogEntry, OrderSubmission } from "@/types/domain";
import { catalogHrefFor, type BookableProduct } from "./bookable-products";
import {
  BOOK_STATUS_LABEL_TH,
  BOOK_STATUS_VARIANT,
  formatLogTime,
  formatOrderAmount,
  headlineRound,
} from "./order-book";
import { OrderBookingModal } from "./OrderBookingModal";

type View = "bookings" | "orders" | "log";

const VIEWS: { id: View; title: string }[] = [
  { id: "bookings", title: "รายการจอง" },
  { id: "orders", title: "คำสั่งซื้อ" },
  { id: "log", title: "ประวัติ" },
];

export function OrderBookDetail({
  book,
  product,
}: {
  book: OrderBook;
  product: BookableProduct;
}) {
  const router = useRouter();
  const { submitOrder, cancelBooking } = useOrders();
  const { toasts, addToast, removeToast } = useToasts();
  const [view, setView] = useState<View>("bookings");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const notice = (message: string, status: ToastStatus) => addToast({ message, status });

  // Which round the hero figures describe — see `headlineRound`. A book whose
  // order has been sent has no open round to show until someone books into it
  // again, and an empty one under a "สำเร็จ" tag reads as a contradiction.
  const round = headlineRound(book);
  const shortfall = Math.max(0, book.targetAmount - book.bookedAmount);
  const holders = new Set(round.bookings.map((b) => b.clientId)).size;
  const hasOpen = book.openBookings.length > 0;
  const canSubmit = book.status === "ready";

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
          onClick={() => router.push("/orders")}
          aria-label="กลับไป Order Management"
          className="shrink-0"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="type-h6 truncate font-bold text-foreground">{book.productName}</h1>
          {/* Which desk, and a way back to the product the deal is written on —
              a book is a view of someone else's instrument, and the terms
              (coupon, KO, KI) live on the catalogue page, not here. */}
          <Link
            href={catalogHrefFor(product)}
            className="type-caption truncate text-muted-foreground transition-colors hover:text-[#0a6ee7]"
          >
            {book.desk} · {book.productType} · ดูรายละเอียดสินค้า
          </Link>
        </div>
        <Tag
          text={BOOK_STATUS_LABEL_TH[book.status]}
          variant={BOOK_STATUS_VARIANT[book.status]}
          size="large"
        />
      </div>

      {/* ── Hero: how full, and what that unlocks ── */}
      <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="type-h5 font-bold text-foreground">
              {formatOrderAmount(round.amount, book.currency)}
            </p>
            <p className="type-body-2 text-muted-foreground">
              เป้าหมาย {formatOrderAmount(book.targetAmount, book.currency)} ·{" "}
              {Math.round(round.pct)}%
            </p>
          </div>
          <LinearProgress value={round.pct} />
          {round.previousRef && (
            // Says which round the bar above belongs to. Without it the figures
            // describe the order that was sent while the buttons below describe
            // the next one, and nothing on the page admits they are different.
            <p className="type-caption text-muted-foreground">
              ยอดของคำสั่งซื้อล่าสุด ({round.previousRef}) · จองเพิ่มเพื่อเริ่มรอบใหม่
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
          <Figure label="ลูกค้าที่จอง" value={`${holders} ราย`} />
          <Figure
            label={round.previousRef ? "รอบใหม่" : "ยังขาดอีก"}
            value={
              round.previousRef
                ? "ยังไม่มีการจอง"
                : shortfall > 0
                  ? formatOrderAmount(shortfall, book.currency)
                  : "ครบแล้ว"
            }
          />
          <Figure
            label="ยืนยันแล้ว"
            value={formatOrderAmount(book.confirmedAmount, book.currency)}
          />
          <Figure label="ขั้นต่ำต่อราย" value={formatOrderAmount(book.minTicket, book.currency)} />
        </dl>

        {book.status === "processing" && (
          <Alert
            status="information"
            title="ส่งคำสั่งซื้อแล้ว"
            message={`อยู่ระหว่างดำเนินการที่ระบบหลังบ้าน (${book.submissions[0]?.backendRef ?? "—"}) — จะแจ้งเตือนเมื่อเสร็จ`}
            multiline
          />
        )}
        {book.status === "rejected" && (
          <Alert
            status="critical"
            title="คำสั่งซื้อถูกปฏิเสธ"
            message="ตรวจสอบรายละเอียดในแท็บคำสั่งซื้อ แล้วจองใหม่หากต้องการส่งอีกครั้ง"
            multiline
          />
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant={canSubmit ? "outline" : "primary"}
            size="lg"
            onClick={() => setBookingOpen(true)}
            leftIcon={<PlusIcon size={18} />}
            className="w-full sm:flex-1"
          >
            จองเพิ่มให้ลูกค้า
          </Button>
          <Button
            variant={canSubmit ? "primary" : "disabled"}
            size="lg"
            disabled={!canSubmit || sending}
            onClick={() => setConfirmOpen(true)}
            leftIcon={<PaperPlaneTiltIcon size={18} />}
            className="w-full sm:flex-1"
          >
            {/* The disabled label says what is missing rather than repeating the
                action. A greyed-out "ส่งคำสั่งซื้อ" tells the IC they can't;
                the shortfall tells them why, which is the only version they
                can act on. */}
            {canSubmit
              ? "ส่งคำสั่งซื้อ"
              : !hasOpen
                ? "ยังไม่มีรายการจองใหม่"
                : `ยังขาด ${formatOrderAmount(shortfall, book.currency)}`}
          </Button>
        </div>
      </section>

      <TabGroup
        items={VIEWS.map((v) => ({ id: v.id, title: v.title }))}
        activeId={view}
        onChange={(id) => setView(id as View)}
      />

      {view === "bookings" && (
        <BookingsPanel
          book={book}
          onCancel={async (id, name) => {
            await cancelBooking(id);
            addToast({ message: `ยกเลิกการจองของ ${name} แล้ว`, status: "information" });
          }}
          onBook={() => setBookingOpen(true)}
        />
      )}
      {view === "orders" && <SubmissionsPanel book={book} />}
      {view === "log" && <LogPanel logs={book.logs} />}

      <OrderBookingModal
        open={bookingOpen}
        product={product}
        onClose={() => setBookingOpen(false)}
        onNotice={notice}
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
          <ul className="flex max-h-[40dvh] min-h-0 flex-col divide-y divide-border overflow-y-auto rounded-md border border-border">
            {book.openBookings.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-3 py-2">
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
    <div className="flex flex-col gap-0.5 bg-card px-4 py-3">
      <dt className="type-caption font-bold text-muted-foreground">{label}</dt>
      <dd className="type-body-2 !font-semibold text-foreground">{value}</dd>
    </div>
  );
}

// ── Panels ───────────────────────────────────────────────────────────────────

function BookingsPanel({
  book,
  onCancel,
  onBook,
}: {
  book: OrderBook;
  onCancel: (bookingId: string, clientName: string) => Promise<void>;
  onBook: () => void;
}) {
  const { isPrivate } = usePrivacy();
  const sentIds = new Set(book.submissions.flatMap((s) => s.bookingIds));

  if (book.allBookings.length === 0) {
    return (
      <EmptyState
        icon={<UsersThreeIcon size={40} className="text-[var(--text-default-placeholder)]" />}
        title="ยังไม่มีการจอง"
        body="เริ่มจองให้ลูกค้ารายแรก — ยอดจะมารวมกันที่นี่จนกว่าจะครบเป้าหมาย"
        actionSlot={
          <Button variant="primary" size="md" onClick={onBook}>
            จองให้ลูกค้า
          </Button>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-[8px] border border-border bg-card shadow-sm">
      {book.allBookings.map((b) => {
        const name = maskName(b.clientName, isPrivate);
        const sent = sentIds.has(b.id);
        const cancelled = b.status === "cancelled";
        return (
          <li key={b.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar type="text" initials={getInitial(name)} size="m" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p
                className={`type-body-2 truncate font-semibold ${
                  cancelled ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {name}
              </p>
              <p className="type-caption truncate text-muted-foreground">
                {formatLogTime(b.createdAt)} · {b.createdBy}
              </p>
            </div>
            <span
              className={`type-body-2 !font-semibold shrink-0 ${
                cancelled ? "text-muted-foreground line-through" : "text-foreground"
              }`}
            >
              {formatOrderAmount(b.amount, book.currency)}
            </span>
            {/* Only a booking that is still on the open round can be pulled.
                Once it has gone downstream the portal is no longer the system
                of record for it, and a button here would promise a reversal it
                can't perform. */}
            {!cancelled && !sent ? (
              <Button
                variant="plain"
                size="icon-sm"
                aria-label={`ยกเลิกการจองของ ${name}`}
                onClick={() => onCancel(b.id, name)}
                className="shrink-0"
              >
                <TrashIcon size={18} className="text-[var(--fill-red-600)]" />
              </Button>
            ) : (
              <Tag
                text={cancelled ? "ยกเลิกแล้ว" : "ส่งแล้ว"}
                variant={cancelled ? "gray" : "blue"}
                size="small"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function SubmissionsPanel({ book }: { book: OrderBook }) {
  if (book.submissions.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptIcon size={40} className="text-[var(--text-default-placeholder)]" />}
        title="ยังไม่ได้ส่งคำสั่งซื้อ"
        body="เมื่อยอดจองรวมครบเป้าหมาย จะส่งการจองทั้งชุดเข้าระบบหลังบ้านเป็นคำสั่งซื้อเดียว"
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {book.submissions.map((s) => (
        <SubmissionRow key={s.id} submission={s} book={book} />
      ))}
    </ul>
  );
}

const SUBMISSION_TAG: Record<
  OrderSubmission["status"],
  { text: string; variant: "blue" | "green" | "red" }
> = {
  processing: { text: "กำลังดำเนินการ", variant: "blue" },
  completed: { text: "สำเร็จ", variant: "green" },
  rejected: { text: "ถูกปฏิเสธ", variant: "red" },
};

function SubmissionRow({
  submission,
  book,
}: {
  submission: OrderSubmission;
  book: OrderBook;
}) {
  const { isPrivate } = usePrivacy();
  const rows = book.allBookings.filter((b) => submission.bookingIds.includes(b.id));
  const total = rows.reduce((sum, b) => sum + b.amount, 0);
  const tag = SUBMISSION_TAG[submission.status];

  return (
    <li className="flex flex-col gap-3 rounded-[8px] border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="type-body-2 truncate font-bold text-foreground">
            {submission.backendRef}
          </p>
          <p className="type-caption truncate text-muted-foreground">
            ส่งเมื่อ {formatLogTime(submission.submittedAt)} · {submission.submittedBy}
          </p>
        </div>
        <Tag text={tag.text} variant={tag.variant} size="small" />
      </div>
      <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
        {rows.map((b) => (
          <li key={b.id} className="flex items-center gap-3 px-3 py-2">
            <span className="type-body-2 min-w-0 flex-1 truncate text-foreground">
              {maskName(b.clientName, isPrivate)}
            </span>
            <span className="type-body-2 !font-semibold shrink-0 text-foreground">
              {formatOrderAmount(b.amount, book.currency)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between gap-2">
        <span className="type-caption text-muted-foreground">
          {submission.settledAt
            ? `ตอบกลับเมื่อ ${formatLogTime(submission.settledAt)}`
            : "รอผลจากระบบหลังบ้าน"}
        </span>
        <span className="type-body-2 !font-semibold text-foreground">
          {formatOrderAmount(total, book.currency)}
        </span>
      </div>
    </li>
  );
}

const LOG_DOT: Record<OrderLogEntry["action"], string> = {
  "booking-created": "bg-[var(--fill-blue-500)]",
  "booking-cancelled": "bg-[var(--fill-gray-400)]",
  "requirement-sent": "bg-[var(--fill-yellow-500)]",
  "requirement-completed": "bg-[var(--fill-green-500)]",
  "order-submitted": "bg-[var(--fill-blue-600)]",
  "order-completed": "bg-[var(--fill-green-600)]",
  "order-rejected": "bg-[var(--fill-red-600)]",
};

/**
 * The book's history as a timeline, newest first.
 *
 * Every line is derived (see `buildLogs`), so this is a view of the same
 * bookings and submissions the other two tabs show rather than a second record
 * that could drift from them.
 */
function LogPanel({ logs }: { logs: OrderLogEntry[] }) {
  if (logs.length === 0) {
    return (
      <EmptyState
        icon={
          <ClockCounterClockwiseIcon size={40} className="text-[var(--text-default-placeholder)]" />
        }
        title="ยังไม่มีประวัติ"
        body="ทุกการจอง การส่งคำขอข้อมูล และคำสั่งซื้อของสินค้านี้จะถูกบันทึกไว้ที่นี่"
      />
    );
  }

  return (
    <ol className="flex flex-col overflow-hidden rounded-[8px] border border-border bg-card shadow-sm">
      {logs.map((entry, i) => (
        <li key={entry.id} className="flex gap-3 px-4 py-3">
          <div className="flex flex-col items-center gap-1 pt-1.5">
            <span className={`size-2 shrink-0 rounded-full ${LOG_DOT[entry.action]}`} />
            {/* The connector stops at the last row rather than trailing into
                nothing — a timeline that ends in a line reads as truncated. */}
            {i < logs.length - 1 && <span className="w-px flex-1 bg-border" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-1">
            <p className="type-body-2 leading-snug text-foreground">{entry.summary}</p>
            {entry.detail && (
              <p className="type-caption leading-snug text-muted-foreground">{entry.detail}</p>
            )}
            <p className="type-caption text-muted-foreground/70">
              {formatLogTime(entry.at)} · {entry.actor}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
