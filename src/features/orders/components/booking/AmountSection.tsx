"use client";

import { Alert } from "@sarunyu/system-one";
import { formatThbAmount, parseAmount } from "@/lib/client-utils";
import { bookingModeFor, type BookableProduct } from "@/features/orders/lib/bookable-products";
import { amountCheck, hasNonDigit } from "@/features/orders/lib/amount-check";
import {
  bookingRemaining,
  cashInCurrency,
  clientCashThb,
  formatOrderAmount,
  isBookClosed,
  isBookingOpen,
  minTicketFor,
} from "@/features/orders/lib/order-book";
import { useOrderBook } from "@/features/orders/hooks/use-order-books";
import { useT } from "@/i18n/I18nProvider";
import type { Client } from "@/types/client";

// ── Amount ───────────────────────────────────────────────────────────────────

export function AmountSection({
  product,
  client,
  raw,
  onRawChange,
}: {
  product: BookableProduct;
  client: Client;
  raw: string;
  onRawChange: (next: string) => void;
}) {
  const t = useT();
  const { data: book } = useOrderBook(product.id);
  const currency = product.currency;
  const minTicket = minTicketFor(product);
  const closed = book ? !isBookingOpen(book) : false;
  /** The cap on this booking — `null` on a basket, which has none. */
  const cap = book ? bookingRemaining(book) : null;
  // `bookingModeFor(product)`, not `book.mode` — the book may not have loaded
  // and the product is the authority on its desk either way.
  const mode = bookingModeFor(product);
  const words = t.orders.words[mode];

  const cashThb = clientCashThb(client);
  const cashHere = cashInCurrency(cashThb, currency);
  /** What is in the field right now, as a number — `0` while it is empty. */
  const typed = hasNonDigit(raw) ? 0 : parseAmount(raw);
  /**
   * The amounts offered as one-press fills.
   *
   * Multiples of the minimum ticket, de-duplicated, and only those the client
   * can actually fund and the desk's cap allows — a chip that fails the form's
   * own check the moment it is pressed is worse than no chip.
   */
  const quickFills = ((): number[] => {
    // No `useMemo`: three multiplications over a three-item list, and the React
    // Compiler memoises it better than a dependency list can — a hand-written
    // one here is what it reports as "memoization could not be preserved".
    const ceiling = Math.min(Math.floor(cashHere), cap ?? Number.POSITIVE_INFINITY);
    return [1, 2, 5]
      .map((n) => minTicket * n)
      .filter((v, i, a) => v <= ceiling && a.indexOf(v) === i);
  })();
  const { full, invalid, tooSmall, tooBig, overCash } = amountCheck(
    product,
    cap,
    closed,
    cashHere,
    raw,
  );
  /**
   * Two different reasons the amount is closed, and they do not stack: a client
   * who is short a document cannot book whatever the round's state, so that
   * message wins and the round's is not also shown.
   */
  // The checks are the caller's gate now — this one only closes for a product
  // that takes no more bookings.
  const blocked = full;
  /**
   * Whether the figure reads as wrong.
   *
   * Not while the field is closed: a faded, inert section in red would be
   * shouting about a number nobody can change.
   */
  const showError = !blocked && (invalid || tooSmall || tooBig || overCash);
  /** `฿` for a Thai product, `$` for a dollar one — against the figure. */
  const symbol = currency === "THB" ? "฿" : "$";

  /**
   * Digits are grouped with commas as they are typed. Anything else is kept
   * exactly as typed rather than dropped — a key that silently did nothing read
   * as a broken field — and the field flags it (see `amountCheck`) until it is
   * fixed. Regrouping a value that is not a number would rewrite what the IC
   * is looking at, so it is left alone.
   */
  const setAmount = (next: string) => {
    if (hasNonDigit(next)) {
      onRawChange(next);
      return;
    }
    const digits = next.replace(/,/g, "");
    onRawChange(digits ? Number(digits).toLocaleString("en-US") : "");
  };

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
      {/* The product takes no more bookings. Not an error on the amount —
          there is no amount that would be right — so it closes the field the
          same way a missing document does.

          No "ครบยอดแล้ว" branch: a basket reaching its notional does *not*
          close it. The target is what the deal aims for, and a basket can be
          over-booked — see `bookingRemaining`. What closes a basket is its
          order going downstream, which is the third and fourth cases here. */}
      {full && (
        <Alert
          status="information"
          message={
            mode === "quota"
              ? t.orders.amount.quotaFull(product.underlying)
              : book && isBookClosed(book)
                ? t.orders.amount.orderSent(product.underlying)
                : t.orders.amount.orderProcessing(product.underlying)
          }
          multiline
        />
      )}
      {/* Faded and inert, not removed — `inert` takes it out of the tab order
          and the accessibility tree as well as the pointer's reach. */}
      <div
        inert={blocked}
        aria-disabled={blocked}
        className={`flex flex-col gap-3 transition-opacity ${
          blocked ? "pointer-events-none opacity-40 select-none" : ""
        }`}
      >
        {/* The amount as a figure, not a field.

            It was a bordered `Input` with the cash beside it, and it read as a
            form: six boxes of equal weight, one of which happened to be the
            only decision on the screen. This is the shape a payment app uses
            for the same job — the number large and centred, the currency
            against it, the common amounts one press away, and the balance a
            caption underneath — because there is exactly one thing to do here
            and it should look like it.

            A plain `<input>` rather than the library's: the figure has to be
            48px, centred and borderless, and `Input` owns its own box from an
            unlayered stylesheet that a class cannot beat (see the note on
            `FIT` in `ProductOrderSection`). The validation it would have drawn
            is drawn below instead — same four messages, same order. */}
        <div className="flex flex-col items-center gap-4 py-2">
          <label htmlFor="booking-amount" className="type-caption text-muted-foreground">
            {`Notional Amount (${currency})`}
          </label>

          <div
            className={`flex items-baseline justify-center ${
              showError ? "text-[var(--fill-red-600)]" : "text-primary-action"
            }`}
          >
            {/* The same size as the figure and hard against it — the two are
                one number read as one word, the way `$408` is. No gap, so the
                only space between them is the glyph's own sidebearing. */}
            <span className="text-[48px] leading-[1.3] font-bold">{symbol}</span>
            {/* Sized to the digits themselves, so the field never has more text
                than room and never scrolls. `size` was the old way, but it
                counts characters at an average width — 48px bold digits and
                commas are wider, so the figure overflowed its box, scrolled
                sideways, and lost its tops to the tight line-height.

                The input and an invisible copy of its text share one grid
                cell: the copy sets the width, the input fills it. Left-aligned,
                so the digits start right after the symbol. The copy's
                `pr-[0.1em]` leaves the caret room at the end. */}
            <span className="inline-grid">
              <span
                aria-hidden
                className="invisible pr-[0.1em] text-[48px] leading-[1.3] font-bold whitespace-pre tabular-nums [grid-area:1/1]"
              >
                {raw || "0"}
              </span>
              <input
                id="booking-amount"
                value={raw}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                inputMode="numeric"
                disabled={blocked}
                aria-invalid={showError}
                size={1}
                className="w-full min-w-0 border-0 bg-transparent p-0 text-left text-[48px] leading-[1.3] font-bold tabular-nums outline-none [grid-area:1/1] placeholder:text-[var(--text-default-placeholder)] disabled:cursor-not-allowed"
              />
            </span>
          </div>

          {/* One line under the figure, where the reference puts its balance.
              The error replaces it rather than stacking under it: both are
              about the same number, and two lines of small text below a 48px
              figure is the clutter this layout exists to remove. */}
          {showError ? (
            <p className="type-caption text-center text-[var(--fill-red-600)]">
              {invalid
                ? t.orders.amount.digitsOnly
                : tooSmall
                  ? t.orders.amount.belowMinimum(formatOrderAmount(minTicket, currency))
                  : tooBig
                    ? words.overRemaining(formatOrderAmount(cap ?? 0, currency))
                    : t.orders.amount.overCash(formatOrderAmount(Math.floor(cashHere), currency))}
            </p>
          ) : (
            <p className="type-caption text-center text-muted-foreground">
              {t.orders.create.minimum(formatOrderAmount(minTicket, currency))}
              {cap !== null && <> · {words.remaining(formatOrderAmount(cap, currency))}</>}
            </p>
          )}

          {/* Steps off the minimum, so the common amounts are one press rather
              than six keystrokes each. Multiples of the ticket rather than
              round numbers: a product with a 10,000 minimum does not sell in
              25,000s. Anything the client cannot fund is left out — a
              suggestion that fails the form's own check is worse than none.
              Scrolls rather than wraps, so the row stays one line. */}
          {quickFills.length > 0 && (
            <div className="scrollable-tabs flex w-full items-center justify-center gap-2">
              {quickFills.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onRawChange(v.toLocaleString("en-US"))}
                  className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-body-sm font-semibold tabular-nums transition-colors ${
                    typed === v
                      ? "border-primary-action bg-primary-action-light text-primary-action"
                      : "border-border bg-white text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--bg-default-secondary)]"
                  }`}
                >
                  {v.toLocaleString("en-US")}
                </button>
              ))}
            </div>
          )}

          {/* The balance, as the reference captions it. In THB, which is the
              account's own currency — where the amount above exceeds it, the
              error line says so in the product's. */}
          <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5">
            <span className="type-caption text-muted-foreground">
              {t.orders.amount.cashBalance}
            </span>
            <span className="type-body-2 !font-semibold text-foreground tabular-nums">
              ฿ {formatThbAmount(cashThb)}
            </span>
          </div>
        </div>

        {overCash && <Alert status="critical" message={t.orders.amount.overCashAlert} multiline />}
      </div>
    </div>
  );
}
