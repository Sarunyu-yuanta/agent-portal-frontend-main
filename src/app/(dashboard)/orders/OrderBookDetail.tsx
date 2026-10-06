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
 * Two columns from `lg`: the lists on the left, the summary pinned on the
 * right. The summary is what every decision on this page is made against, so
 * it stays in view while the booking list scrolls — and a list capped at the
 * left column's width keeps a name and its amount within one glance, where a
 * full-width row on a wide screen put them a metre apart. Below `lg` the
 * summary comes first, because it is the answer to "where is this deal".
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  CaretRightIcon,
  CheckCircleIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  ReceiptIcon,
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
import { getClientProfile } from "@/data/client-profiles";
import { useClients } from "@/hooks/use-api";
import { usePopover } from "@/hooks/use-popover";
import { useSectionBack } from "@/hooks/use-section-back";
import { useToasts } from "@/hooks/use-toasts";
import { getInitial } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import type { Booking, OrderBook, OrderSubmission } from "@/types/domain";
import { catalogHrefFor, type BookableProduct } from "./bookable-products";
import {
  CLOSED_TAG,
  checksAtBooking,
  dealStatus,
  emailStatus,
  paymentStatus,
} from "./booking-status";
import { BookingDetailModal } from "./BookingDetailModal";
import {
  BOOK_STATUS_LABEL_TH,
  BOOK_STATUS_VARIANT,
  SUBMISSION_TAG,
  formatLogTime,
  bookRounds,
  formatOrderAmount,
  headlineRound,
  type BookRound,
} from "./order-book";
import { OrderBookingModal } from "./OrderBookingModal";
import { ProductLogos } from "./ProductLogos";
import { SubmissionDetailModal } from "./SubmissionDetailModal";
import { useRosterReadiness } from "./use-order-books";

/**
 * Two lists, because a book holds two kinds of thing: the bookings of the round
 * being filled, and the orders already sent.
 *
 * There used to be a third, "ประวัติ" — the book's log as a timeline. It was
 * dropped because every line in it was already on one of these two, in more
 * detail: a booking with its four checks, an order with its reference and
 * answer. The one thing it alone carried was the trail of requirement requests
 * sent to clients, which the header bell announces and the booking form shows
 * the current state of. `buildLogs` stays — the list pages still read the
 * newest entry as a book's "last activity".
 */
type View = "bookings" | "orders";

const VIEWS: View[] = ["bookings", "orders"];

/**
 * Which list is open, in the URL rather than in state.
 *
 * Same rule as every other tab in this app (see `lib/query-state`), and it is
 * what lets a row on the "คำสั่งซื้อรอผล" tab link straight to the order it
 * names instead of landing on the booking list and asking the reader to find
 * it. `replace`, because a sub-tab is a refinement — the back button should
 * leave the book, not step back through every tab looked at inside it.
 */
