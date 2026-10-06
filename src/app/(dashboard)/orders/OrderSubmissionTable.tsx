"use client";

/**
 * The sent and finished tabs in table form — one row per order, the same unit
 * {@link OrderSubmissionCard} uses.
 *
 * Different columns from the book table on the first tab, because these are
 * different objects: an order has no target to fill and no progress to show.
 * What it has is a reference, a round, what it carried and what came back.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
} from "@sarunyu/system-one";
import { TableRowsSkeleton } from "@/components/ui/skeleton";
import { SUBMISSION_TAG, formatLogTime, formatOrderAmount, USD_THB } from "./order-book";
import type { OrderRow } from "./order-entries";

const COLUMNS = 6;

type SortKey = "ref" | "product" | "amount" | "holders" | "at" | "status";
type SortDir = "none" | "asc" | "desc";

const STATUS_RANK: Record<OrderRow["submission"]["status"], number> = {
  processing: 0,
  rejected: 1,
  completed: 2,
};

function sortValue(row: OrderRow, key: SortKey): number | string {
  switch (key) {
    case "ref":
      return row.submission.backendRef;
    case "product":
      return `${row.book.productName.toLowerCase()}-${row.round}`;
    case "amount":
      // Through THB, so two orders priced in different currencies compare as
      // money — same rule as the book table.
      return row.amount * (row.book.currency === "USD" ? USD_THB : 1);
    case "holders":
      return row.holders;
    case "at":
      return row.at;
    case "status":
      return STATUS_RANK[row.submission.status];
  }
}

export function OrderSubmissionTable({
  rows,
  isLoading,
}: {
  rows: OrderRow[];
  isLoading?: boolean;
}) {
  const router = useRouter();
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "at",
    dir: "none",
  });
  const dirFor = (key: SortKey): SortDir =>
    sort.key === key && sort.dir !== "none" ? sort.dir : "none";
  const onSort = (key: SortKey) => (next: SortDir) => setSort({ key, dir: next });

  const sorted = useMemo(() => {
    if (sort.dir === "none") return rows;
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      return sign * (av < bv ? -1 : av > bv ? 1 : 0);
    });
  }, [rows, sort]);

  return (
    <div className="relative overflow-x-auto overflow-y-hidden table-scroll rounded-lg border border-[var(--border-default)]">
      <Table className="table-fixed min-w-[940px]">
        <TableHead>
          <TableRow>
            <TableHeaderCell
              className="w-[20%] whitespace-nowrap"
              sortDirection={dirFor("ref")}
              onSortChange={onSort("ref")}
            >
              เลขที่คำสั่งซื้อ
            </TableHeaderCell>
            <TableHeaderCell
              className="w-[26%]"
              sortDirection={dirFor("product")}
              onSortChange={onSort("product")}
            >
              สินค้า
            </TableHeaderCell>
            <TableHeaderCell
              className="w-[16%] whitespace-nowrap"
              sortDirection={dirFor("amount")}
              onSortChange={onSort("amount")}
            >
              ยอดคำสั่งซื้อ
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
              sortDirection={dirFor("at")}
              onSortChange={onSort("at")}
            >
              วันที่
            </TableHeaderCell>
            <TableHeaderCell
              className="w-[12%] whitespace-nowrap"
              sortDirection={dirFor("status")}
              onSortChange={onSort("status")}
            >
              สถานะ
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRowsSkeleton columns={COLUMNS} />
          ) : (
            sorted.map((row) => {
              const { book, submission } = row;
              const tag = SUBMISSION_TAG[submission.status];
              const answered = submission.settledAt !== null;
              return (
                <TableRow
                  key={submission.id}
                  hoverable
                  className="cursor-pointer transition-colors active:bg-[var(--bg-default-pressed)]"
                  onClick={() =>
                    router.push(
                      `/orders/${encodeURIComponent(book.productId)}?view=orders`,
                    )
                  }
                >
                  <TableCell>
                    <p className="type-body-2 truncate !font-semibold text-foreground">
                      {submission.backendRef}
                    </p>
                  </TableCell>

                  <TableCell>
                    {/* No logo strip, same as the book table — see the note
                        there. */}
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="type-body-2 truncate text-foreground">
                        {book.productName}
                      </p>
                      <p className="type-caption truncate text-muted-foreground">
                        รอบที่ {row.round} · {book.desk} · {book.currency}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <p className="type-body-2 whitespace-nowrap !font-semibold tabular-nums text-foreground">
                      {formatOrderAmount(row.amount, book.currency)}
                    </p>
                  </TableCell>

                  <TableCell>
                    <p className="type-body-2 whitespace-nowrap tabular-nums text-foreground">
                      {row.holders} ราย
                    </p>
                  </TableCell>

                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="type-caption whitespace-nowrap text-muted-foreground">
                        {formatLogTime(row.at)}
                      </p>
                      <p className="type-caption whitespace-nowrap text-muted-foreground/70">
                        {answered ? "ตอบกลับ" : "ส่งคำสั่งซื้อ"}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Tag text={tag.text} variant={tag.variant} size="small" />
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
