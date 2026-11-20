import { parseAmount } from "@/lib/client-utils";
import type { BookableProduct } from "@/features/orders/lib/bookable-products";
import { minTicketFor } from "@/features/orders/lib/order-book";

/**
 * The amount's own validity, shared by the field and the submit button.
 *
 * `full` — the round has already reached the target — is its own answer rather
 * than a very large `tooBig`. The over-limit test used to read
 * `remaining > 0 && amount > remaining`, which switched itself off at exactly
 * the moment it was needed most: with nothing left to book, every amount
 * passed, and a 100,000 book took another 500,000 under a helper line still
 * reading "ยังจองได้ 0 USD".
 */
/** Anything in the field besides digits and the commas it groups them with. */
export const hasNonDigit = (raw: string) => /[^0-9,]/.test(raw);

export function amountCheck(
  product: BookableProduct,
  /**
   * The cap on this booking, or `null` where the desk has none — see
   * `bookingRemaining`. A basket has none: its notional is a target, not a
   * limit, and it can be over-booked.
   */
  cap: number | null,
  /** The product takes no more bookings at all — see `isBookingOpen`. */
  closed: boolean,
  /** The client's own cash, in the product's currency — see `overCash`. */
  cashAvailable: number,
  raw: string,
): {
  amount: number;
  full: boolean;
  invalid: boolean;
  tooSmall: boolean;
  tooBig: boolean;
  overCash: boolean;
  ok: boolean;
} {
  // Not a number at all: the size checks would be measuring whatever digits
  // happened to be in it, so they stand down and this is the one error shown.
  const invalid = hasNonDigit(raw);
  const amount = invalid ? 0 : parseAmount(raw);
  // Read off the product rather than inferred from the cap running out. A
  // basket at its notional is not closed — it can take more — and a quota book
  // with nothing left is closed whatever anyone types.
  const full = closed || cap === 0;
  const tooSmall = amount > 0 && amount < minTicketFor(product);
  const tooBig = !full && cap !== null && amount > cap;
  /**
   * More than the client can fund.
   *
   * A gate, not a warning. It used to be the latter, on the reasoning that the
   * back office's funds check downstream was the real gate — which meant a
   * booking could be placed, fill a basket, and then hold the whole product at
   * "วงเงินไม่เพียงพอ" until the IC found it and cancelled it. The check that
   * decides belongs where the number is typed, so that state no longer exists
   * (see `Booking` in `@/types/order`).
   */
  const overCash = amount > 0 && amount > cashAvailable;
  return {
    amount,
    full,
    invalid,
    tooSmall,
    tooBig,
    overCash,
    ok: !invalid && amount > 0 && !full && !tooSmall && !tooBig && !overCash,
  };
}
