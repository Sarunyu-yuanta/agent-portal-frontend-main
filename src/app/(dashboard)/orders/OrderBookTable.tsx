"use client";

/**
 * The same books as {@link OrderBookCard}, one per row.
 *
 * The card view is for scanning a handful of deals; this one is for comparing
 * them. Every column holds one of the card's lines, so nothing an IC relies on
 * disappears when they switch — the difference is that here the amounts, the
 * percentages and the statuses line up, which is what makes "which book is
 * furthest from its target" a glance instead of a read.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
} from "@sarunyu/system-one";
import { UsersThreeIcon } from "@phosphor-icons/react";
import { TableRowsSkeleton } from "@/components/ui/skeleton";
import type { OrderBook, OrderBookStatus } from "@/types/domain";
import {
  BOOK_STATUS_LABEL_TH,
  BOOK_STATUS_VARIANT,
  USD_THB,
  formatLogTime,
  headlineRound,
} from "./order-book";
import { AmountOfTarget } from "./AmountOfTarget";

const COLUMNS = 5;

type SortKey = "product" | "amount" | "holders" | "status" | "updated";
type SortDir = "none" | "asc" | "desc";

/**
 * Ascending order for the status column: the books waiting on the IC first.
 *
 * Alphabetical on the Thai label would be an order nobody wants — it puts
 * "ครบยอด รอส่งคำสั่งซื้อ", the one state that needs an action today, in the
 * middle of the list.
 */
const STATUS_RANK: Record<OrderBookStatus, number> = {
  ready: 0,
  checking: 1,
  collecting: 2,
  processing: 3,
  completed: 4,
  rejected: 5,
};

/**
 * The value each column sorts on.
 *
 * Amounts go through THB so a USD book and a THB one compare as money rather
 * than as digits — the column shows each in its own currency, which is only
 * honest if the ordering ignores the unit.
 */
function sortValue(book: OrderBook, key: SortKey): number | string {
  const round = headlineRound(book);
  switch (key) {
    case "product":
      return book.productName.toLowerCase();
    case "amount":
      return round.amount * (book.currency === "USD" ? USD_THB : 1);
    case "holders":
      return new Set(round.bookings.map((b) => b.clientId)).size;
    case "status":
      return STATUS_RANK[book.status];
    case "updated":
      return book.logs[0]?.at ?? "";
  }
}

export function OrderBookTable({
  books,
  isLoading,
}: {
  books: OrderBook[];
  isLoading?: boolean;
}) {
  const router = useRouter();

  // Local, like the Compliance table's — the page has no use for the sort, and
  // unsorted is the order the cards show, so there is nothing to restore on a
  // reload that the default does not already give.
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "product",
    dir: "none",
  });
  const dirFor = (key: SortKey): SortDir => (sort.key === key && sort.dir !== "none" ? sort.dir : "none");
  const onSort = (key: SortKey) => (next: SortDir) => setSort({ key, dir: next });

  const rows = useMemo(() => {
    if (sort.dir === "none") return books;
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...books].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      return sign * (av < bv ? -1 : av > bv ? 1 : 0);
    });
  }, [books, sort]);

  return (
    <div className="relative overflow-x-auto overflow-y-hidden table-scroll rounded-lg border border-[var(--border-default)]">
      <Table className="table-fixed min-w-[940px]">
        <TableHead>
          <TableRow>
            <TableHeaderCell
              className="w-[29%]"
              sortDirection={dirFor("product")}
              onSortChange={onSort("product")}
            >
              สินค้า
            </TableHeaderCell>
            <TableHeaderCell
              className="w-[30%] whitespace-nowrap"
              sortDirection={dirFor("amount")}
              onSortChange={onSort("amount")}
            >
              ยอดจอง
            </TableHeaderCell>
            <TableHeaderCell
              className="w-[10%] whitespace-nowrap"
              sortDirection={dirFor("holders")}
              onSortChange={onSort("holders")}
            >
              ลูกค้า
            </TableHeaderCell>
            <TableHeaderCell
              className="w-[16%] whitespace-nowrap"
              sortDirection={dirFor("status")}
              onSortChange={onSort("status")}
            >
              สถานะ
            </TableHeaderCell>
            <TableHeaderCell
              className="w-[15%] whitespace-nowrap"
              sortDirection={dirFor("updated")}
              onSortChange={onSort("updated")}
            >
              อัปเดตล่าสุด
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRowsSkeleton columns={COLUMNS} />
          ) : (
            rows.map((book) => {
              // Same three figures the card shows, from the same helper — see
              // `headlineRound` for which round they describe.
              const round = headlineRound(book);
              const holders = new Set(round.bookings.map((b) => b.clientId)).size;
              const latest = book.logs[0];
              const pending = book.pendingOrders.filter(
                (s) => s.backendRef !== round.previousRef,
              );

              return (
                <TableRow
                  key={book.productId}
                  hoverable
                  className="cursor-pointer transition-colors active:bg-[var(--bg-default-pressed)]"
                  onClick={() => router.push(`/orders/${encodeURIComponent(book.productId)}`)}
                >
                  <TableCell>
                    {/* No logo strip here, unlike the card: a row is scanned
                        down a column of names, and a 20px thumbnail per row
                        only pushed every name in by the same amount. */}
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="type-body-2 truncate !font-semibold text-foreground">
                        {book.productName}
                      </p>
                      <p className="type-caption truncate text-muted-foreground">
                        {book.desk} · {book.productType} · {book.currency}
                      </p>
                      {/* Same line the card carries — whether the amount in
                          the next column has gone out yet. */}
                      <p className="type-caption truncate text-muted-foreground">
                        {round.previousRef
                          ? `ส่งแล้ว (${round.previousRef})`
                          : "ยังไม่ส่งคำสั่งซื้อ"}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-1">
                      <AmountOfTarget
                        amount={round.amount}
                        target={book.targetAmount}
                        currency={book.currency}
                        pct={round.pct}
                      />
                      <LinearProgress value={round.pct} />
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="type-body-2 inline-flex items-center gap-1 whitespace-nowrap text-foreground">
                      <UsersThreeIcon
                        size={14}
                        weight="fill"
                        className="shrink-0 text-muted-foreground"
                      />
                      {holders} ราย
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex min-w-0 flex-col items-start gap-1">
                      <Tag
                        text={BOOK_STATUS_LABEL_TH[book.status]}
                        variant={BOOK_STATUS_VARIANT[book.status]}
                        size="small"
                      />
                      {/* The tag is the open round's. An order still with the
                          back office is a different round and gets its own
                          line rather than overwriting it. */}
                      {pending.length > 0 && (
                        <span className="type-caption truncate text-muted-foreground">
                          {pending[0].backendRef} รอผล
                          {pending.length > 1 && ` (+${pending.length - 1})`}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {/* When, and nothing else — the same line the card carries.
                        The log's own sentence used to lead here, which named
                        one client out of several and repeated an amount the
                        ยอดจอง column already holds. */}
                    <p className="type-caption whitespace-nowrap tabular-nums text-muted-foreground">
                      {latest ? formatLogTime(latest.at) : "—"}
                    </p>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
