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

import orderBooksRaw from "@/mocks/order-books.json";
import orderRequirementsRaw from "@/mocks/order-requirements.json";
import { mockClients } from "./mock-data";
import { getCallLogs } from "./call-log-data";
import { OTHER_DESK_CLIENT_NAMES } from "./client-profiles";
import { MOCK_CURRENT_IC } from "@/mocks/session";
import { offeredProductId } from "@/features/orders/lib/offered-products";
import { STOCK_TOP_PICK } from "@/features/catalog/stock/lib/stock-data";
import { getTopPerformers } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import type {
  Booking,
  EvidenceChannel,
  OrderEvidence,
  OrderSubmission,
  ProposalLog,
  RequirementKey,
  RequirementRequest,
  RequirementStatus,
} from "@/types/order";

/**
 * Who every booking, request and submission is attributed to.
 *
 * The same identity notes are authored as, rather than a second constant
 * holding the same string: there is one signed-in IC in this app, and two
 * names for them is how a log line and a note end up crediting different
 * people for the same afternoon.
 */
export const ORDER_ACTOR = MOCK_CURRENT_IC.name;

/**
 * Who an order names as its sender when nobody here sent it.
 *
 * The basket desks hand a full book to the back office rather than having the
 * IC submit it, so those submissions carry this instead of {@link ORDER_ACTOR}
 * — and the log, which reads `submittedBy` back as the actor, phrases its line
 * off the same comparison. Lives beside `ORDER_ACTOR` because the two are read
 * against each other, and in `lib` rather than the order store so
 * `order-book.ts` can compare without importing the provider it feeds.
 */
export const BACKOFFICE_ACTOR = "ระบบหลังบ้าน";

/**
 * Every name a booking can carry — ours, and the other desks'.
 *
 * `mockClients` is the signed-in IC's book, so it cannot name the clients whose
 * bookings share a basket with ours; see `OTHER_DESK_CLIENT_NAMES`.
 */
const nameById: Record<string, string> = {
  ...Object.fromEntries(mockClients.map((c) => [c.id, c.name])),
  ...OTHER_DESK_CLIENT_NAMES,
};

/**
 * The name a client id belongs to, or `undefined` for one nobody knows.
 *
 * Exported so a row the store writes at runtime names a client from the same
 * table the seeds do — a record whose name came from a screen's own copy of the
 * roster is a record that can disagree with every seeded row beside it.
 */
export function clientNameById(clientId: string): string | undefined {
  return nameById[clientId];
}

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
export function stampFromDaysAgo(daysAgo: number, id: string): string {
  const seed = [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const now = new Date();
  const at = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo));
  at.setUTCHours(9 + (seed % 9), seed % 60, 0, 0);
  return at.toISOString();
}

type BookingSeed = {
  id: string;
  clientId: string;
  amount: number;
  daysAgo: number;
  status?: string;
  /**
   * Whose booking it is. Omitted means the signed-in IC.
   *
   * A basket is shared across the desk, so a book holds more than one IC's
   * clients — and every figure that separates "mine" from "the deal's" is
   * unreadable in a fixture where they are always equal. A couple of seeds
   * carry another name so the distinction is visible.
   */
  createdBy?: string;
};

type SubmissionSeed = {
  id: string;
  bookingIds: string[];
  daysAgo: number;
  status: string;
  backendRef: string;
};

/**
 * The proof of instruction a seeded basket booking carries, derived from its id.
 *
 * Every basket booking needs one — see `Booking.evidence` — and sixty of them
 * hand-written into `order-books.json` would bury the bookings they belong to.
 * So this follows the same inversion the timestamps do: the id's character sum
 * picks the channel, and the file name is built from the channel, the client and
 * the booking's own date. Stable across renders, identical on the server and in
 * the browser, and spread across all three channels without a fixture edit.
 *
 * Every desk's bookings carry one — see `evidenceRequired`.
 */
const EVIDENCE_SEED: { channel: EvidenceChannel; ext: string; bytes: number }[] = [
  { channel: "call", ext: "m4a", bytes: 1_100_000 },
  { channel: "email", ext: "eml", bytes: 42_000 },
  { channel: "chat", ext: "png", bytes: 310_000 },
];

const EVIDENCE_TYPE: Record<string, string> = {
  m4a: "audio/mp4",
  eml: "message/rfc822",
  png: "image/png",
};

