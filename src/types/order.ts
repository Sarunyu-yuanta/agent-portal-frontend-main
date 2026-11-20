// ── Order booking ────────────────────────────────────────────────────────────
//
// An IC books a future order for a client, product by product. Nothing is sent
// downstream until one product's book fills to its notional target, at which
// point the whole book goes out as a single order. `src/features/orders`
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
export type RequirementStatus = "passed" | "pending" | "expired" | "missing" | "failed";

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
  /**
   * What the status alone doesn't say ("expired 3 days ago"). A code with its
   * values, not a sentence: this is stored on the booking as a snapshot, and a
   * stored sentence would be in whatever language the IC happened to be using.
   * Rendered by `requirementDetailText`.
   */
  detail: RequirementDetail | null;
};

export type RequirementDetail =
  | { code: "declaration-expired" }
  | { code: "no-kyc" }
  | { code: "kyc-unreadable"; date: string }
  | { code: "kyc-expired-today"; date: string }
  | { code: "kyc-expired"; days: number; date: string }
  | { code: "risk-below"; required: string };

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

/** How a client asked for an order — see {@link OrderEvidence}. */
export type EvidenceChannel = "call" | "email" | "chat" | "other";

/**
 * Proof that the client asked for this order, and down which channel.
 *
 * The four checks on `ClientReadiness` say a client is *allowed* to buy. None
 * of them says this client asked to buy *this*, for *this much*, today — and on
 * the basket desks the IC places the order on their behalf, so that gap is the
 * whole of what a compliance review would ask about. A phone order picks the
 * call off the client's Call Log or attaches the recording; an emailed reply
 * attaches the mail; a chat attaches the thread; anything else is "other",
 * with whatever file proves it. Any of them may carry a note.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * **The file is not stored anywhere.** There is no upload endpoint and no
 * object store, so `placeOrder` keeps what the browser could report about the
 * file the IC chose and drops the `File` itself. The form says so rather than
 * implying the recording has been filed. When storage exists, `placeOrder` is
 * the one function it lands in.
 */
export type OrderEvidence = {
  channel: EvidenceChannel;
  /**
   * What the proof is: a file the IC attached, or a call picked off the
   * client's Call Log (phone only). Exactly one of the file fields or
   * {@link OrderEvidence.callLog} is set, matching this.
   */
  source: "file" | "call-log";
  fileName?: string;
  /** Bytes. Shown back, so a two-second mis-recording is visible as one. */
  fileSize?: number;
  /** The browser's MIME type, or `""` where it could not tell. */
  fileType?: string;
  /**
   * The call, copied as it stood when booked — not just its id. The log is a
   * record of calls and may be re-summarised later; the booking keeps what the
   * IC pointed at.
   */
  callLog?: EvidenceCall;
  /** The IC's own words about it. Optional on every channel. */
  note?: string;
  attachedAt: string;
};

/** One Call Log entry, as an {@link OrderEvidence} keeps it. */
export type EvidenceCall = {
  id: string;
  date: string;
  time: string;
  duration: string;
  direction: "inbound" | "outbound";
  summary: string;
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
  /**
   * Proof of the client's instruction — see {@link OrderEvidence}.
   *
   * Required on every desk, by the form and by `placeOrder`, which refuses a
   * draft without one (see `evidenceRequired`). Still optional on the type: a
   * booking recorded before the bond desks asked for it has none, and the
   * receipt simply leaves the block out.
   */
  evidence?: OrderEvidence;
  /**
   * Who put it through: this portal (`ic`) or the client's own app (`app`).
   *
   * Nothing in the order flow reads it — a booking is a booking either way. It
   * exists because it is the one thing that separates the two ways a
   * {@link ProposalLog} converts: the client acting on the app themselves, or
   * reading the email and phoning the IC to do it for them. Both are wins and
   * `proposalOutcome` treats them alike; splitting them is the Performance
   * report's job, and this is the field it will split on.
   *
   * Absent on seeded bookings that predate it — read as `"ic"`.
   */
  placedVia?: "ic" | "app";
  /**
   * The four checks as they stood when the booking was placed.
   *
   * A booking can only be placed with all four passed, so this is the record
   * that it was — the client's live status can move on afterwards (a KYC
   * expiring, a new acknowledgement waiting on review) without rewriting what
   * the order was booked against. Absent on seeded bookings; see
   * `checksAtBooking`.
   */
  checks?: RequirementItem[];
};

/*
 * There is no funds check on a booking.
 *
 * There used to be — `credit: "pending" | "sufficient" | "insufficient"`,
 * answered by the back office a moment after the booking was placed, which
 * gave a full book a "รอตรวจสอบวงเงิน" step and could leave one unfundable
 * booking holding a product the IC had no way to send. The amount is now
 * typed into the booking form against the client's own cash (see
 * `AmountSection` in `orders/OrderBookingModal.tsx`), and a booking that the
 * client cannot fund is never placed. Every booking that exists is funded, so
 * nothing downstream has to ask.
 */