function useBookView(): [View, (next: View) => void] {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get("view") as View | null;
  const view = requested && VIEWS.includes(requested) ? requested : "bookings";
  return [
    view,
    (next) =>
      setQueryState(
        withQuery(pathname, searchParams, { view: next === "bookings" ? null : next }),
        "replace",
      ),
  ];
}

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
  const clients = useClients();
  const readiness = useRosterReadiness(clients, product);
  const [view, setView] = useBookView();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  // By id, so a cancel from inside the modal shows in it straight away.
  const [openId, setOpenId] = useState<string | null>(null);
  // The sent order opened from "รอบก่อนหน้า", by id for the same reason.
  const [openSubmissionId, setOpenSubmissionId] = useState<string | null>(null);

  const notice = (message: string, status: ToastStatus) => addToast({ message, status });

  // Which round the figures describe — see `headlineRound`. A book whose order
  // has been sent has no open round to show until someone books into it again,
  // and an empty one under a "สำเร็จ" tag reads as a contradiction.
  const round = headlineRound(book);
  const shortfall = Math.max(0, book.targetAmount - book.bookedAmount);
  const hasOpen = book.openBookings.length > 0;
  const canSubmit = book.status === "ready";
  const opened = book.allBookings.find((b) => b.id === openId) ?? null;
  // The tab counts the round in front of the IC, the same one the summary does.
  const liveBookings = book.openBookings.length;
  const rounds = bookRounds(book);
  // Every sent round, except one the summary is already showing.
  const pastRounds = rounds.filter(
    (r) => r.submission && r.submission.backendRef !== round.previousRef,
  );

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
          // Back to the list *as it was* — tab, product chip and layout. A book
          // is now reached from three different tabs, and a hardcoded "/orders"
          // dropped an IC who opened an order from "คำสั่งซื้อรอผล" back onto
          // the booking tab. Same trail the breadcrumb is built from.
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
            <Link
              href={catalogHrefFor(product)}
              className="text-[#0a6ee7] transition-colors hover:underline"
            >
              ดูรายละเอียดสินค้า
            </Link>
          </p>
        </div>
        <Tag
          text={BOOK_STATUS_LABEL_TH[book.status]}
          variant={BOOK_STATUS_VARIANT[book.status]}
          size="large"
        />
      </div>

      {/* No `grid-cols-1`: the library's unlayered stylesheet carries that class
          too and would beat the `lg:` template below, pinning the page to one
          column at every width. A grid with no template is one column already. */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── Summary: how full, and what that unlocks ── */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-4 lg:order-2">
        {/* The current round only. A book is filled and sent again and again,
            and every figure and button here acts on the round in front of the
            IC — mixing in a sent round's numbers made "ยืนยันแล้ว 100,000"
            sit over a round nobody had sent yet. Past rounds are listed
            underneath instead. */}
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="type-caption text-muted-foreground">
              รอบที่ {round.number} ·{" "}
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
          {round.previousRef && (
            <p className="type-caption text-muted-foreground">
              จองเพิ่มเพื่อเริ่มรอบใหม่ — ยอดด้านบนเป็นของคำสั่งซื้อที่ส่งไปแล้ว
            </p>
          )}

          {/* No `overflow-hidden`: the holders row hangs a popover out of this
              panel, and clipping it to the panel's rounded corners cut the
              names off. The rows carry no background of their own, so there is
              nothing left for it to clip. */}
          <dl className="flex flex-col divide-y divide-border rounded-xl bg-[#f3f4f6]">
            <HoldersFigure
              bookings={round.bookings}
              currency={book.currency}
              round={round.number}
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
                  the IC can act on. It is only ever shown when there *is* one:
                  while an in-flight order could mask a full open round, this
                  branch was reached with nothing missing and read
                  "ยังขาด 0 USD". */}
              {canSubmit
                ? "ส่งคำสั่งซื้อ"
                : !hasOpen
                  ? "ยังไม่มีรายการจองใหม่"
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
        </section>

        {pastRounds.length > 0 && (
          <PastRounds
            rounds={pastRounds}
            currency={book.currency}
            onOpen={setOpenSubmissionId}
          />
        )}
        </div>

        {/* ── Lists ── */}
        <div className="flex min-w-0 flex-col gap-3 lg:order-1">
          <div className="transparent-tabs count-tabs scrollable-tabs">
            <TabGroup
              items={[
                { id: "bookings", title: "รายการจอง", notification: liveBookings || undefined },
                {
                  id: "orders",
                  title: "คำสั่งซื้อ",
                  notification: book.submissions.length || undefined,
                },
              ]}
              activeId={view}
              onChange={(id) => setView(id as View)}
            />
          </div>

          {view === "bookings" && (
            <BookingsPanel
              book={book}
              onOpen={setOpenId}
              onBook={() => setBookingOpen(true)}
              onViewOrders={() => setView("orders")}
            />
          )}
          {view === "orders" && <SubmissionsPanel book={book} />}
        </div>
      </div>

      <BookingDetailModal
        booking={opened}
        book={book}
        product={product}
        checks={
          opened ? checksAtBooking(opened, readiness.get(opened.clientId)?.items ?? []) : []
        }
        deal={opened ? dealStatus(opened, book) : CLOSED_TAG}
        payment={opened ? paymentStatus(opened, book) : CLOSED_TAG}
        email={opened ? emailStatus(opened, book) : CLOSED_TAG}
        onClose={() => setOpenId(null)}
        onNotice={notice}
      />

      <OrderBookingModal
        open={bookingOpen}
        product={product}
        onClose={() => setBookingOpen(false)}
        onNotice={notice}
      />

      <SubmissionDetailModal
        submission={book.submissions.find((s) => s.id === openSubmissionId) ?? null}
        book={book}
        onClose={() => setOpenSubmissionId(null)}
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
 * Grouped by client, because one client can book twice into the same round —
 * listing them as two rows would disagree with the "N ราย" the trigger shows.
 */
function HoldersFigure({
  bookings,
  currency,
  round,
}: {
  bookings: Booking[];
  currency: string;
  /** Which round the list belongs to — the panel says so, the row cannot. */
  round: number;
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
            ลูกค้าในรอบที่ {round}
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

/**
 * The rounds already sent, newest first — so a book on round 2 still says it
 * has sent before, and how that went. Each opens that order on its own.
 */
function PastRounds({
  rounds,
  currency,
  onOpen,
}: {
  rounds: BookRound[];
  currency: string;
  onOpen: (submissionId: string) => void;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
      <span className="type-caption font-semibold text-muted-foreground">รอบก่อนหน้า</span>
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl bg-[#f3f4f6]">
        {rounds.map((r) => {
          const tag = SUBMISSION_TAG[r.submission!.status];
          return (
            <li key={r.number}>
              <button
                type="button"
                onClick={() => onOpen(r.submission!.id)}
                aria-label={`ดูรายละเอียดคำสั่งซื้อรอบที่ ${r.number}`}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--fill-gray-200)]"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-body-2 font-semibold text-foreground">
                    รอบที่ {r.number}
                  </span>
                  <span className="type-caption truncate text-muted-foreground">
                    {r.submission!.backendRef} · {formatOrderAmount(r.amount, currency)}
                  </span>
                </span>
                <Tag text={tag.text} variant={tag.variant} size="small" />
                <CaretRightIcon size={14} className="shrink-0 text-muted-foreground" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Panels ───────────────────────────────────────────────────────────────────

/**
 * The open round's bookings, newest first, each row opening that booking's
 * detail.
 *
 * Only the open round. A sent round's bookings can no longer be changed, and
 * they are already listed under their order in the "คำสั่งซื้อ" tab — here they
 * only made the round being filled harder to find. This keeps the list to the
 * same round the summary and the tab count describe.
 *
 * Cancelling moved into the detail modal. A bin icon on every row put an
 * irreversible action one stray click from a list people scan quickly; in the
 * modal it sits next to everything the IC should look at before using it.
 */
function BookingsPanel({
  book,
  onOpen,
  onBook,
  onViewOrders,
}: {
  book: OrderBook;
  onOpen: (bookingId: string) => void;
  onBook: () => void;
  onViewOrders: () => void;
}) {
  const current = bookRounds(book).find((r) => !r.submission);
  const sentCount = book.submissions.length;

  // Just sent, nothing booked since: say so, rather than an empty list that
  // reads as though the bookings were lost.
  if (!current && sentCount > 0) {
    return (
      <EmptyState
        icon={<ReceiptIcon size={40} className="text-[var(--text-default-placeholder)]" />}
        title={`รอบที่ ${sentCount} ส่งคำสั่งซื้อแล้ว`}
        body={`ยังไม่มีการจองรอบที่ ${sentCount + 1} — จองให้ลูกค้าเพื่อเริ่มรอบใหม่`}
        actionSlot={
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={onBook}
              leftIcon={<PlusIcon size={16} />}
            >
              จองเพิ่มให้ลูกค้า
            </Button>
            <Button variant="outline" size="md" onClick={onViewOrders}>
              ดูรายการของรอบที่ {sentCount}
            </Button>
          </div>
        }
      />
    );
  }

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

  // Reached only with bookings on file and none sent-and-closed, so the open
  // round exists; the guard is for the type checker.
  if (!current) return null;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 px-1">
        <span className="type-body-2 !font-semibold text-foreground">
          รอบที่ {current.number}
          <span className="type-caption ml-2 font-normal text-muted-foreground">
            ยังไม่ส่งคำสั่งซื้อ
          </span>
        </span>
        <span className="type-caption tabular-nums text-muted-foreground">
          {formatOrderAmount(current.amount, book.currency)}
        </span>
      </div>
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {[...current.bookings]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((b) => (
            <BookingRow key={b.id} booking={b} book={book} onOpen={() => onOpen(b.id)} />
          ))}
      </ul>
    </section>
  );
}

function BookingRow({
  booking,
  book,
  onOpen,
}: {
  booking: Booking;
  book: OrderBook;
  onOpen: () => void;
}) {
  const { isPrivate } = usePrivacy();
  const name = maskName(booking.clientName, isPrivate);
  const profile = getClientProfile(booking.clientId);
  const cancelled = booking.status === "cancelled";
  const status = dealStatus(booking, book);
  const struck = cancelled ? "text-muted-foreground line-through" : "text-foreground";

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`ดูรายละเอียดการจองของ ${name}`}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-default-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a6ee7]"
      >
        <Avatar type="text" initials={getInitial(name)} size="m" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className={`type-body-2 truncate font-semibold ${struck}`}>
            {booking.clientId} - {name}
          </p>
          <p className="type-caption truncate text-muted-foreground">
            {maskName(profile.nameTh, isPrivate)} · Account No {profile.accountNo}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`type-body-2 !font-semibold tabular-nums ${struck}`}>
            {formatOrderAmount(booking.amount, book.currency)}
          </span>
          <span className="type-caption text-muted-foreground">
            {formatLogTime(booking.createdAt)}
          </span>
        </div>
        <div className="hidden w-[120px] shrink-0 justify-center sm:flex">
          <Tag text={status.text} variant={status.variant} size="small" />
        </div>
        <CaretRightIcon size={16} className="shrink-0 text-muted-foreground" />
      </button>
    </li>
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
      {/* Same grey, divided panel as the submit confirmation's list. */}
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl bg-[#f3f4f6]">
        {rows.map((b) => (
          <li key={b.id} className="flex items-center gap-3 px-4 py-3">
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
