"use client";

import { Button } from "@sarunyu/system-one";
import { bookingModeFor, type BookableProduct } from "@/features/orders/lib/bookable-products";
import { amountCheck } from "@/features/orders/lib/amount-check";
import { bookingRemaining, isBookingOpen } from "@/features/orders/lib/order-book";
import { useOrderBook } from "@/features/orders/hooks/use-order-books";
import { evidenceComplete, evidenceRequired } from "@/features/orders/components/order-evidence";
import { useT } from "@/i18n/I18nProvider";
import type { OrderEvidence } from "@/types/order";

// ── Footer ───────────────────────────────────────────────────────────────────

export function Footer({
  ready,
  evidence,
  product,
  cashAvailable,
  raw,
  booking,
  reviewing,
  onReview,
  onCancel,
  onBooked,
}: {
  /** Whether all four checks pass — the gate on the amount and the booking. */
  ready: boolean;
  /** The attached proof, where this desk asks for one. */
  evidence: OrderEvidence | null;
  product: BookableProduct;
  /** The client's cash in the product's currency — see `amountCheck`. */
  cashAvailable: number;
  raw: string;
  booking: boolean;
  /** On the summary: the primary sends. On the form it only moves on to it. */
  reviewing: boolean;
  onReview: () => void;
  onCancel: () => void;
  onBooked: (amount: number) => void;
}) {
  const t = useT();
  const { data: book } = useOrderBook(product.id);
  const { amount, ok } = amountCheck(
    product,
    book ? bookingRemaining(book) : null,
    book ? !isBookingOpen(book) : false,
    cashAvailable,
    raw,
  );

  const mode = bookingModeFor(product);
  // `ready` is checked here as well as on the amount section: a check can
  // expire while the form is open, and the gate has to hold at the moment of
  // booking. The evidence is re-checked for the same reason — the section can
  // have it removed after it was attached.
  const hasEvidence = !evidenceRequired(mode) || evidenceComplete(evidence);
  const canBook = ready && ok && hasEvidence && !booking;
  const words = t.orders.words[mode];

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-border px-4 py-3 md:px-6">
      {/* Two screens, one footer. The form's primary only moves on to the
          summary — same gate, so the summary is never reached with an order
          that could not be sent. The summary's primary is the one that sends,
          and it re-checks: a check can lapse while the IC is reading. */}
      <div className="flex items-center justify-end gap-2">
        {/* Cancel on both screens — the way back from the summary is the
            arrow in the title row (or atop the sheet on a phone). */}
        <Button variant="outline" size="md" disabled={booking} onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button
          variant={canBook ? "primary" : "disabled"}
          size="md"
          disabled={!canBook}
          // USABILITY-TEST ONLY (temporary; revert after testing): stable ids for Useberry triggers.
          id={reviewing ? "booking-submit" : "booking-review"}
          onClick={() => (reviewing ? onBooked(amount) : onReview())}
        >
          {!reviewing ? t.orders.summary.review : booking ? words.actionBusy : words.confirm}
        </Button>
      </div>
    </div>
  );
}
