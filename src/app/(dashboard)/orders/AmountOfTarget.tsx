"use client";

/**
 * A round's progress as one figure: `60,000 / 100,000 USD`, with the
 * percentage trailing.
 *
 * The two numbers belong together — what has been collected only means
 * anything against what has to be — and writing them as one fraction is how the
 * book page's summary has always said it. The card and the table used to say it
 * as two sentences instead ("60,000 USD" … "จาก 100,000 USD · 60%"), which put
 * the pair at opposite ends of the row and repeated the currency.
 *
 * Shared so the three surfaces cannot drift: the same book is read here, in the
 * table, and on its own page.
 */
export function AmountOfTarget({
  amount,
  target,
  currency,
  pct,
}: {
  amount: number;
  target: number;
  currency: string;
  /** Capped at 100 by the caller — see `headlineRound`. */
  pct: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 tabular-nums">
      <p className="type-body-2 min-w-0 truncate text-muted-foreground">
        {/* Primary once the target is met — the same rule the book page's
            summary and the product page's "Request / Notional Size" follow. */}
        <span
          className={`!font-semibold ${
            amount >= target ? "text-[#0a6ee7]" : "text-foreground"
          }`}
        >
          {amount.toLocaleString("en-US")}
        </span>{" "}
        / {target.toLocaleString("en-US")} {currency}
      </p>
      <p className="type-caption shrink-0 text-muted-foreground">{Math.round(pct)}%</p>
    </div>
  );
}
