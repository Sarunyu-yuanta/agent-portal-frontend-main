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
import { HourglassMediumIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { LinearProgress, Tag } from "@sarunyu/system-one";
import type { OrderBook } from "@/types/domain";
import {
  BOOK_STATUS_LABEL_TH,
  BOOK_STATUS_VARIANT,
  formatLogTime,
  headlineRound,
} from "./order-book";
import { ProductLogos } from "./ProductLogos";
import { AmountOfTarget } from "./AmountOfTarget";
import { CARD_CLASS } from "./card-class";

export function OrderBookCard({ book }: { book: OrderBook }) {
  // The round the figures describe — the open one, or the last one sent when
  // there is nothing open. See `headlineRound`.
  const round = headlineRound(book);
  const holders = new Set(round.bookings.map((b) => b.clientId)).size;
  const latest = book.logs[0];
  // Orders still out, except one the headline above is already describing —
  // a book with nothing open leads with the round it just sent, and repeating
  // it underneath would read as two orders in flight.
  const pending = book.pendingOrders.filter((s) => s.backendRef !== round.previousRef);

  return (
    <Link
      href={`/orders/${encodeURIComponent(book.productId)}`}
      className={CARD_CLASS}
    >
      {/* The logo strip gets the row the catalogue card gives it, with the
          status tag where the catalogue puts its own tags. The row is rendered
          whether or not there are logos, so a Thai book — which has none — has
          the same shape as a global one instead of pulling its tag up a line. */}
      <div className="flex items-start gap-3">
        {/* The spacer is the div, not the strip: `ProductLogos` renders nothing
            for a Thai book, and `flex-1` on it went with it — pulling the tag
            and caret to the left edge on half the cards. */}
        <div className="min-w-0 flex-1">
          <ProductLogos logos={book.logos} />
        </div>
        {/* `large` — the only size up from `small` the library offers. It is
            the one thing on the card that changes colour, and at `small` it
            read as a footnote next to the logo strip it shares a row with. */}
        <Tag
          text={BOOK_STATUS_LABEL_TH[book.status]}
          variant={BOOK_STATUS_VARIANT[book.status]}
          size="large"
        />
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="type-body-1 truncate font-bold text-foreground">{book.productName}</p>
        <p className="type-caption truncate text-muted-foreground">
          {book.desk} · {book.productType} · {book.currency}
        </p>
        {/* Whether the amounts below have gone out yet, and as which order. */}
        <p className="type-caption truncate text-muted-foreground">
          {round.previousRef ? `ส่งแล้ว (${round.previousRef})` : "ยังไม่ส่งคำสั่งซื้อ"}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <AmountOfTarget
          amount={round.amount}
          target={book.targetAmount}
          currency={book.currency}
          pct={round.pct}
        />
        <LinearProgress value={round.pct} />
      </div>

      {/* Who is in the round, and when it last moved — the two facts that
          qualify the figures above, at opposite ends of one line. The log
          line's own sentence used to sit here ("จองให้ … 20,000 USD · 5 Oct …"),
          which named one client out of several and repeated an amount the
          figures already carry; the book's history tab is where what happened
          belongs. */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="type-caption inline-flex items-center gap-1 text-muted-foreground">
          <UsersThreeIcon size={14} weight="fill" />
          {holders} ราย
        </span>
        {latest && (
          <span className="type-caption shrink-0 tabular-nums text-muted-foreground/70">
            {formatLogTime(latest.at)}
          </span>
        )}
      </div>

      {/* An order still with the back office, named rather than folded into the
          tag above. The tag is the open round's — these two are different
          rounds and can say different things on the same card. */}
      {pending.length > 0 && (
        // The same yellow the book page uses for "ยังขาดอีก": a wait that is
        // somebody else's to end. It is a filled block rather than a rule and a
        // grey line because it is the one thing on the card that is not about
        // the round the rest of it describes — the colour is what keeps a
        // reader from folding it into the figures above.
        <p className="type-caption flex items-center gap-1.5 rounded-lg bg-[var(--fill-yellow-100)] px-3 py-2 text-[var(--fill-yellow-700)]">
          <HourglassMediumIcon size={14} weight="fill" className="shrink-0" />
          <span className="truncate">
            {pending[0].backendRef} · รอผลจากระบบหลังบ้าน
            {pending.length > 1 && ` (+${pending.length - 1})`}
          </span>
        </p>
      )}
    </Link>
  );
}
