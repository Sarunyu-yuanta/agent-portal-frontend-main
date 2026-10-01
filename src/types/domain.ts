/**
 * Central domain types for the dashboard — the seam between the UI and the
 * (currently mocked) backend.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * Every type below is what a screen consumes, and each is derived from the JSON
 * in `src/data` via `@/lib/mock-data` — that JSON is the only source of data in
 * the app. When real endpoints land, point these aliases at the API response
 * types instead and the UI keeps compiling.
 *
 * There is no separate wire contract to reconcile against: the shapes here
 * *are* the contract. `docs/mock-data-inventory.md` catalogues every dataset
 * and is the reference for designing those endpoints.
 */

import type { mockClients, mockClientDetails } from "@/lib/mock-data";
import type { AssetAllocationSlice, AssetHeroSummary } from "@/components/AssetSummarySection";

/** A wealth-management client row as consumed by the UI. */
export type Client = (typeof mockClients)[number];

/** Per-client detail record (asset summary, allocations, holdings, tasks…). */
export type ClientDetail = (typeof mockClientDetails)[string];

/** One asset-class slice of a portfolio ({ label, percent, statusIcon }). */
export type { AssetAllocationSlice, AssetHeroSummary };

/** A single client's stake in one product (aggregated in the Product view). */
export type ProductHolder = {
  clientId: string;
  clientName: string;
  tier: string;
  allocationPct: number;
  amountThb: number;
};

/** One product row: an asset class aggregated across all holders. */
export type ProductRow = {
  label: string;
  statusIcon: string;
  clientCount: number;
  totalAmountThb: number;
  avgAllocationPct: number;
  holders: ProductHolder[];
};

// ── Order booking ────────────────────────────────────────────────────────────
//
// An IC books a future order for a client, product by product. Nothing is sent
// downstream until one product's book fills to its notional target, at which
// point the whole book goes out as a single order. `app/(dashboard)/orders`
// holds the logic; these are the shapes every surface in it reads.

/**
 * One thing a client must have on file before an order can be booked for them.
 *
 * These four, in this order, are what the booking form checks — the same four
 * the desk's own order screen shows. Two are *derived* from data the app
 * already carries (`kyc` from the client's KYC record, `risk-profile` from
 * their risk rating against the product's), and two are stored per client in
 * `data/order-requirements.json`. The form shows one list either way: which
 * half a row came from is this app's problem, not the IC's.
 *
 * `wealth` and `acknowledge` are two outcomes of one declaration and share an
 * action ("Open Wealth Declare"), but they fail independently — a client can
 * have declared their wealth without having acknowledged the product class —
 * so they stay two rows.
 */
export type RequirementKey = "wealth" | "acknowledge" | "kyc" | "risk-profile";

/**
 * Four ways of not passing, kept apart because each implies a different move.
 *
 * - `missing` — not on file. Send the client to go and do it.
 * - `expired` — on file but stale. Same move, different sentence.
 * - `pending` — submitted, waiting on an approver. Re-sending it would be
 *   asking the client for something they have already done.
 * - `failed` — on file, read, and does not meet the bar. Nothing the client can
 *   fill in changes it; the record itself has to change. This is what a risk
 *   rating below the product's does, and calling it `missing` would print
 *   "ยังไม่มีข้อมูล" next to the rating it just read.
 */
export type RequirementStatus =
  | "passed"
  | "pending"
  | "expired"
  | "missing"
  | "failed";

export type RequirementItem = {
  key: RequirementKey;
  /** The field label, e.g. "Wealth Status". */
  label: string;
  /**
   * A classification the client holds — "Aggressive", "NOT FOUND" — or `null`
   * where the status icon already says everything.
   *
   * Only the risk row has one. Every other row's answer is a yes or a no, and
   * a tick with the word "Yes" beside it, or a cross with "No", says one thing
   * twice; a rating says something the icon cannot. So those rows go quiet and
   * the form prints this *in place of* the icon rather than beside it — which
   * is why `value !== null` is exactly "this row shows a rating".
   */
  value: string | null;
  /** Which system the client completes it in — the request has to say where. */
  system: string;
  status: RequirementStatus;
  /**
   * Whether the client can fix this themselves by being sent to {@link system}.
   *
   * `false` on KYC, which a branch starts with the client in person — there is
   * nowhere to send them. This is what keeps such a row out of the request
   * rather than sending an instruction nobody can carry out; see
   * `requestableKeys`.
   */
  selfService: boolean;
  /** What the status alone doesn't say, e.g. "หมดอายุแล้ว 3 วัน". */
  detail: string | null;
};

