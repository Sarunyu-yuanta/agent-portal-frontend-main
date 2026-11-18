"use client";

/**
 * "ทั้งหมด" — every record from all seven tabs in one list, newest first.
 *
 * One table with the columns every asset shares, plus which asset it is; see
 * `all-orders` for how each kind becomes a row and how statuses are grouped.
 * A row opens the same receipt its own tab opens, so nothing a desk tab shows
 * is lost — it is one click further.
 *
 * Filters live in the URL (`replace`), like every other tab's.
 */

import { OrdersPanelSkeleton } from "./OrdersPanelSkeleton";
import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { FunnelSimpleIcon, ReceiptIcon } from "@phosphor-icons/react";
import {
  Button,
  Chip,
  Pagination,
  SearchInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
  Toaster,
  type ToastStatus,
} from "@sarunyu/system-one";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/fade-in";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { usePrivacy } from "@/contexts/privacy-context";
import { useOrders } from "@/contexts/orders-context";
import { getClientProfile } from "@/data/client-profiles";
import { useClients } from "@/hooks/use-api";
import { useToasts } from "@/hooks/use-toasts";
import { IC_NAME } from "@/lib/current-ic";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import type { TransactionSide } from "@/types/domain";
import { PAGE_SIZE_OPTIONS } from "../client/[id]/fixed-income-shared";
import {
  ALL_ASSETS,
  ALL_ASSET_LABEL,
  STATUS_BUCKET_LABEL,
  matchesStatus,
  statusChipsFor,
  buildAllRows,
  type AllRow,
} from "./all-orders";
import { findBookableProduct, type BookableProduct } from "./bookable-products";
import { BookingDetailModal } from "./BookingDetailModal";
import { checksAtBooking, dealStatus, emailStatus, paymentStatus } from "./booking-status";
import { CreateOrderButton } from "./CreateOrderButton";
import { FilterGroup } from "./FilterGroup";
import { formatLogTime, formatOrderAmount } from "./order-book";
import { ProposalChip, PROPOSAL_VARIANT } from "./ProposalChip";
import { ProposalDetailModal } from "./ProposalDetailModal";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { SIDE_LABEL } from "./transaction-display";
import { useOrderBooks, useRosterReadiness } from "./use-order-books";
import { useTransactions } from "./use-transactions";

const COLUMNS = 6;
const SIDES: TransactionSide[] = ["buy", "sell", "switch"];

const FALLBACK_PRODUCT = { id: "", tags: [], currency: "", minInvestment: "0" } as unknown as BookableProduct;

/**
 * @param clientId One client's records only — the client profile's Order tab
 *   (`ClientOrdersTab`), which mounts this panel as its "ทั้งหมด". Everything
 *   else is as on Order Management; "สร้าง Order" books for this client.
 */