/**
 * Where one order is, downstream.
 *
 * `sent` is the window between the order leaving here and the back office
 * taking it up, and which desk the order came from decides whether it has that
 * window at all:
 *
 * - **quota** (Fixed Income, Global Bond) — the IC creates the order, so it
 *   starts at `sent` and moves to `processing` when the back office picks it up
 *   (`BACKOFFICE_PICKUP_MS` in `contexts/orders-context`). That window is the
 *   only one in which the IC can still pull it — which is the whole of what
 *   `sent` is for. **It is not shown as a status of its own**: from the IC's
 *   side the order is downstream either way, so both read
 *   "กำลังดำเนินการรับคำสั่งซื้อ" (see `BookingPhase`), and the cancel button
 *   in `BookingDetailModal` is where the difference is said.
 * - **basket** (Thai / Global Structured) — the *back office* creates the order
 *   by collecting a full basket, so it is picked up the moment it exists and
 *   starts at `processing`. Nothing on those desks is ever `sent`.
 */
export type OrderSubmissionStatus = "sent" | "processing" | "completed" | "rejected";

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
  /** Set once that system answers; `null` while it is `sent` or `processing`. */
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
 * Which step a basket product is at, in order. Drives what the book page
 * offers the IC; on the lists a book reads only as open or closed
 * (`bookAvailability` in `orders/order-book.ts`):
 *
 * 1. `collecting` — ยืนยันการจองซื้อ: bookings coming in, target not met.
 * 2. `ready` — ครบยอด: target met, and waiting for the back office to collect
 *    it. Nobody here sends a basket order — see `BACKOFFICE_PICKUP_MS` in
 *    `contexts/orders-context`. There is no funds step between the two; every
 *    booking was funded to be placed at all.
 * 3. `processing` — ยืนยันรับคำสั่งซื้อ: collected, the back office confirming.
 * 4. `completed` — รับคำสั่งซื้อสำเร็จ.
 * 5. `rejected` — ยกเลิก.
 */
export type OrderBookStatus = "collecting" | "ready" | "processing" | "completed" | "rejected";

export type OrderBook = {
  productId: string;
  /** How the product names itself in a list — its underlying. */
  productName: string;
  productType: string;
  /**
   * Which desk wrote the deal — "Global Structured", "Thai Structured",
   * "Fixed Income" or "Global Bond".
   *
   * On the book rather than derived at each call site: a row has to say which
   * desk it came from without the reader having to recognise an id prefix.
   */
  desk: string;
  /**
   * How the desk takes bookings — see `BookingMode` in `orders/bookable-products`.
   * `basket` books fill {@link OrderBook.targetAmount} and send once; `quota`
   * books send each booking on its own until the quota is used.
   */
  mode: "basket" | "quota";
  /**
   * The underlyings' logos, copied from the product.
   *
   * Carried on the book for the same reason `currency` and `productType` are:
   * every surface that lists a book would otherwise look the product up again
   * just to draw it. Empty for the Thai desk, which has no imagery.
   */
  logos: string[];
  currency: string;
  /**
   * Basket: notional that has to be filled before the order can go downstream.
   * Quota: the product's issue quota — the most that can ever be booked.
   */
  targetAmount: number;
  /**
   * Quota books: live bookings whose order has not been rejected — what has
   * been taken out of the quota. Basket books carry it too, unused.
   */
  quotaUsed: number;
  /** `targetAmount - quotaUsed`, floored at zero. */
  quotaRemaining: number;
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
  /**
   * The open round's state whenever there is one — see `bookStatus`.
   *
   * A sent order never shows up here, however recently it went: rounds are
   * independent, and the one being filled now is what the IC can act on. Orders
   * still waiting on the back office are in {@link OrderBook.pendingOrders}.
   */
  status: OrderBookStatus;
  /**
   * Orders already sent that the back office has not answered, newest first.
   *
   * Shown beside {@link OrderBook.status} rather than folded into it. More than
   * one can be in flight: a round can be filled and sent while an earlier order
   * is still out, and neither waits for the other.
   */
  pendingOrders: OrderSubmission[];
  /** Newest first. */
  submissions: OrderSubmission[];
  /** Newest first. */
  logs: OrderLogEntry[];
};

/**
 * Where a proposal was delivered. `app` (YSInvest) on every send; the rest are
 * the IC's choice per send — see `orders/proposal-channels`.
 */
export type ProposalChannel = "app" | "email" | "line" | "voice-ai";

/**
 * One product's documents, sent to one client — an offer, and the record of it.
 *
 * The IC used to download the presentation and send it however they liked, so
 * an offer left no trace and nothing about it could be counted. This is that
 * send, made into an event: who it went to, when, and down which channels.
 *
 * **Append-only**, for the same reason {@link ShareLog} is: a send is a thing
 * that happened. A second proposal on the same product to the same client is a
 * second row — a re-pitch is not an edit of the first one.
 *
 * **The outcome is not here.** Whether an offer converted is read off the
 * bookings (`proposalOutcome` in `orders/order-proposals`), because a stored
 * verdict is a verdict that can disagree with the bookings it describes — the
 * same bargain {@link OrderLogEntry} strikes.
 */
export type ProposalLog = {
  id: string;
  productId: string;
  clientId: string;
  clientName: string;
  sentAt: string;
  sentBy: string;
  /**
   * Where it was delivered.
   *
   * Always includes `app` (YSInvest); email, LINE and Voice AI are added per
   * send by the IC. Stored as a list because which one the client acted
   * through is half of how the Performance report will read this (the other
   * half being {@link Booking.placedVia}).
   */
  channels: ProposalChannel[];
};
