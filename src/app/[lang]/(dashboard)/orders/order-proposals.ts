/**
 * Whether an offer worked — derived from the bookings, never stored.
 *
 * A {@link ProposalLog} records that a product's documents went to a client.
 * What it deliberately does not record is what came of it, because the answer
 * is already written in the book: if that client booked this product after the
 * proposal went out, the offer did its job. Storing a verdict alongside would
 * be storing something that can disagree with the rows it describes — the same
 * reasoning `OrderLogEntry` and `bookingPhase` are built on.
 *
 * **Both ways a proposal converts count, and neither needs its own rule.** A
 * proposal lands in two places: the client's app and their email. The client
 * either acts in the app and books it themselves, or reads the email, rings the
 * IC, and the IC books it for them. Either way a booking appears on this
 * product for this client, which is the whole of the test. Which of the two it
 * was is on `Booking.placedVia`, for a report that wants to split them.
 */

import type { Booking, OrderBook, ProposalLog } from "@/types/domain";
import { bookingPhase, isBookClosed, ownBookings, type OrderStepFilter } from "./order-book";

export type ProposalOutcome = "open" | "won" | "lost";

/**
 * The booking that answered this proposal, if one did.
 *
 * Two conditions, and the dates are the interesting one: a booking the client
 * had already placed *before* the documents went out is not something the
 * documents achieved, and counting it would let an IC claim an offer they sent
 * after the sale.
 *
 * Cancelled is not a win either, and that includes a back-office rejection —
 * `bookingPhase` folds both into `"cancelled"`. The offer may well have done
 * its job in the rejected case; crediting it is a one-line change here, and
 * should be a deliberate one rather than a side effect of this test.
 */
export function proposalBooking(
  proposal: ProposalLog,
  book: OrderBook,
): Booking | undefined {
  return book.allBookings.find(
    (b) =>
      b.clientId === proposal.clientId &&
      b.createdAt >= proposal.sentAt &&
      bookingPhase(b, book) !== "cancelled",
  );
}

/**
 * Where one offer stands.
 *
 * `lost` needs a line to fall on the wrong side of, and the line is the
 * product closing rather than a number of days: an offer is live for exactly
 * as long as the client could still act on it. See `isBookClosed` — a basket
 * closes when its order is answered, a bond when its quota is spent.
 */
export function proposalOutcome(proposal: ProposalLog, book: OrderBook): ProposalOutcome {
  if (proposalBooking(proposal, book)) return "won";
  return isBookClosed(book) ? "lost" : "open";
}

export const PROPOSAL_OUTCOME_LABEL: Record<ProposalOutcome, string> = {
  open: "รอลูกค้าตัดสินใจ",
  won: "จองแล้ว",
  lost: "ไม่ได้จอง",
};

/**
 * The tag colour per outcome — for the two that mirror a booking's.
 *
 * `open` is deliberately absent. Every colour in `Tag`'s palette already means
 * a step a *booking* is at — blue is จองแล้ว, yellow is กำลังดำเนินการ, green is
 * สำเร็จ, gray is ยกเลิก, red is ถูกปฏิเสธ — so an offer wearing any of them
 * reads as a sixth booking status. It gets {@link ProposalChip} instead: an
 * outline and a paper plane, which say "different kind of thing" without
 * spending a colour. `won` and `lost` *are* claims about a booking existing or
 * not, so they borrow the two that already mean exactly that.
 */
export const PROPOSAL_OUTCOME_VARIANT: Record<"won" | "lost", "green" | "gray"> = {
  won: "green",
  lost: "gray",
};

/**
 * One product's proposals, newest first.
 *
 * Every IC's, not just the signed-in one — callers narrow it to one client
 * (see `latestProposal`) or to the IC's own clients before anything is shown.
 */