export function AllOrdersPanel({ clientId }: { clientId?: string } = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isPrivate } = usePrivacy();
  const { proposals } = useOrders();
  const clients = useClients();
  const stock = useTransactions("stock");
  const tfex = useTransactions("tfex");
  const fund = useTransactions("mutual-fund");
  const { data: books, isLoading: booksLoading } = useOrderBooks();
  const isLoading = stock.isLoading || tfex.isLoading || fund.isLoading || booksLoading;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState<{ asset: string | null; side: string | null }>({
    asset: null,
    side: null,
  });
  /** The row whose receipt is open — local, like every tab's. */
  const [openedId, setOpenedId] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToasts();
  const notice = (message: string, status: ToastStatus) => addToast({ message, status });

  const asset = ALL_ASSETS.find((a) => a === searchParams.get("asset")) ?? null;
  // The chips follow the asset: its own tab's statuses, or the shared buckets
  // when every asset is showing. A status left over from another asset is
  // simply not one of these, and reads as "ทั้งหมด".
  const statusChips = statusChipsFor(asset);
  const status = statusChips.find((s) => s.id === searchParams.get("status"))?.id ?? null;
  const side = SIDES.find((s) => s === searchParams.get("side")) ?? null;

  const setParams = (next: Record<string, string | null>) => {
    setPage(1);
    setQueryState(withQuery(pathname, searchParams, next), "replace");
  };

  const rows = useMemo(
    () =>
      buildAllRows({
        trades: { stock: stock.data, tfex: tfex.data, "mutual-fund": fund.data },
        books,
        proposals,
        icName: IC_NAME,
      }),
    [stock.data, tfex.data, fund.data, books, proposals],
  );

  const query = search.trim().toLowerCase();
  const matches = (r: AllRow, c: { asset: string | null; side: string | null }) =>
    (!clientId || r.clientId === clientId) &&
    matchesStatus(r, asset, status) &&
    (!c.asset || r.asset === c.asset) &&
    // A side is a trade's alone: picking one leaves out bookings and offers.
    (!c.side || (r.kind === "trade" && r.trade.side === c.side)) &&
    (!query ||
      [r.title, r.subtitle, r.clientId, maskName(r.clientName, isPrivate)].some((text) =>
        text.toLowerCase().includes(query),
      ));

  const visible = rows.filter((r) => matches(r, { asset, side }));
  const previewed = rows.filter((r) => matches(r, draft)).length;
  const activeFilters = (asset ? 1 : 0) + (side ? 1 : 0);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = visible.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Looked up in every row, not the filtered ones — a filter changed behind an
  // open receipt must not blank it.
  const opened = rows.find((r) => r.id === openedId) ?? null;
  const bookingProduct =
    opened?.kind === "booking" ? findBookableProduct(opened.book.productId) : undefined;
  const offerProduct =
    opened?.kind === "offer" ? findBookableProduct(opened.book.productId) : undefined;
  const readiness = useRosterReadiness(clients, bookingProduct ?? FALLBACK_PRODUCT);

  if (isLoading) return <OrdersPanelSkeleton withCreate />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollable-tabs flex min-w-0 items-center gap-2">
          <Chip
            label="ทั้งหมด"
            type="single"
            selected={status === null}
            onClick={() => setParams({ status: null })}
          />
          {statusChips.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              type="single"
              selected={status === s.id}
              onClick={() => setParams({ status: s.id })}
            />
          ))}
        </div>

        <div className="flex items-stretch gap-2.5 lg:shrink-0">
          <Button
            variant="outline"
            size="lg"
            className="shrink-0"
            style={{ height: "auto" }}
            leftIcon={<FunnelSimpleIcon size={16} weight="bold" />}
            onClick={() => {
              setDraft({ asset, side });
              setFilterOpen(true);
            }}
          >
            ตัวกรอง
            {activeFilters > 0 && (
              <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary-action px-1 text-meta font-bold tabular-nums text-on-primary-action">
                {activeFilters}
              </span>
            )}
          </Button>
          <div className="min-w-0 flex-1 lg:w-[220px] lg:flex-none">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              onClear={() => setSearch("")}
              placeholder="ค้นหาสินค้า หรือลูกค้า"
              className="w-full"
            />
          </div>
          {/* No desk here — the button asks for the asset first. */}
          <CreateOrderButton clientId={clientId} />
        </div>
      </div>

      <ResponsiveDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title="ตัวกรอง"
        headerAction={{
          label: "ล้างทั้งหมด",
          onClick: () => setDraft({ asset: null, side: null }),
        }}
        closeOnBackdrop
        desktopContentClassName="w-[440px] max-w-full"
      >
        <div className="flex flex-col gap-4 pt-1">
          <FilterGroup
            label="สินทรัพย์"
            options={ALL_ASSETS.map((a) => ({ value: a, label: ALL_ASSET_LABEL[a] }))}
            value={draft.asset}
            onChange={(v) => setDraft((d) => ({ ...d, asset: v }))}
          />
          <FilterGroup
            label="ประเภท (เฉพาะ Stock / TFEX / Mutual Fund)"
            options={SIDES.map((s) => ({ value: s, label: SIDE_LABEL[s] }))}
            value={draft.side}
            onChange={(v) => setDraft((d) => ({ ...d, side: v }))}
          />
          <div className="mt-1 border-t border-border pt-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                setParams({ asset: draft.asset, side: draft.side });
                setFilterOpen(false);
              }}
            >
              ดูผลลัพธ์ ({previewed})
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

      {!isLoading && visible.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon size={40} className="text-[var(--text-default-placeholder)]" />}
          title={search ? "ไม่พบรายการที่ค้นหา" : "ไม่มีรายการในเงื่อนไขนี้"}
          body="ลองเปลี่ยนตัวกรอง หรือค้นหาด้วยชื่อสินค้า รหัสลูกค้า หรือชื่อลูกค้า"
        />
      ) : (
        <FadeIn key={`${status}|${asset}|${side}`} className="flex flex-col gap-3">
          <div className="relative overflow-x-auto overflow-y-hidden table-scroll rounded-lg border border-[var(--border-default)]">
            <Table className="table-fixed min-w-[960px]">
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="w-[15%] whitespace-nowrap">วันเวลา</TableHeaderCell>
                  <TableHeaderCell className="w-[19%] whitespace-nowrap">ลูกค้า</TableHeaderCell>
                  <TableHeaderCell className="w-[25%] whitespace-nowrap">สินค้า</TableHeaderCell>
                  <TableHeaderCell className="w-[14%] whitespace-nowrap">สินทรัพย์</TableHeaderCell>
                  <TableHeaderCell className="w-[13%] whitespace-nowrap text-right">มูลค่า</TableHeaderCell>
                  <TableHeaderCell className="w-[14%] whitespace-nowrap">สถานะ</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS}>
                      <span className="type-caption text-muted-foreground">กำลังโหลด…</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((r) => (
                    <Row
                      key={`${r.kind}:${r.id}`}
                      row={r}
                      isPrivate={isPrivate}
                      showClient
                      // A stock or fund Proposal has no receipt of its own.
                      onOpen={r.kind === "offered" ? undefined : () => setOpenedId(r.id)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && (
            <div className="flex flex-wrap-reverse items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                <p className="text-label text-muted-foreground whitespace-nowrap">Show per page</p>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="text-label border border-border rounded-md px-2 py-1 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-action"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-label text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">{(safePage - 1) * pageSize + 1}</span>
                  {" – "}
                  <span className="font-medium text-foreground">
                    {Math.min(safePage * pageSize, visible.length)}
                  </span>
                  {" of "}
                  <span className="font-medium text-foreground">{visible.length}</span> items
                </p>
                <Pagination totalPages={totalPages} currentPage={safePage} onPageChange={setPage} />
              </div>
            </div>
          )}
        </FadeIn>
      )}

      {/* Each kind opens the receipt its own tab opens. */}
      <TransactionDetailModal
        transaction={opened?.kind === "trade" ? opened.trade : null}
        onClose={() => setOpenedId(null)}
      />
      {opened?.kind === "booking" && bookingProduct && (
        <BookingDetailModal
          booking={opened.booking}
          book={opened.book}
          product={bookingProduct}
          checks={checksAtBooking(opened.booking, readiness.get(opened.booking.clientId)?.items ?? [])}
          deal={dealStatus(opened.booking, opened.book)}
          payment={paymentStatus(opened.booking, opened.book)}
          email={emailStatus(opened.booking, opened.book)}
          onClose={() => setOpenedId(null)}
          onNotice={notice}
        />
      )}
      {opened?.kind === "offer" && offerProduct && (
        <ProposalDetailModal
          proposal={opened.offer}
          book={opened.book}
          product={offerProduct}
          onClose={() => setOpenedId(null)}
        />
      )}
      <Toaster items={toasts} onRemove={removeToast} />
    </div>
  );
}

