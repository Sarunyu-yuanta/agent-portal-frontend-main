/**
 * How a client transaction reads on screen — labels, colours and number
 * formats, shared by the list (`TransactionsPanel`) and the row's detail
 * (`TransactionDetailModal`).
 *
 * Here rather than in either component because the two show the same trade:
 * a quantity rounded to 4 places in the table and 2 in the modal would read as
 * two different orders.
 */

import type { TransactionAsset, TransactionSide, TransactionStatus } from "@/types/domain";
import type { Locale } from "@/i18n/config";
import { formatDate, formatTime } from "@/i18n/format";

/** Green and red, as the rest of the app colours a rise and a fall. */
export const SIDE_CLASS: Record<TransactionSide, string> = {
  buy: "text-[var(--fill-green-700)]",
  sell: "text-[var(--fill-red-700)]",
  switch: "text-[var(--fill-blue-700)]",
};

/**
 * The same three colours as a filled badge, for the opened trade.
 *
 * A table row says "ซื้อ" in a column headed ประเภท, so the word alone is
 * unambiguous there; the receipt has no headings, and the badge is what makes
 * it read as a fact about the trade rather than part of the product's name.
 */
export const SIDE_PILL: Record<TransactionSide, string> = {
  buy: "bg-[var(--fill-green-100)] text-[var(--fill-green-700)]",
  sell: "bg-[var(--fill-red-100)] text-[var(--fill-red-700)]",
  switch: "bg-[var(--fill-blue-100)] text-[var(--fill-blue-700)]",
};

/** The tag colour per status; the word is `t.orders.tradeStatus`. */
export const STATUS_TAG: Record<
  TransactionStatus,
  { variant: "green" | "yellow" | "blue" | "gray" }
> = {
  matched: { variant: "green" },
  partial: { variant: "yellow" },
  pending: { variant: "blue" },
  cancelled: { variant: "gray" },
};



const number = (value: number, digits = 2) =>
  value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Units carry 4 decimals; shares and contracts are whole. */
export const formatQuantity = (asset: TransactionAsset, quantity: number) =>
  asset === "mutual-fund" ? number(quantity, 4) : quantity.toLocaleString("en-US");

/** A NAV is quoted to 4 places, a share price and a futures point to 2. */
export const formatPrice = (asset: TransactionAsset, price: number) =>
  number(price, asset === "mutual-fund" ? 4 : 2);

export const formatAmount = (amount: number) => number(amount);

/**
 * The timestamp as two values — the receipt gives the clock and the day a row
 * each, where the table runs them together.
 *
 * Read in UTC, like `formatLogTime` (see its note on the seed data).
 */
export function splitLogTime(iso: string, locale: Locale): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: "" };
  return { date: formatDate(locale, d, "short", "UTC"), time: formatTime(locale, d, "UTC") };
}
