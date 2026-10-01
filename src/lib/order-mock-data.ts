/**
 * Seed data for the order-booking feature: the bookings, submissions and
 * requirement requests a book starts life with, plus the per-client form
 * records readiness is checked against.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * Nothing here is authored as a timestamp. Every seed carries `daysAgo`, and
 * the date is stamped from today at import — the same inversion `mockKYCData`
 * does, for the same reason: a literal date in a fixture is wrong the week
 * after it is written, and a demo whose "2 days ago" reads "8 months ago" is
 * worse than no demo. A real backend returns real timestamps and these consumers
 * don't change.
 *
 * Product-level facts (currency, notional target, minimum ticket) are
 * deliberately *not* here. They belong to the product, and reading them from
 * the catalogue rather than copying them into a fixture is what stops a book
 * from quoting a target the product itself doesn't have — see
 * `app/(dashboard)/orders/order-book.ts`, which assembles the two.
 */

import orderBooksRaw from "@/data/order-books.json";
import orderRequirementsRaw from "@/data/order-requirements.json";
import type {
  Booking,
  OrderSubmission,
  RequirementKey,
  RequirementRequest,
  RequirementStatus,
} from "@/types/domain";
import { mockClients } from "@/lib/mock-data";
import { NOTE_AUTHOR } from "@/app/(dashboard)/notes/note-constants";

/**
 * Who every booking, request and submission is attributed to.
 *
 * The same identity notes are authored as, rather than a second constant
 * holding the same string: there is one signed-in IC in this app, and two
 * names for them is how a log line and a note end up crediting different
 * people for the same afternoon.
 */
export const ORDER_ACTOR = NOTE_AUTHOR;

const nameById = Object.fromEntries(mockClients.map((c) => [c.id, c.name]));

/**
 * A seed's `daysAgo` turned into an ISO timestamp.
 *
 * The date is counted back from *UTC midnight* and the time of day is derived
 * from the record's own id, not from the clock. Both halves of that matter:
 * counting from midnight keeps "3 days ago" on the same calendar day however
 * late the page is opened, and a time derived from the id is identical on the
 * server and in the browser — `new Date()` would differ between the two and
 * React would report a hydration mismatch on every timestamp rendered.
 *
 * The derivation only has to be stable and spread out, not meaningful: it lands
 * inside office hours (09:00–17:59) so a seeded log reads like a working day.
 */
function stampFromDaysAgo(daysAgo: number, id: string): string {
  const seed = [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const now = new Date();
  const at = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo),
  );
  at.setUTCHours(9 + (seed % 9), seed % 60, 0, 0);
  return at.toISOString();
}

type BookingSeed = {
  id: string;
  clientId: string;
  amount: number;
  daysAgo: number;
  status?: string;
};

type SubmissionSeed = {
  id: string;
  bookingIds: string[];
  daysAgo: number;
  status: string;
  backendRef: string;
};

/** Every seeded booking, flattened — the book each belongs to is on the row. */
export const seedBookings: Booking[] = orderBooksRaw.books.flatMap((book) =>
  (book.bookings as BookingSeed[]).map((b) => ({
    id: b.id,
    productId: book.productId,
    clientId: b.clientId,
    clientName: nameById[b.clientId] ?? b.clientId,
    amount: b.amount,
    createdAt: stampFromDaysAgo(b.daysAgo, b.id),
    createdBy: ORDER_ACTOR,
    status: (b.status ?? "booked") as Booking["status"],
  })),
);

export const seedSubmissions: OrderSubmission[] = orderBooksRaw.books.flatMap(
  (book) =>
    (book.submissions as SubmissionSeed[]).map((s) => ({
      id: s.id,
      productId: book.productId,
      bookingIds: s.bookingIds,
      submittedAt: stampFromDaysAgo(s.daysAgo, s.id),
      submittedBy: ORDER_ACTOR,
      status: s.status as OrderSubmission["status"],
      backendRef: s.backendRef,
      // A submission that has answered settled the day it was sent; one still
      // processing has no settlement date to show, which is what the "กำลัง
      // ดำเนินการ" row on the book reads off.
      settledAt: s.status === "processing" ? null : stampFromDaysAgo(s.daysAgo, `${s.id}-settled`),
    })),
);

export const seedRequirementRequests: RequirementRequest[] =
  orderBooksRaw.requirementRequests.map((r) => ({
    id: r.id,
    clientId: r.clientId,
    clientName: nameById[r.clientId] ?? r.clientId,
    productId: r.productId,
    keys: r.keys as RequirementKey[],
    sentAt: stampFromDaysAgo(r.daysAgo, r.id),
    sentBy: ORDER_ACTOR,
    status: r.status as RequirementRequest["status"],
    completedAt: null,
  }));

/**
 * Per-client declaration status, keyed by client id.
 *
 * Only the *stored* requirements are here — `wealth` and `acknowledge`. `kyc`
 * and `risk-profile` are derived from data the app already has (the KYC record
 * and the client's risk rating), and duplicating them into this file is how the
 * two would start disagreeing.
 */
export const mockClientRequirements: Record<
  string,
  Partial<Record<RequirementKey, RequirementStatus>>
> = Object.fromEntries(
  orderRequirementsRaw.map(({ clientId, ...statuses }) => [
    clientId,
    statuses as Partial<Record<RequirementKey, RequirementStatus>>,
  ]),
);
