"use client";

/**
 * Quota books — Fixed Income or Global Bond — as a table.
 *
 * The counterpart of `OrderBookTable` for desks where every
 * booking is its own order. There is no round to fill, so what the IC reads
 * off a bond is different: how much of the issue quota is gone, and which of
 * its orders are waiting on them (cleared, not yet sent) or on someone else.
 */

import { useRouter } from "next/navigation";
import { HourglassMediumIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
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
import { TableRowsSkeleton } from "@/components/ui/skeleton";
import type { OrderBook } from "@/types/domain";
import {
  BOOK_AVAILABILITY_LABEL,
  BOOK_AVAILABILITY_VARIANT,
  bookAvailability,
  formatLogTime,
  quotaOrderCounts,
  quotaUsedPct,
} from "./order-book";
import { orderBookHref } from "./bookable-products";
import { AmountOfTarget } from "./AmountOfTarget";

/** The one line that tells the IC whether a bond is waiting on them. */
function OrderCountsLine({ book }: { book: OrderBook }) {
  const counts = quotaOrderCounts(book);
  if (counts.toSend === 0 && counts.processing === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {counts.toSend > 0 && (
        // Green, like a basket book's `ready`: the one state that asks the IC
        // to do something.
        <span className="type-caption inline-flex items-center gap-1 rounded-lg bg-[var(--fill-green-100)] px-2 py-1 text-[var(--fill-green-700)]">
          <PaperPlaneTiltIcon size={14} weight="fill" className="shrink-0" />
          รอส่งคำสั่งซื้อ {counts.toSend}
        </span>
      )}
      {counts.processing > 0 && (
        <span className="type-caption inline-flex items-center gap-1 rounded-lg bg-[var(--fill-blue-100)] px-2 py-1 text-[var(--fill-blue-700)]">
          <HourglassMediumIcon size={14} weight="fill" className="shrink-0" />
          รอผลหลังบ้าน {counts.processing}
        </span>
      )}
    </div>
  );
}

const COLUMNS = 5;

export function QuotaBookTable({
  books,
  isLoading,
}: {
  books: OrderBook[];
  isLoading?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="relative overflow-x-auto overflow-y-hidden table-scroll rounded-lg border border-[var(--border-default)]">
      <Table className="table-fixed min-w-[940px]">
        <TableHead>
          <TableRow>
            <TableHeaderCell className="w-[28%]">สินค้า</TableHeaderCell>
            <TableHeaderCell className="w-[28%] whitespace-nowrap">ใช้โควตา</TableHeaderCell>
            <TableHeaderCell className="w-[22%] whitespace-nowrap">คำสั่งซื้อ</TableHeaderCell>
            <TableHeaderCell className="w-[10%] whitespace-nowrap">สถานะ</TableHeaderCell>
            <TableHeaderCell className="w-[12%] whitespace-nowrap">อัปเดตล่าสุด</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRowsSkeleton columns={COLUMNS} />
          ) : (
            books.map((book) => {
              const status = bookAvailability(book);
              const pct = quotaUsedPct(book);
              const latest = book.logs[0];
              return (
                <TableRow
                  key={book.productId}
                  hoverable
                  className="cursor-pointer transition-colors active:bg-[var(--bg-default-pressed)]"
                  onClick={() => router.push(orderBookHref(book.productId))}
                >
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="type-body-2 truncate !font-semibold text-foreground">
                        {book.productName}
                      </p>
                      <p className="type-caption truncate text-muted-foreground">
                        {book.productType} · {book.currency}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-1">
                      <AmountOfTarget
                        amount={book.quotaUsed}
                        target={book.targetAmount}
                        currency={book.currency}
                        pct={pct}
                      />
                      <LinearProgress value={pct} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="type-body-2 whitespace-nowrap text-foreground">
                        {book.bookings.length} คำสั่งซื้อ
                      </span>
                      <OrderCountsLine book={book} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tag
                      text={BOOK_AVAILABILITY_LABEL[status]}
                      variant={BOOK_AVAILABILITY_VARIANT[status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
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
