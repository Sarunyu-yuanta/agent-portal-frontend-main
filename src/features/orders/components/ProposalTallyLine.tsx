"use client";

/**
 * How this product's offers have gone, in one line under the send button.
 *
 * The report proper belongs on `/performance` and is not built yet. This is the
 * readback that keeps the log from being write-only in the meantime: having
 * just sent a Proposal, the IC can see that it went, and come back later to see
 * whether it turned into a booking.
 *
 * Counts **clients, not sends** — see `proposalTally`. Hidden at zero: a line
 * reading "ส่ง Proposal แล้ว 0 ราย" is a line about nothing.
 */

import { useOrders } from "@/features/orders/store/orders-context";
import { useOrderBook } from "@/features/orders/hooks/use-order-books";
import { proposalTally, proposalsFor } from "@/features/orders/lib/order-proposals";
import { useT } from "@/i18n/I18nProvider";

export function ProposalTallyLine({ productId }: { productId: string }) {
  const t = useT();
  const { proposals } = useOrders();
  const { data: book } = useOrderBook(productId);

  // A product that is offered but never booked (a fund, a stock) has no book
  // to count a booking against — the line is just how many were offered.
  if (!book) {
    const offered = new Set(proposalsFor(proposals, productId).map((p) => p.clientId)).size;
    if (offered === 0) return null;
    return (
      <p className="text-center text-xs leading-[20px] text-[#6a7282]">
        {t.orders.proposal.tallyOffered(offered)}
      </p>
    );
  }

  const { clients, won } = proposalTally(proposals, book);
  if (clients === 0) return null;

  return (
    <p className="text-center text-xs leading-[20px] text-[#6a7282]">
      {t.orders.proposal.tallyBooked(clients)}{" "}
      <span className={won > 0 ? "font-semibold text-[var(--fill-green-700)]" : undefined}>
        {won}
      </span>
    </p>
  );
}
