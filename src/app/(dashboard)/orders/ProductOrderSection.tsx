"use client";

/**
 * The "Order Management" tab of a product's page: everyone
 * booked into this deal, with the four checks each was booked against, and the
 * deal's totals underneath.
 *
 * It answers "what happened after I pressed จองซื้อ" without leaving the page
 * the booking was made from. Clicking a row opens that booking on its own
 * (`BookingDetailModal`); the full book — sending the order, the history —
 * stays on `/orders/[productId]`.
 */

import { useMemo, useState } from "react";
import {
  Button,
  Pagination,
  SearchInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
  type ToastStatus,
} from "@sarunyu/system-one";
import {
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { usePrivacy } from "@/contexts/privacy-context";
import { useClients } from "@/hooks/use-api";
import { getClientProfile } from "@/data/client-profiles";
import { IC_NAME } from "@/lib/current-ic";
import { maskName } from "@/lib/mask-name";
import type {
  RequirementItem,
  RequirementKey,
  RequirementStatus,
} from "@/types/domain";
import type { BookableProduct } from "./bookable-products";
import { useOrderBook, useRosterReadiness } from "./use-order-books";
import { roundNumberOf } from "./order-book";
import { BookingDetailModal } from "./BookingDetailModal";
import {
  CLOSED_TAG,
  checksAtBooking,
  dealStatus,
  emailStatus,
  paymentStatus,
} from "./booking-status";

const PAGE_SIZE = 10;


/**
 * Every cell's style, inline on purpose.
 *
 * The library gives each text cell `min-w-[284px]` (and the table `w-full`)
 * from an unlayered stylesheet, so eleven columns each took at least 284px and
 * a row read as scattered words. Neither utilities nor a scoped rule in
 * globals.css reliably beat it; an inline style always does.
 *
 * `width: 1%` with `nowrap` is the standard way to shrink an auto-layout column
 * to its content: the browser cannot go below the unwrapped text, so 1% means
 * "exactly as wide as this". Customer gets no width, so it takes what is left.
 * (Giving Customer `width: 100%` instead squeezed every other column to
 * nothing.)
 */
/** 12px a side instead of the library's 16 — keeps the one-line headers from spreading the row. */
const PAD = { paddingLeft: 12, paddingRight: 12 } as const;
const FIT = { ...PAD, minWidth: 0, width: "1%", whiteSpace: "nowrap" } as const;
const GROW = { ...PAD, minWidth: 0, whiteSpace: "nowrap" } as const;
/**
 * Every column after the name sits on its centre line — statuses, the amount
 * and its currency alike, so the right half of the row reads as one grid. Inline for the same reason as `FIT`: the library's
 * `text-left` on every header would beat a `text-center` class.
 */
const CENTER = { ...FIT, textAlign: "center" } as const;

/** The four checks, in the order the booking form shows them. */
const CHECK_COLUMNS: { key: RequirementKey; title: string }[] = [
  { key: "wealth", title: "Wealth Status" },
  { key: "acknowledge", title: "Acknowledge Status" },
  { key: "kyc", title: "KYC Status" },
  { key: "risk-profile", title: "Risk Profile Status" },
];

/** Same icon and colour per state as the booking form's status cards. */
const CHECK_ICON: Record<RequirementStatus, { icon: typeof CheckCircleIcon; fg: string }> = {
  passed: { icon: CheckCircleIcon, fg: "text-[var(--fill-green-600)]" },
  pending: { icon: ClockIcon, fg: "text-[var(--fill-yellow-600)]" },
  expired: { icon: WarningCircleIcon, fg: "text-[var(--fill-orange-600)]" },
  missing: { icon: XCircleIcon, fg: "text-[var(--fill-red-600)]" },
  failed: { icon: XCircleIcon, fg: "text-[var(--fill-red-600)]" },
};

export function ProductOrderSection({
  product,
  onBook,
  onNotice,
}: {
  product: BookableProduct;
  /** Opens the booking modal — the page owns it, and its toasts. */
  onBook: () => void;
  /** The page's toast stack — cancelling from the detail modal reports here. */
  onNotice: (message: string, status: ToastStatus) => void;
}) {
  const { data: book } = useOrderBook(product.id);
  const clients = useClients();
  const readiness = useRosterReadiness(clients, product);
  const { isPrivate } = usePrivacy();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // By id rather than the row itself, so a cancel from inside the modal shows
  // up in it straight away instead of in a stale copy.
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const all = [...(book?.allBookings ?? [])].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    const query = search.trim().toLowerCase();
    if (!query) return all;
    return all.filter(
      (b) =>
        maskName(b.clientName, isPrivate).toLowerCase().includes(query) ||
        maskName(getClientProfile(b.clientId).nameTh, isPrivate).includes(query) ||
        b.clientId.includes(query) ||
        getClientProfile(b.clientId).accountNo.includes(query),
    );
  }, [book, search, isPrivate]);

  if (!book) return null;

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // A search that shrinks the list can leave the page past its end.
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  // "IC" figures are this IC's own share of the deal; the others are the whole
  // deal, every IC's bookings together.
  const sentIds = new Set(
    book.submissions.filter((s) => s.status === "completed").flatMap((s) => s.bookingIds),
  );
  const mine = book.openBookings.filter((b) => b.createdBy === IC_NAME);
  const notionalIc = mine.reduce((sum, b) => sum + b.amount, 0);
  const confirmedIc = book.bookings
    .filter((b) => b.createdBy === IC_NAME && sentIds.has(b.id))
    .reduce((sum, b) => sum + b.amount, 0);

  const money = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const openRound = `รอบที่ ${book.submissions.length + 1}`;
  const isEmpty = rows.length === 0;
  const opened = book.allBookings.find((b) => b.id === openId) ?? null;

  return (
    // No card and no heading of its own — it is a tab inside the product's
    // card, and the tab already names it.
    <section className="flex w-full flex-col gap-4" aria-label="Order Management">
      <div className="flex items-center justify-end">
        <div className="flex w-full items-center gap-2 md:w-auto">
          <Button
            variant="primary"
            size="md"
            onClick={onBook}
            leftIcon={<PlusIcon size={16} />}
            className="shrink-0"
          >
            จองซื้อ
          </Button>
          <SearchInput
            value={search}
            onChange={(next) => {
              setSearch(next);
              setPage(1);
            }}
            onClear={() => setSearch("")}
            placeholder="ค้นหาชื่อ รหัสลูกค้า หรือ Account No"
            size="sm"
            className="min-w-0 flex-1 md:w-[400px] md:flex-none"
          />
        </div>
      </div>

      <div
        className={`relative overflow-hidden overflow-x-auto rounded-xl border border-[var(--border-default)] ${
          isEmpty ? "min-h-[160px]" : ""
        }`}
      >
        {/* Columns sized to their content, with the slack going to Customer —
            see `FIT` for why this is inline style rather than classes. */}
        <Table style={{ width: "100%" }}>
          <TableHead>
            <TableRow>
              <TableHeaderCell style={FIT} sortable={false}>Structured Note Name</TableHeaderCell>
              {/* A book is filled and sent more than once; the round says which
                  order a row went, or will go, out in. */}
              <TableHeaderCell style={CENTER} sortable={false}>Round</TableHeaderCell>
              <TableHeaderCell style={FIT} sortable={false}>IC Name</TableHeaderCell>
              <TableHeaderCell style={FIT} sortable={false}>Account No</TableHeaderCell>
              {/* Sticky at the left edge: the three columns before it scroll
                  away first, then the name holds, so a row still says whose
                  it is once the table is scrolled across to the statuses. */}
              <TableHeaderCell
                sortable={false}
                style={GROW}
                fixed="left"
                fixedOffset={0}
                fixedShadow="right"
              >
                Full Name (TH)
              </TableHeaderCell>
              {CHECK_COLUMNS.map((c) => (
                <TableHeaderCell style={CENTER} key={c.key} sortable={false}>
                  {c.title}
                </TableHeaderCell>
              ))}
              <TableHeaderCell style={CENTER} sortable={false}>
                Notional Amount
              </TableHeaderCell>
              <TableHeaderCell style={CENTER} sortable={false}>Currency</TableHeaderCell>
              <TableHeaderCell style={CENTER} sortable={false}>Deal Status</TableHeaderCell>
              <TableHeaderCell style={CENTER} sortable={false}>Payment Status</TableHeaderCell>
              <TableHeaderCell style={CENTER} sortable={false}>Email Pre-Confirmation</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((b) => {
              const status = dealStatus(b, book);
              const payment = paymentStatus(b, book);
              const email = emailStatus(b, book);
              const cancelled = b.status === "cancelled";
              const checks = checksAtBooking(b, readiness.get(b.clientId)?.items ?? []);
              const struck = cancelled ? "text-muted-foreground line-through" : "text-foreground";
              return (
                // The whole row opens this booking — a column of arrows only to
                // say "this is clickable" spent width the table did not have.
                <TableRow
                  key={b.id}
                  hoverable
                  tabIndex={0}
                  aria-label={`ดูรายละเอียดการจองของ ${maskName(b.clientName, isPrivate)}`}
                  onClick={() => setOpenId(b.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenId(b.id);
                    }
                  }}
                  className="cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a6ee7] active:bg-[var(--bg-default-pressed)]"
                >
                  <TableCell style={FIT}>
                    <span className="type-body-2 font-medium text-foreground">
                      {book.productName}
                    </span>
                  </TableCell>
                  <TableCell style={CENTER}>
                    <span className="type-body-2 tabular-nums text-foreground">
                      รอบที่ {roundNumberOf(book, b.id)}
                    </span>
                  </TableCell>
                  <TableCell style={FIT}>
                    <span className="type-body-2 text-foreground">{b.createdBy}</span>
                  </TableCell>
                  <TableCell style={FIT}>
                    <span className="type-body-2 tabular-nums text-foreground">
                      {getClientProfile(b.clientId).accountNo}
                    </span>
                  </TableCell>
                  <TableCell style={GROW} fixed="left" fixedOffset={0} fixedShadow="right">
                    <span className={`type-body-2 font-medium ${struck}`}>
                      {maskName(getClientProfile(b.clientId).nameTh, isPrivate)}
                    </span>
                  </TableCell>
                  {CHECK_COLUMNS.map((c) => (
                    <TableCell style={CENTER} key={c.key}>
                      <div className="flex justify-center">
                        <CheckMark item={checks.find((i) => i.key === c.key)} />
                      </div>
                    </TableCell>
                  ))}
                  <TableCell style={CENTER}>
                    <span className={`type-body-2 font-semibold tabular-nums ${struck}`}>
                      {money(b.amount)}
                    </span>
                  </TableCell>
                  <TableCell style={CENTER}>
                    <span className="type-body-2 text-foreground">{book.currency}</span>
                  </TableCell>
                  <TableCell style={CENTER}>
                    <div className="flex justify-center">
                      <Tag text={status.text} variant={status.variant} size="small" />
                    </div>
                  </TableCell>
                  <TableCell style={CENTER}>
                    <div className="flex justify-center">
                      <Tag text={payment.text} variant={payment.variant} size="small" />
                    </div>
                  </TableCell>
                  <TableCell style={CENTER}>
                    <div className="flex justify-center">
                      <Tag text={email.text} variant={email.variant} size="small" />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {isEmpty && (
          <div className="absolute inset-x-0 bottom-0 top-12 flex flex-col items-center justify-center gap-1 px-4 text-center">
            <p className="type-body-2 font-semibold text-foreground">
              {search ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีรายการจองซื้อ"}
            </p>
            {!search && (
              <p className="type-caption text-muted-foreground">
                กด &quot;จองซื้อ&quot; เพื่อจองให้ลูกค้ารายแรก — รายการจะแสดงที่นี่
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Notional is the round being filled; confirmed is every round the
            back office has accepted. Each card says which, because side by
            side they otherwise read as one round's two halves. */}
        <Total label="Total Notional IC" scope={openRound} value={money(notionalIc)} />
        <Total
          label="Total Confirmed IC"
          scope="ทุกรอบ"
          value={money(confirmedIc)}
          tone="green"
        />
        <Total
          label="Total Notional"
          scope={openRound}
          value={`${money(book.bookedAmount)} / ${money(book.targetAmount)}`}
        />
        <Total
          label="Total Confirmed"
          scope="ทุกรอบ"
          value={money(book.confirmedAmount)}
          tone="green"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="type-body-2 text-muted-foreground">Total {rows.length} Records</span>
        {totalPages > 1 && (
          <Pagination totalPages={totalPages} currentPage={current} onPageChange={setPage} />
        )}
      </div>

      {/* Rendered whether or not one is open, so the modal can animate out. */}
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
        onNotice={onNotice}
      />
    </section>
  );
}

/** One check in a table cell: the icon, or the rating where the row has one. */
function CheckMark({ item }: { item: RequirementItem | undefined }) {
  if (!item) return <span className="type-body-2 text-muted-foreground">—</span>;
  const { icon: Icon, fg } = CHECK_ICON[item.status];
  if (item.value) {
    return <span className={`type-body-2 whitespace-nowrap font-semibold ${fg}`}>{item.value}</span>;
  }
  return <Icon size={22} weight="fill" className={fg} aria-label={item.status} />;
}

function Total({
  label,
  scope,
  value,
  tone,
}: {
  label: string;
  /** Which rounds the figure covers — "รอบที่ 2" or "ทุกรอบ". */
  scope: string;
  value: string;
  tone?: "green";
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/10 px-4 py-3">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-xs uppercase leading-4 tracking-wide text-[#6a7282]">{label}</span>
        <span className="type-caption shrink-0 text-muted-foreground">{scope}</span>
      </span>
      <span
        className={`text-lg font-bold leading-6 tabular-nums ${
          tone === "green" ? "text-[var(--fill-green-600)]" : "text-[#101828]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
