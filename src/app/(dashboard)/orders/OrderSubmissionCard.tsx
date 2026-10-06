"use client";

/**
 * One sent order, as a row on the "คำสั่งซื้อรอผล" and "คำสั่งซื้อเสร็จสิ้น" tabs.
 *
 * It leads with the reference rather than the product, because that is what the
 * back office answers against and what the IC quotes when chasing one. The
 * product and the round sit under it: a book can have several of these, and
 * without the round they are three cards with the same product name on them.
 */

import Link from "next/link";
import { UsersThreeIcon } from "@phosphor-icons/react";
import { Tag } from "@sarunyu/system-one";
import type { OrderRow } from "./order-entries";
import { SUBMISSION_TAG, formatLogTime, formatOrderAmount } from "./order-book";
import { ProductLogos } from "./ProductLogos";
import { CARD_CLASS } from "./card-class";

export function OrderSubmissionCard({ row }: { row: OrderRow }) {
  const { book, submission } = row;
  const tag = SUBMISSION_TAG[submission.status];
  const answered = submission.settledAt !== null;

  return (
    <Link
      // Straight to the book's own order list, where this order's bookings are
      // listed one by one — the question a row like this raises.
      href={`/orders/${encodeURIComponent(book.productId)}?view=orders`}
      className={CARD_CLASS}
    >
      {/* Same top row as the book card's, so the two tabs' cards line up even
          though what they list differs. */}
      <div className="flex items-start gap-3">
        {/* Spacer on the div, not the strip — see `OrderBookCard`. */}
        <div className="min-w-0 flex-1">
          <ProductLogos logos={book.logos} />
        </div>
        {/* Same size as the book card's — the two sit in one grid. */}
        <Tag text={tag.text} variant={tag.variant} size="large" />
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="type-body-1 truncate font-bold text-foreground">
          {submission.backendRef}
        </p>
        <p className="type-caption truncate text-muted-foreground">
          {book.productName} · รอบที่ {row.round}
        </p>
        <p className="type-caption truncate text-muted-foreground">
          {book.desk} · {book.productType} · {book.currency}
        </p>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <p className="type-body-2 !font-semibold tabular-nums text-foreground">
          {formatOrderAmount(row.amount, book.currency)}
        </p>
        <span className="type-caption inline-flex items-center gap-1 text-muted-foreground">
          <UsersThreeIcon size={14} weight="fill" />
          {row.holders} ราย
        </span>
      </div>

      <p className="type-caption border-t border-border pt-2 text-muted-foreground/70">
        {/* Which date this is, said out loud. An order that has been answered
            and one that is still out both carry a timestamp, and they are not
            the same timestamp. */}
        {answered
          ? `ตอบกลับ ${formatLogTime(submission.settledAt!)}`
          : `ส่งเมื่อ ${formatLogTime(submission.submittedAt)}`}
      </p>
    </Link>
  );
}