function evidenceFor(id: string, clientId: string, createdAt: string): OrderEvidence {
  const seed = [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const { channel, ext, bytes } = EVIDENCE_SEED[seed % EVIDENCE_SEED.length];
  const day = createdAt.slice(0, 10);
  // Every few phone bookings point at the client's Call Log instead of a
  // recording, and some carry a note — so the receipt shows each shape.
  const note = seed % 5 === 0 ? "ลูกค้ายืนยันยอดและเงื่อนไขทางโทรศัพท์แล้ว" : undefined;
  const call = getCallLogs(clientId)[0];
  if (channel === "call" && seed % 2 === 0 && call) {
    return { channel, source: "call-log", callLog: { ...call }, note, attachedAt: createdAt };
  }
  return {
    channel,
    source: "file",
    note,
    fileName: `${channel}-${clientId}-${day}.${ext}`,
    // Varied a little per booking, so the column does not read as one file
    // copied sixty times.
    fileSize: bytes + (seed % 97) * 1_024,
    fileType: EVIDENCE_TYPE[ext] ?? "",
    // The client asked before the IC booked, so the file predates the booking.
    attachedAt: createdAt,
  };
}

/** Every seeded booking, flattened — the book each belongs to is on the row. */
export const seedBookings: Booking[] = orderBooksRaw.books.flatMap((book) =>
  (book.bookings as BookingSeed[]).map((b) => {
    const createdAt = stampFromDaysAgo(b.daysAgo, b.id);
    return {
      id: b.id,
      productId: book.productId,
      clientId: b.clientId,
      clientName: nameById[b.clientId] ?? b.clientId,
      amount: b.amount,
      createdAt,
      createdBy: b.createdBy ?? ORDER_ACTOR,
      status: (b.status ?? "booked") as Booking["status"],
      evidence: evidenceFor(b.id, b.clientId, createdAt),
    };
  }),
);

/**
 * How long the back office took, counted forward from when the order was sent.
 *
 * Derived from the id for the same reason the hour of day is — stable across a
 * render and identical on the server and in the browser — but added to the
 * submission's own timestamp rather than stamped independently. Stamping it
 * independently derived its hour from a *different* id, so an order sent at
 * 17:35 could carry an answer at 09:57 the same day. Nothing displayed both at
 * once until the order detail modal did, and then it read as an order answered
 * before it was placed.
 */
function settledAfter(submittedAt: string, id: string): string {
  const seed = [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const hours = 2 + (seed % 7); // 2–8 hours, so it always lands after the send
  return new Date(new Date(submittedAt).getTime() + hours * 3_600_000).toISOString();
}

export const seedSubmissions: OrderSubmission[] = orderBooksRaw.books.flatMap((book) =>
  (book.submissions as SubmissionSeed[]).map((s) => {
    const submittedAt = stampFromDaysAgo(s.daysAgo, s.id);
    return {
      id: s.id,
      productId: book.productId,
      bookingIds: s.bookingIds,
      submittedAt,
      submittedBy: ORDER_ACTOR,
      status: s.status as OrderSubmission["status"],
      backendRef: s.backendRef,
      // One the back office has not answered has no settlement date to show,
      // which is what the in-flight rows on the book read off. `sent` as well
      // as `processing`: it has not even reached them yet.
      settledAt:
        s.status === "processing" || s.status === "sent" ? null : settledAfter(submittedAt, s.id),
    };
  }),
);

type ProposalSeed = {
  id: string;
  clientId: string;
  daysAgo: number;
};

/**
 * Every seeded proposal — one product's documents sent to one client.
 *
 * `daysAgo` against the bookings' own `daysAgo` is what the fixture is really
 * saying, because that comparison is the whole of `proposalOutcome`: a proposal
 * older than a booking by the same client converted, a newer one did not. The
 * seeds below are written to cover each answer, `_note` says which.
 */
export const seedProposals: ProposalLog[] = orderBooksRaw.books.flatMap((book) =>
  ((book.proposals ?? []) as ProposalSeed[]).map((p) => ({
    id: p.id,
    productId: book.productId,
    clientId: p.clientId,
    clientName: nameById[p.clientId] ?? p.clientId,
    sentAt: stampFromDaysAgo(p.daysAgo, p.id),
    sentBy: ORDER_ACTOR,
    // Both, always — see `ProposalLog`. Not in the seed, because a fixture that
    // could say otherwise would be describing a delivery this app cannot make.
    channels: ["app", "email"],
  })),
);

/**
 * A few Proposals on stocks and funds — products offered but never booked —
 * so Order Management's Stock and Mutual Fund tabs have a "ส่ง Proposal แล้ว"
 * to show before the IC sends one. Symbols are the catalogue's own, the same
 * lists the transaction seeds draw from.
 */
const OFFERED_SEEDS: {
  id: string;
  productId: string;
  clientIndex: number;
  daysAgo: number;
  channels: ProposalLog["channels"];
}[] = [
  {
    id: "prp-stk-01",
    productId: offeredProductId("stock", STOCK_TOP_PICK[0].symbol),
    clientIndex: 0,
    daysAgo: 0,
    channels: ["app", "line"],
  },
  {
    id: "prp-stk-02",
    productId: offeredProductId("stock", STOCK_TOP_PICK[1].symbol),
    clientIndex: 2,
    daysAgo: 1,
    channels: ["app", "email"],
  },
  {
    id: "prp-stk-03",
    productId: offeredProductId("stock", STOCK_TOP_PICK[0].symbol),
    clientIndex: 4,
    daysAgo: 3,
    channels: ["app", "voice-ai"],
  },
  {
    id: "prp-mf-01",
    productId: offeredProductId("mutual-fund", getTopPerformers("global-equity")[0].symbol),
    clientIndex: 1,
    daysAgo: 0,
    channels: ["app", "email", "line"],
  },
  {
    id: "prp-mf-02",
    productId: offeredProductId("mutual-fund", getTopPerformers("global-equity")[1].symbol),
    clientIndex: 3,
    daysAgo: 2,
    channels: ["app"],
  },
];

export const seedOfferedProposals: ProposalLog[] = OFFERED_SEEDS.flatMap((s) => {
  const client = mockClients[s.clientIndex];
  if (!client) return [];
  return [
    {
      id: s.id,
      productId: s.productId,
      clientId: client.id,
      clientName: client.name,
      sentAt: stampFromDaysAgo(s.daysAgo, s.id),
      sentBy: ORDER_ACTOR,
      channels: s.channels,
    },
  ];
});

export const seedRequirementRequests: RequirementRequest[] = orderBooksRaw.requirementRequests.map(
  (r) => ({
    id: r.id,
    clientId: r.clientId,
    clientName: nameById[r.clientId] ?? r.clientId,
    productId: r.productId,
    keys: r.keys as RequirementKey[],
    sentAt: stampFromDaysAgo(r.daysAgo, r.id),
    sentBy: ORDER_ACTOR,
    status: r.status as RequirementRequest["status"],
    completedAt: null,
  }),
);

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
