"use client";

/**
 * "ส่ง Proposal ให้ลูกค้า" for a product the IC can offer but not book — a
 * mutual fund or a stock.
 *
 * The other desks' pages carry `ProductDocumentActions` (send, plus a caret for
 * two downloads) beside a จองซื้อ. Neither applies here: a client buys a fund
 * or a stock through their own channel, so there is no booking, and there are
 * no Presentation PDF / package downloads to put behind a caret. What is left
 * is the send itself and the tally under it, the same as on the other pages.
 *
 * Self-contained — the dialog and its toasts come with it — because neither
 * host page has a toast stack of its own to share.
 */

import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import type { ProposalSubject } from "./SendProposalDialog";
import { ProposalTallyLine } from "./ProposalTallyLine";
import { useSendProposal } from "./useSendProposal";

export function SendProposalButton({
  subject,
  className = "",
}: {
  subject: ProposalSubject;
  className?: string;
}) {
  const proposal = useSendProposal();
  // Proposals are part of the order feature; with it off there is nowhere for
  // one to be logged, so the button goes with it.
  if (!ORDER_BOOKING_ENABLED) return null;

  return (
    <div className={`flex w-full flex-col items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => proposal.send(subject)}
        // Same colour, height and radius as the send half of
        // `ProductDocumentActions`, so it reads as the same action.
        className="flex h-12 w-full max-w-[343px] cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#0a6ee7" }}
      >
        <PaperPlaneTiltIcon size={16} weight="fill" />
        <span>ส่ง Proposal ให้ลูกค้า</span>
      </button>
      <ProposalTallyLine productId={subject.id} />
      {proposal.ui}
    </div>
  );
}
