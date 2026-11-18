"use client";

/**
 * Sending a product's Proposal, from any page that shows a product.
 *
 * Six surfaces offer it — both structured product pages, a bond's page, a
 * bond row on an issuer's page, and a mutual fund's and a stock's page (offered
 * only, never booked — see `SendProposalButton`) — and each would otherwise stand up its own
 * dialog, its own `<Toaster>` and its own "how many went" wording. One hook per
 * page instead, the shape {@link useQuotaBooking} already established: `send`
 * opens it, `ui` renders the dialog and the toasts, `notice` reports into the
 * same stack so a page never mounts two.
 */

import { useState, type ReactNode } from "react";
import { Toaster, type ToastStatus } from "@sarunyu/system-one";
import { useToasts } from "@/hooks/use-toasts";
import { useOrders } from "@/contexts/orders-context";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { SendProposalDialog, type ProposalSubject } from "./SendProposalDialog";
import { useOrderBook } from "./use-order-books";

export function useSendProposal(options?: {
  /**
   * The page's own toast stack, where it already has one.
   *
   * Both structured product pages do — they report a booking through it — and a
   * page with two `<Toaster>`s has two fixed stacks in the same corner, so one
   * send and one booking would overlap. Given this, the hook renders no toaster
   * of its own.
   */
  onNotice?: (message: string, status: ToastStatus) => void;
}): {
  /** Opens the dialog on this product. */
  send: (product: ProposalSubject) => void;
  /** Reports into whichever stack this page is using. */
  notice: (message: string, status: ToastStatus) => void;
  /** The dialog, and its toasts unless the page owns them. */
  ui: ReactNode;
} {
  const { toasts, addToast, removeToast } = useToasts();
  const [product, setProduct] = useState<ProposalSubject | null>(null);
  const own = options?.onNotice;
  const notice = own ?? ((message: string, status: ToastStatus) => addToast({ message, status }));

  return {
    send: setProduct,
    notice,
    ui: (
      <>
        {ORDER_BOOKING_ENABLED && product && (
          <Opened product={product} onClose={() => setProduct(null)} onNotice={notice} />
        )}
        {!own && <Toaster items={toasts} onRemove={removeToast} />}
      </>
    ),
  };
}

/**
 * The dialog, once a product is chosen.
 *
 * Split out only so `useOrderBook` can be called with a product id rather than
 * conditionally — the hook above has no product until the IC presses the
 * button, and hooks cannot be called behind that.
 */
function Opened({
  product,
  onClose,
  onNotice,
}: {
  product: ProposalSubject;
  onClose: () => void;
  onNotice: (message: string, status: ToastStatus) => void;
}) {
  const { sendProposal } = useOrders();
  const { data: book } = useOrderBook(product.id);

  return (
    <SendProposalDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      product={product}
      book={book}
      onConfirm={(clientIds, channels) => {
        void (async () => {
          // The rows actually written, not the ids asked for — the store drops
          // an id it cannot name, and reporting the request would overstate it.
          const rows = await sendProposal({ productId: product.id, clientIds, channels });
          onClose();
          onNotice(proposalSentMessage(product.underlying, rows), "success");
        })();
      }}
    />
  );
}

/** The toast after a send — one wording wherever a Proposal goes from. */
export function proposalSentMessage(
  underlying: string,
  rows: { clientName: string }[],
): string {
  return rows.length === 1
    ? `ส่ง Proposal ${underlying} ให้ ${rows[0].clientName} แล้ว`
    : `ส่ง Proposal ${underlying} ให้ลูกค้า ${rows.length} คนแล้ว`;
}