export type ClientReadiness = {
  clientId: string;
  /**
   * `ready` when every item passed; `in-review` when the only thing left is
   * waiting on someone else (`pending`); `blocked` when something is genuinely
   * missing and the client has to act.
   */
  status: "ready" | "in-review" | "blocked";
  items: RequirementItem[];
  /** Everything not `passed` — what a request to the client would cover. */
  outstanding: RequirementItem[];
};

export type Booking = {
  id: string;
  productId: string;
  clientId: string;
  clientName: string;
  /** In the product's own currency, not THB — see `orderCurrency`. */
  amount: number;
  createdAt: string;
  createdBy: string;
  status: "booked" | "cancelled";
};

export type OrderSubmissionStatus = "processing" | "completed" | "rejected";

/** One book sent downstream as a single order. */
export type OrderSubmission = {
  id: string;
  productId: string;
  /** The bookings this order carried — a later booking joins the next one. */
  bookingIds: string[];
  submittedAt: string;
  submittedBy: string;
  status: OrderSubmissionStatus;
  /** The reference the downstream system hands back. */
  backendRef: string;
  /** Set once that system answers; `null` while it is still processing. */
  settledAt: string | null;
};

/** A nudge sent to a client to go and complete what they are missing. */
export type RequirementRequest = {
  id: string;
  clientId: string;
  clientName: string;
  productId: string;
  keys: RequirementKey[];
  sentAt: string;
  sentBy: string;
  status: "sent" | "completed";
  completedAt: string | null;
};

export type OrderLogAction =
  | "booking-created"
  | "booking-cancelled"
  | "requirement-sent"
  | "requirement-completed"
  | "order-submitted"
  | "order-completed"
  | "order-rejected";

/**
 * One line of a product's order history.
 *
 * Derived from the bookings, submissions and requests themselves rather than
 * written alongside them. A log authored separately is a log that can disagree
 * with what it describes — the same reasoning `mockKYCData` spells out for
 * stamping `nextReview` instead of authoring it.
 */
export type OrderLogEntry = {
  id: string;
  productId: string;
  at: string;
  actor: string;
  action: OrderLogAction;
  summary: string;
  detail: string | null;
};

/**
 * Where a product's book is in its life: filling up, full and waiting for the
 * IC to send it, or downstream.
 *
 * `completed` and `rejected` describe the *latest* submission. A book that has
 * been sent once and has fresh bookings on it since reads as `collecting`
 * again — the next order is what the IC can still act on.
 */
export type OrderBookStatus =
  | "collecting"
  | "ready"
  | "processing"
  | "completed"
  | "rejected";

export type OrderBook = {
  productId: string;
  /** How the product names itself in a list — its underlying. */
  productName: string;
  productType: string;
  /**
   * Which desk wrote the deal — "Global Structured" or "Thai Structured".
   *
   * On the book rather than derived at each call site: Order Management lists
   * both desks in one list, and a row has to say which one it came from without
   * the reader having to recognise an id prefix.
   */
  desk: string;
  currency: string;
  /** Notional that has to be filled before the order can go downstream. */
  targetAmount: number;
  /** The product's minimum ticket — the floor on a single client's booking. */
  minTicket: number;
  /** Live bookings — cancelled ones are only in `allBookings`. */
  bookings: Booking[];
  /**
   * Live bookings that no submission has carried yet.
   *
   * These, not `bookings`, are what fills the target. Once an order goes
   * downstream its bookings leave this list, so the next round starts at zero
   * instead of finding the bar already cleared by an order that is long gone.
   */
  openBookings: Booking[];
  /** Everything, cancellations included — what the log is built from. */
  allBookings: Booking[];
  /** Sum of `openBookings` — progress towards {@link OrderBook.targetAmount}. */
  bookedAmount: number;
  /** Sum of the bookings carried by submissions that came back `completed`. */
  confirmedAmount: number;
  status: OrderBookStatus;
  /** Newest first. */
  submissions: OrderSubmission[];
  /** Newest first. */
  logs: OrderLogEntry[];
};

/** A note an IC/RM writes — about any number of clients, or none (a general note). */
export type Note = {
  id: string;
  /**
   * Client ids this note is filed under. Empty means a general note.
   *
   * A list rather than a single nullable id: one conversation often covers
   * several clients, and duplicating the note per client would mean editing it
   * in several places.
   */
  clientIds: string[];
  title: string | null;
  body: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  reminderAt: string | null;
  reminderDone: boolean;
};