export function proposalsFor(proposals: ProposalLog[], productId: string): ProposalLog[] {
  return proposals
    .filter((p) => p.productId === productId)
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

/**
 * The latest proposal sent to one client on one product.
 *
 * The latest rather than the first: a re-pitch is the one the IC is acting on,
 * and the earlier rows stay in the log where the compliance record wants them.
 */
export function latestProposalFor(
  proposals: ProposalLog[],
  productId: string,
  clientId: string,
): ProposalLog | undefined {
  return proposalsFor(proposals, productId).find((p) => p.clientId === clientId);
}

/**
 * What the line under the send button counts.
 *
 * **Clients, not rows.** The log keeps every send, so two proposals to one
 * client are two rows — but "ส่ง Proposal แล้ว 2 ราย" would then be one person
 * counted twice. Distinct clients is the figure a human reads this as. (When
 * Performance defines its numbers, "offers sent" and "clients offered" are
 * genuinely two figures; this is the second.)
 */
export function proposalTally(
  proposals: ProposalLog[],
  book: OrderBook,
): { clients: number; won: number } {
  const latest = new Map<string, ProposalLog>();
  for (const p of proposalsFor(proposals, book.productId)) {
    if (!latest.has(p.clientId)) latest.set(p.clientId, p);
  }
  let won = 0;
  for (const p of latest.values()) {
    if (proposalOutcome(p, book) === "won") won += 1;
  }
  return { clients: latest.size, won };
}

/**
 * This IC's offers on one book that have produced nothing yet.
 *
 * What Order Management's first step lists. Three filters, each for its own
 * reason:
 *
 * - **`sentBy`** — that tab is a list of the signed-in IC's own work, the same
 *   scope `ownBookings` takes. Another IC's offer on a shared basket is not
 *   theirs to chase.
 * - **outcome `open`** — a won offer is already a booking and has a row of its
 *   own; listing it twice would double-count the client. A lost one is on a
 *   product nobody can act on any more, so there is nothing left to chase.
 * - **no booking of ours for that client on this book, at all.** Stronger than
 *   `proposalOutcome` on purpose: a client whose booking *predates* the offer
 *   is `lost` by the outcome rule, but they are still in this book and still
 *   have a row — showing them a second time under "ส่ง Proposal แล้ว" would
 *   read as two different clients.
 *
 * Latest per client, so a re-pitch is one entry rather than two.
 */
export function openOffersFor(
  proposals: ProposalLog[],
  book: OrderBook,
  icName: string,
): ProposalLog[] {
  const booked = new Set(
    book.allBookings.filter((b) => b.createdBy === icName).map((b) => b.clientId),
  );
  const seen = new Set<string>();
  const out: ProposalLog[] = [];
  for (const p of proposalsFor(proposals, book.productId)) {
    if (p.sentBy !== icName) continue;
    if (booked.has(p.clientId)) continue;
    if (seen.has(p.clientId)) continue;
    if (proposalOutcome(p, book) !== "open") continue;
    seen.add(p.clientId);
    out.push(p);
  }
  return out;
}

/**
 * Whether this book holds anything of the signed-in IC's at this step.
 *
 * The one predicate both panels filter their books with and the table groups
 * by, so the two cannot disagree about whether a desk is empty — the failure
 * that produced a headerless table the last time they were written separately.
 */
export function hasOwnWorkAt(
  book: OrderBook,
  icName: string,
  step: OrderStepFilter,
  proposals: ProposalLog[],
  /** One client's work only — a client profile's Order tab. */
  clientId?: string,
): boolean {
  const theirs = <T extends { clientId: string }>(rows: T[]) =>
    clientId ? rows.filter((r) => r.clientId === clientId) : rows;
  const offers = () => theirs(openOffersFor(proposals, book, icName)).length > 0;
  if (step === "offered") return offers();
  if (theirs(ownBookings(book, icName, step)).length > 0) return true;
  // "ทั้งหมด" takes offers too: a client with an offer and no booking is still
  // one of this IC's, and the step that lists them is part of this list.
  return step === null && offers();
}
