/**
 * The lowest membership tier a product may be offered to.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * Mock rule. No product feed carries a tier requirement yet. Until it does,
 * structured products (Global and Thai) require Gold and above, and every
 * other desk is open to everyone. When the feed sends one, set
 * `ProposalSubject.minTier` from it; an explicit value always wins over this.
 */

import type { MembershipTier } from "@/components/ui/tier-badge";
import { deskForId } from "./bookable-products";
import { offeredSymbol } from "./offered-products";
import type { ProposalSubject } from "@/features/orders/components/SendProposalDialog";

const MIN_TIER_BY_DESK: Partial<Record<ReturnType<typeof deskForId>, MembershipTier>> = {
  "Global Structured": "gold",
  "Thai Structured": "gold",
};

export function proposalMinTier(
  subject: Pick<ProposalSubject, "id" | "minTier">,
): MembershipTier | undefined {
  if (subject.minTier) return subject.minTier;
  // Funds and stocks are offered but never booked, so they have no desk.
  // `deskForId` would read them as Global Structured.
  if (offeredSymbol("stock", subject.id) !== null) return undefined;
  if (offeredSymbol("mutual-fund", subject.id) !== null) return undefined;
  return MIN_TIER_BY_DESK[deskForId(subject.id)];
}
