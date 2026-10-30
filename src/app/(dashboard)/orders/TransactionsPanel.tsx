"use client";

/**
 * Stock, TFEX or Mutual Fund — the clients' own trades in that asset, as they
 * came through each platform.
 *
 * Read-only. Nothing on these tabs is booked by the IC; they are here so an
 * IC tracking a client's orders sees the listed side next to the booked one.
 * Every filter lives in the URL (`replace`), like the booking tabs' steps.
 */

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ReceiptIcon } from "@phosphor-icons/react";
import {
  Chip,
  Dropdown,
  Pagination,
  SearchInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
} from "@sarunyu/system-one";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/fade-in";
import { TableRowsSkeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import { TRANSACTION_CHANNELS } from "@/lib/transaction-mock-data";
import type { ClientTransaction, TransactionAsset, TransactionSide } from "@/types/domain";
import { PAGE_SIZE_OPTIONS } from "../client/[id]/fixed-income-shared";
import { formatLogTime } from "./order-book";
import { TransactionDetailModal } from "./TransactionDetailModal";
import {
  PRICE_LABEL,
  QUANTITY_LABEL,
  SIDE_CLASS,
  SIDE_LABEL,
  STATUS_TAG,
  formatAmount,
  formatPrice,
  formatQuantity,
} from "./transaction-display";
import { useTransactions } from "./use-transactions";

const COLUMNS = 9;

export function TransactionsPanel({ asset }: { asset: TransactionAsset }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: rows, isLoading } = useTransactions(asset);
  const { isPrivate } = usePrivacy();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  // Which row's detail is open. Local, like the booking detail on a product's
  // own tab — the URL carries where the IC *is*, and a trade they opened to
  // read is not somewhere they navigated to.
  const [openId, setOpenId] = useState<string | null>(null);

  const sides: TransactionSide[] =
    asset === "mutual-fund" ? ["buy", "sell", "switch"] : ["buy", "sell"];
  const channels = TRANSACTION_CHANNELS[asset];

  const side = sides.find((s) => s === searchParams.get("side")) ?? null;
  const channel = channels.find((c) => c === searchParams.get("channel")) ?? null;

  const setParam = (key: string, value: string | null) => {
    setPage(1);
    setQueryState(withQuery(pathname, searchParams, { [key]: value }), "replace");
  };

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(
      (t: ClientTransaction) =>
        (!side || t.side === side) &&
        (!channel || t.channel === channel) &&
        (!query ||
          [t.symbol, t.name, t.clientId, maskName(t.clientName, isPrivate)].some((text) =>
            text.toLowerCase().includes(query),
          )),
    );
  }, [rows, side, channel, search, isPrivate]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = visible.slice((safePage - 1) * pageSize, safePage * pageSize);
  // Looked up in the unfiltered rows: a chip clicked behind the open modal
  // must not blank out the trade being read.
  const open = rows.find((t: ClientTransaction) => t.id === openId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Side chips on the left; search and channel on the right, the search
          at a fixed width — a query is a few characters, and a bar as wide as
          the page read as the page's main control. Stacked below `lg`. Widths
          sit on wrappers: the library's own `.w-full` outranks a Tailwind
          width set on the component. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollable-tabs flex min-w-0 items-center gap-2">
          <Chip
            label="ทั้งหมด"
            type="single"
            selected={side === null}
            onClick={() => setParam("side", null)}
          />
          {sides.map((s) => (
            <Chip
              key={s}
              label={SIDE_LABEL[s]}
              type="single"
              selected={side === s}
              onClick={() => setParam("side", s)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0">
          <div className="sm:w-[200px] sm:shrink-0">
            <Dropdown
              value={channel ?? "all"}
              onChange={(id) => setParam("channel", id === "all" ? null : id)}
              options={[
                { label: "ทุกช่องทาง", value: "all" },
                ...channels.map((c) => ({ label: c, value: c })),
              ]}
              placeholder="ช่องทาง"
              className="w-full"
            />
          </div>
          <div className="min-w-0 flex-1 lg:w-[280px] lg:flex-none">
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
        </div>
      </div>

      {!isLoading && visible.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon size={40} className="text-[var(--text-default-placeholder)]" />}
          title={search ? "ไม่พบรายการที่ค้นหา" : "ไม่มีรายการในเงื่อนไขนี้"}
          body="ลองเปลี่ยนตัวกรอง หรือค้นหาด้วยชื่อสินค้า รหัสลูกค้า หรือชื่อลูกค้า"
        />
      ) : (
        <FadeIn key={`${side}|${channel}`} className="flex flex-col gap-3">
          <div className="relative overflow-x-auto overflow-y-hidden table-scroll rounded-lg border border-[var(--border-default)]">
            <Table className="table-fixed min-w-[1100px]">
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="w-[13%] whitespace-nowrap">วันเวลา</TableHeaderCell>
                  <TableHeaderCell className="w-[14%] whitespace-nowrap">ลูกค้า</TableHeaderCell>
                  <TableHeaderCell className="w-[19%] whitespace-nowrap">สินค้า</TableHeaderCell>
                  <TableHeaderCell className="w-[7%] whitespace-nowrap">ประเภท</TableHeaderCell>
                  <TableHeaderCell className="w-[10%] whitespace-nowrap text-right">
                    {QUANTITY_LABEL[asset]}
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[8%] whitespace-nowrap text-right">
                    {PRICE_LABEL[asset]}
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[11%] whitespace-nowrap text-right">
                    มูลค่า
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[9%] whitespace-nowrap">ช่องทาง</TableHeaderCell>
                  <TableHeaderCell className="w-[9%] whitespace-nowrap">สถานะ</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRowsSkeleton columns={COLUMNS} />
                ) : (
                  paged.map((t) => (
                    // The whole row opens the trade — same as a booking row on
                    // a product's tab, and cheaper than a column of arrows in a
                    // table already scrolling sideways.
                    <TableRow
                      key={t.id}
                      hoverable
                      tabIndex={0}
                      aria-label={`ดูรายละเอียดรายการ ${t.symbol} ของ ${maskName(t.clientName, isPrivate)}`}
                      onClick={() => setOpenId(t.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setOpenId(t.id);
                        }
                      }}
                      className="cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a6ee7] active:bg-[var(--bg-default-pressed)]"
                    >
                      <TableCell>
                        <p className="type-caption whitespace-nowrap tabular-nums text-muted-foreground">
                          {formatLogTime(t.at)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className="type-body-2 truncate text-foreground">
                            {maskName(t.clientName, isPrivate)}
                          </p>
                          <p className="type-caption text-muted-foreground">{t.clientId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className="type-body-2 truncate !font-semibold text-foreground">
                            {t.symbol}
                          </p>
                          <p className="type-caption truncate text-muted-foreground">{t.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`type-body-2 !font-semibold ${SIDE_CLASS[t.side]}`}>
                          {SIDE_LABEL[t.side]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="type-body-2 tabular-nums text-foreground">
                          {formatQuantity(asset, t.quantity)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="type-body-2 tabular-nums text-foreground">
                          {formatPrice(asset, t.price)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="type-body-2 tabular-nums !font-semibold text-foreground">
                          {formatAmount(t.amount)}
                        </span>
                        <span className="type-caption ml-1 text-muted-foreground">{t.currency}</span>
                      </TableCell>
                      <TableCell>
                        <span className="type-caption text-foreground">{t.channel}</span>
                      </TableCell>
                      <TableCell>
                        <Tag
                          text={STATUS_TAG[t.status].text}
                          variant={STATUS_TAG[t.status].variant}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && (
            <div className="flex flex-wrap-reverse items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                <p className="text-[12px] text-muted-foreground whitespace-nowrap">Show per page</p>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="text-[12px] border border-border rounded-md px-2 py-1 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-action"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[12px] text-muted-foreground">
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

      {/* Rendered whether or not one is open, so the modal can animate out. */}
      <TransactionDetailModal transaction={open} onClose={() => setOpenId(null)} />
    </div>
  );
}
