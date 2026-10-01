"use client";

/**
 * One product's book, as a row in the Order Management list.
 *
 * The card answers the three questions an IC opens this page with, in the order
 * they ask them: which deal, how full is it, and is it waiting on me. The
 * progress bar carries the second; the status tag carries the third, and is the
 * only thing on the card that changes colour, so a screenful of books can be
 * scanned for the one that needs a decision.
 */

import Link from "next/link";
import { CaretRightIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { LinearProgress, Tag } from "@sarunyu/system-one";
import type { OrderBook } from "@/types/domain";
import {
  BOOK_STATUS_LABEL_TH,
  BOOK_STATUS_VARIANT,
  formatLogTime,
  formatOrderAmount,
  headlineRound,
} from "./order-book";

export function OrderBookCard({ book }: { book: OrderBook }) {
  // The round the figures describe — the open one, or the last one sent when
  // there is nothing open. See `headlineRound`.
  const round = headlineRound(book);
  const holders = new Set(round.bookings.map((b) => b.clientId)).size;
  const latest = book.logs[0];

  return (
    <Link
      href={`/orders/${encodeURIComponent(book.productId)}`}
      className="group flex flex-col gap-3 rounded-[8px] border border-border bg-card p-4 shadow-sm transition-colors hover:border-[#0a6ee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7]"
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="type-body-1 truncate font-bold text-foreground">{book.productName}</p>
          <p className="type-caption truncate text-muted-foreground">
            {book.desk} · {book.productType} · {book.currency}
          </p>
        </div>
        <Tag
          text={BOOK_STATUS_LABEL_TH[book.status]}
          variant={BOOK_STATUS_VARIANT[book.status]}
          size="small"
        />
        <CaretRightIcon
          size={18}
          className="mt-0.5 shrink-0 text-muted-foreground transition-colors group-hover:text-[#0a6ee7]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="type-body-2 !font-semibold text-foreground">
            {formatOrderAmount(round.amount, book.currency)}
          </p>
          <p className="type-caption text-muted-foreground">
            จาก {formatOrderAmount(book.targetAmount, book.currency)} ·{" "}
            {Math.round(round.pct)}%
          </p>
        </div>
        <LinearProgress value={round.pct} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="type-caption inline-flex items-center gap-1 text-muted-foreground">
          <UsersThreeIcon size={14} weight="fill" />
          {holders} ราย
        </span>
        {latest && (
          // The newest log line doubles as the card's "last activity" — one
          // sentence that says what happened and when, instead of a bare
          // timestamp the IC has to open the book to interpret.
          <span className="type-caption min-w-0 flex-1 truncate text-muted-foreground/70">
            {latest.summary} · {formatLogTime(latest.at)}
          </span>
        )}
      </div>
    </Link>
  );
}