function Row({
  row,
  isPrivate,
  showClient,
  onOpen,
}: {
  row: AllRow;
  isPrivate: boolean;
  showClient: boolean;
  onOpen?: () => void;
}) {
  const name = maskName(row.clientName, isPrivate);
  const cancelled = row.bucket === "cancelled";
  return (
    <TableRow
      hoverable={Boolean(onOpen)}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={onOpen ? `ดูรายละเอียด ${row.title} ของ ${name}` : undefined}
      onClick={onOpen}
      onKeyDown={
        onOpen
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen();
              }
            }
          : undefined
      }
      className={
        onOpen
          ? "cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a6ee7] active:bg-[var(--bg-default-pressed)]"
          : undefined
      }
    >
      <TableCell>
        <p className="type-caption whitespace-nowrap tabular-nums text-muted-foreground">
          {formatLogTime(row.at)}
        </p>
      </TableCell>
      {showClient && (
        <TableCell>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="type-body-2 truncate !font-semibold text-foreground">{name}</p>
            <p className="type-caption truncate text-muted-foreground">
              {row.clientId} · บัญชี {getClientProfile(row.clientId).accountNo}
            </p>
          </div>
        </TableCell>
      )}
      <TableCell>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="type-body-2 truncate !font-semibold text-foreground">{row.title}</p>
          <p className="type-caption truncate text-muted-foreground">{row.subtitle}</p>
        </div>
      </TableCell>
      <TableCell>
        <span className="type-body-2 text-foreground">{ALL_ASSET_LABEL[row.asset]}</span>
      </TableCell>
      <TableCell className="text-right">
        {row.amount ? (
          <span
            className={`type-body-2 !font-semibold whitespace-nowrap tabular-nums ${
              cancelled ? "text-muted-foreground line-through" : "text-foreground"
            }`}
          >
            {formatOrderAmount(row.amount.value, row.amount.currency)}
          </span>
        ) : (
          <span className="type-body-2 text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {row.kind === "trade" || row.kind === "booking" ? (
          <Tag
            text={row.status.text}
            variant={row.status.variant as "green" | "yellow" | "blue" | "gray"}
            size="large"
          />
        ) : row.kind === "offer" ? (
          <ProposalChip size="lg" />
        ) : (
          <Tag text={STATUS_BUCKET_LABEL.proposed} variant={PROPOSAL_VARIANT} size="large" />
        )}
      </TableCell>
    </TableRow>
  );
}
