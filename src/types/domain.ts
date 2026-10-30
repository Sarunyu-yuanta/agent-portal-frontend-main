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
import type { NotificationZone } from "@/app/(dashboard)/notification-zones";

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
 * A product put in front of a client, before any booking exists.
 *
 * The first step of the flow and the only one with no money in it: the IC
 * sends the offer, and the client decides. There are exactly two ways out —
 * they book (the booking is the answer, and the offer stops being the thing
 * being tracked), or they say no (`declined`).
 *
 * Separate from `RequirementRequest`, which is also "sent to a client and
 * waiting": that one chases documents the client is missing and says nothing
 * about whether they want the product.
 */
export type ProductOffer = {
  id: string;
  productId: string;
  clientId: string;
  clientName: string;
  sentAt: string;
  sentBy: string;
  status: "sent" | "declined";
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
 * Which step a basket product is at, in order. Drives what the book page
 * offers the IC; on the lists a book reads only as open or closed
 * (`bookAvailability` in `orders/order-book.ts`):
 *
 * 1. `collecting` — ยืนยันการจองซื้อ: bookings coming in, target not met.
 * 2. `ready` — ครบยอด: target met; the IC can send. There is no funds step
 *    between the two — every booking was funded to be placed at all.
 * 3. `processing` — ยืนยันรับคำสั่งซื้อ: sent, the back office confirming.
 * 4. `completed` — รับคำสั่งซื้อสำเร็จ.
 * 5. `rejected` — ยกเลิก.
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
   * Offers still waiting on the client, plus the ones they declined — the step
   * before a booking exists. An offer whose client has since booked this
   * product is dropped: the booking is the answer to it.
   */
  offers: ProductOffer[];
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

// ── Client transactions ──────────────────────────────────────────────────────
//
// Listed products a client trades themselves — stock, TFEX, mutual funds.
// Nothing is booked for these; Order Management lists the trades as they came
// through each platform.

export type TransactionAsset = "stock" | "tfex" | "mutual-fund";

/** `switch` is a mutual fund's สับเปลี่ยน; stock and TFEX only buy and sell. */
export type TransactionSide = "buy" | "sell" | "switch";

export type TransactionStatus = "matched" | "partial" | "pending" | "cancelled";

export type ClientTransaction = {
  id: string;
  /** ISO timestamp the order was placed. */
  at: string;
  clientId: string;
  clientName: string;
  asset: TransactionAsset;
  symbol: string;
  name: string;
  side: TransactionSide;
  /** Shares, contracts or fund units. */
  quantity: number;
  /** Per share / point / NAV, in `currency`. */
  price: number;
  /** What the trade is worth, in `currency` — for TFEX, the contract value. */
  amount: number;
  currency: string;
  /** The platform the client placed it through. */
  channel: string;
  status: TransactionStatus;
};

// ── Promotions & events ──────────────────────────────────────────────────────
//
// What the firm puts in front of an IC to take *out* to clients: a promotion
// with terms and approved artwork, or a seminar with seats to fill. Both are
// one record — a `Campaign` — because the IC's job is the same shape either
// way (find who qualifies, then share or register them), and the list page
// shows them side by side. `app/(dashboard)/promotions` holds the logic.

export type CampaignType = "promotion" | "event";

/**
 * Where a campaign stands against today, derived rather than stored.
 *
 * Stored status would go stale the moment the fixtures outlive the demo —
 * every date here is stamped relative to today (see `lib/campaign-mock-data`),
 * so the status has to be computed from them. See `campaignStatus` in
 * `app/(dashboard)/promotions/campaign-data`.
 */
export type CampaignStatus = "upcoming" | "active" | "ended";

/** How a seminar is attended. Promotions carry no format. */
export type CampaignFormat = "online" | "onsite";

/**
 * Which desk's products a campaign is about — the same axis the Product
 * Catalog's tabs use, narrowed to what a campaign is ever run on.
 */
export type CampaignProduct =
  | "stock"
  | "mutual-fund"
  | "global"
  | "fcn"
  | "bond";

/**
 * Who a campaign is for, in terms the client data can actually answer.
 *
 * Each one resolves against a field already on the client record rather than a
 * marketing list that exists nowhere: the wealth tiers come from `tier`, the
 * three risk segments from `riskProfile`, and `idle-cash` from `cashIdlePct`.
 * That is what lets "ลูกค้าที่เข้าเงื่อนไข" be a real list instead of one
 * someone typed — see `segmentsOfClient` in `lib/campaign-mock-data`, which a
 * campaign's eligible-clients table reads to say *why* a client qualifies.
 */
export type ClientSegment =
  | "uhnw"
  | "hnw"
  | "aggressive"
  | "moderate"
  | "conservative"
  | "idle-cash";

export type CampaignMaterialType = "line-image" | "pdf" | "script";

/**
 * One piece of artwork or copy an IC may send a client.
 *
 * `approved` is the gate the whole surface turns on: compliance signs off a
 * *version*, so an unapproved row still renders (the IC can see it exists and
 * is coming) but cannot be copied, downloaded or shared. See `shareMaterial`
 * in `contexts/campaigns-context`, which refuses one.
 */
export type CampaignMaterial = {
  id: string;
  type: CampaignMaterialType;
  /** Shown to the IC — "ภาพสำหรับ LINE", "สคริปต์สนทนา". */
  label: string;
  /** Mock asset path, or the script's own text for `type: "script"`. */
  url: string;
  /** Compliance's version stamp, e.g. "v2.1". */
  version: string;
  approved: boolean;
  /** Why it cannot be shared yet, when `approved` is false. */
  pendingReason?: string;
};

/** One session on an event's agenda. */
export type CampaignAgendaItem = {
  /** "09:00 - 09:30" */
  time: string;
  title: string;
  speaker?: string;
};

export type CampaignSpeaker = {
  name: string;
  title: string;
  /** Headshot path; falls back to initials when absent. */
  photo?: string;
};

/**
 * A promotion or an event, as every promotions surface reads it.
 *
 * The event-only fields are optional rather than split into a second type: the
 * list page sorts, filters and counts both kinds in one pass, and a union would
 * mean narrowing at every one of those sites to reach fields the card only
 * renders when present.
 */
export type Campaign = {
  id: string;
  type: CampaignType;
  title: string;
  /** One-line pitch under the title on the card and the detail banner. */
  summary: string;
  /**
   * The long form, one string per paragraph — what the detail page's
   * "รายละเอียดแคมเปญ" section is for.
   *
   * Separate from {@link Campaign.summary} because the two are read in
   * different places for different reasons: the summary is scanned on a card
   * beside nine others, this is read once the IC has already decided to open
   * it. They were the same field for a while, which made that section a
   * verbatim repeat of the line in the banner directly above it.
   */
  description: string[];
  cover: string;
  /** Carried by the list page's hero carousel. At most three are set. */
  featured: boolean;
  products: CampaignProduct[];
  segments: ClientSegment[];
  /**
   * ISO day, `YYYY-MM-DD` — or `null` when the firm published no window.
   *
   * Null is not "missing data": a good share of what marketing puts out runs
   * until it is pulled (a fee schedule, a standing referral bonus), and the
   * public site prints no dates on those at all. Modelling that as a far-future
   * `endDate` would be a date nobody wrote, and the card would count down to
   * it. The two are always null *together* — a half-stated window is not a
   * state the firm publishes — and every derivation treats the pair as the
   * single fact "no window", which reads as "ไม่ระบุช่วงเวลา" and as a campaign
   * that is simply running. See `campaignStatus` in `promotions/campaign-data`.
   *
   * An event always carries both: a seminar with no date is not a seminar.
   */
  startDate: string | null;
  /** ISO day. For an event this is the last day registration is open. */
  endDate: string | null;
  /** ISO day — events only. */
  eventDate?: string;
  format?: CampaignFormat;
  /** Venue name (onsite) or platform (online). */
  venue?: string;
  /** Join link, online events only. */
  joinUrl?: string;
  seatsTotal?: number;
  /**
   * Seats left *before* this IC's own registrations.
   *
   * The live figure subtracts the RSVPs held in `CampaignsProvider`, so that
   * registering a client moves the number on screen without the fixture having
   * to be rewritten. See `seatsLeft` in `campaign-data`.
   */
  seatsLeftSeed?: number;
  agenda?: CampaignAgendaItem[];
  speakers?: CampaignSpeaker[];
  /** What a client has to do or be to qualify — one line per condition. */
  conditions: string[];
  /** The full terms, long-form. */
  terms: string[];
  disclaimer: string;
  materials: CampaignMaterial[];
};

/**
 * How far one client has got with one campaign.
 *
 * `eligible` is stored rather than derived because a client can be excluded for
 * a reason the segment rules cannot see — an existing holding, a suitability
 * block — and `ineligibleReason` is what the disabled table row prints. The
 * segment match decides the *default*; see `campaignClientRows` in
 * `campaign-data`.
 */
export type CampaignClientStatus =
  | "not-sent"
  | "sent"
  | "interested"
  | "redeemed";

export type CampaignClient = {
  campaignId: string;
  clientId: string;
  eligible: boolean;
  ineligibleReason?: string;
  status: CampaignClientStatus;
  updatedAt: string;
};

/** Where one client stands on one event. */
export type RsvpStatus = "registered" | "confirmed" | "attended" | "no-show";

export type CampaignRsvp = {
  campaignId: string;
  clientId: string;
  status: RsvpStatus;
  updatedAt: string;
};

/**
 * One approved material sent to one client — the compliance record.
 *
 * Append-only: a share is a thing that happened, so nothing here is ever edited
 * or removed, and the per-client status on {@link CampaignClient} is derived
 * alongside rather than instead of this. `materialId` is required because
 * "which version went out" is the question the log exists to answer.
 */
export type ShareLog = {
  id: string;
  campaignId: string;
  clientId: string;
  materialId: string;
  /** Version as it stood when it was sent — the material may be revised later. */
  materialVersion: string;
  sentBy: string;
  sentAt: string;
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

// ── Risk & compliance alerts ─────────────────────────────────────────────────
//
// What the firm's margin, AML and surveillance systems raise against the book,
// merged into one list an IC works through each morning.
//
// Distinct from two things it sits beside. A KYC expiry is a *record* lapsing
// on a schedule everyone can see coming; a reminder is something a person wrote
// down. Every row here is a rule that fired on its own, against behaviour
// nobody planned.

/** The four filter tabs. Derived from {@link RiskAlertKind}, never authored. */
export type RiskAlertCategory = "margin" | "aml" | "suitability" | "conduct";

/**
 * What actually fired. {@link RiskAlertCategory} is the axis the list filters
 * on; this is the axis the copy, the icon and the available actions turn on.
 *
 * Deliberately has no KYC member. KYC expiry already has its own Command Center
 * card (`KycAlertsPanel`), its own bell feed, its own card on a client's
 * profile and its own table on `/compliance` — all four from one piece of
 * arithmetic (`kycExpiry`). A fifth surface for it would be the same countdown
 * derived a fifth way. The absence of the member is the enforcement.
 *
 * `suitability-expired` is not that: it is the *Suitability test*, a different
 * form on a different cadence whose lapse blocks high-risk orders rather than
 * all of them.
 */
export type RiskAlertKind =
  // margin / credit
  | "margin-call"
  | "force-sell"
  | "settlement-overdue"
  | "credit-limit"
  // AML / บัญชีม้า
  | "unusual-flow"
  | "third-party-transfer"
  | "dormant-reactivated"
  | "shared-device"
  | "sanctions-pep"
  // suitability
  | "risk-profile-breach"
  | "suitability-expired"
  | "concentration"
  // market conduct / surveillance
  | "cash-balance-stock"
  | "wash-trade"
  | "price-band";

/**
 * Three levels, not the two `ComplianceType` carries.
 *
 * Two is right for a page that only lists things already blocking something.
 * This list also carries findings that are *not yet* a problem — a dormant
 * account that woke up, a Suitability test with a fortnight left — and calling
 * those "warning" beside a live margin call makes the word mean nothing.
 *
 * Three is also the scale every other ranking in this app already uses: KYC
 * `High|Medium|Low`, NBA `HIGH|MEDIUM|LOW`.
 */
export type RiskSeverity = "critical" | "warning" | "watch";

/**
 * One figure behind the finding.
 *
 * An alert carries both these and {@link RiskAlert.message} on purpose. Prose
 * cannot be right-aligned, coloured, or set against its own threshold, and an
 * IC reading "อัตราหลักประกันต่ำกว่าเกณฑ์" still has to ask how far below.
 * Figures alone make the IC supply the rule. `RequirementItem` splits the same
 * way, into a `status` and a `detail`.
 */
export type RiskMetric = {
  /** Thai, short enough for a two-column key/value row. */
  label: string;
  /** Display-ready. Units are not uniform — %, ฿, counts, device ids. */
  value: string;
  /**
   * The raw THB figure when the metric is money, `null` otherwise.
   *
   * Authored as a number and formatted into {@link RiskMetric.value} at import
   * (`formatThbWhole`), so the string and the figure cannot disagree — the
   * problem `fillKycPlaceholders` exists to solve, applied to amounts.
   */
  amountThb: number | null;
  /** Drawn large. The one or two figures the row's headline is about. */
  emphasis: boolean;
};

/**
 * One finding, as every risk surface reads it.
 *
 * What is deliberately *not* here:
 *
 * - **A status.** `open`/`acknowledged` is what *this IC* has done, not what
 *   the surveillance system found, and it is held in preferences
 *   (`RISK_ACK_IDS_PREF`) rather than on the record. When a backend owns
 *   acknowledgement — with a who and a when, for the audit log — `status` moves
 *   here and `useRiskAlertRows` is the one file that changes.
 * - **An actions list.** The three actions are the same on every row (ติดต่อ
 *   ลูกค้า / ดูโปรไฟล์ / รับทราบ); what varies is whether each *applies*, which
 *   `clientId`, `contactAllowed` and `dismissible` already answer.
 *   `compliance-alerts.json` carries `action1`/`action2` as per-row label
 *   strings that nothing implements, and that is the shape not to repeat.
 * - **An href.** A backend would not send one; the detail panel composes
 *   `/client/${clientId}` itself.
 */
export type RiskAlert = {
  id: string;
  kind: RiskAlertKind;
  /** Derived from {@link RiskAlert.kind} — see `RISK_CATEGORY_OF_KIND`. */
  category: RiskAlertCategory;
  severity: RiskSeverity;

  /**
   * The rule that fired — "MR-02", "AML-07".
   *
   * A compliance alert that cannot say which rule produced it is an opinion,
   * and this is the join key to a real surveillance engine.
   */
  ruleCode: string;

  /** Thai, one line. Never contains a client name — see `clientName`. */
  title: string;
  /**
   * Thai, 1–2 sentences: the finding in words.
   *
   * Two authoring rules, both learned from `fillKycPlaceholders`:
   * 1. **No client names.** Privacy mode masks `clientName`; a name spelled
   *    into prose walks straight past it.
   * 2. **No countdowns.** It may state the window the rule *measured* ("8 ครั้ง
   *    ภายใน 5 วันทำการ") — a frozen fact about the finding — but never how long
   *    is left, which is a function of today and lives in `daysLeft`.
   */
  message: string;
  /** 2–4 figures. Empty is legal; a rule with no number is still a rule. */
  metrics: RiskMetric[];
  /** Thai, one line: what the IC does next about this particular finding. */
  recommendedAction: string;

  /**
   * `null` on a finding not yet attributed to a client — the sanctions screen
   * that matched a name before anyone could confirm whose it was.
   * `compliance-alerts.json` already models this case and the model keeps it.
   * Gates both "ติดต่อลูกค้า" and "ดูโปรไฟล์ลูกค้า".
   */
  clientId: string | null;
  /** Joined from `clients.json` at import, or the authored label when
   *  `clientId` is null. Masked by the *feed*, not here. */
  clientName: string;
  /**
   * Display string, e.g. "Margin Trading a/c 11000522". `null` where the
   * finding is not about an account (a login event, a sanctions screen).
   *
   * A string because there is no account entity in this app: accounts exist
   * only as display text in `data/asset-account-details.ts` and as a single
   * `accountNo` per client in `data/client-profiles.ts`. A real backend sends
   * an account id, and this becomes a reference.
   */
  accountLabel: string | null;

  /**
   * Whether the IC may ring the client about this.
   *
   * `false` on most AML rows: asking a client where ฿12.4M of cash deposits
   * came from is tipping-off, an offence under พ.ร.บ. ปปง. The detail panel
   * drops the contact button entirely and prints {@link RiskAlert.contactNote}.
   *
   * Authored per row rather than derived from `category === "aml"`, because
   * `dormant-reactivated` is the opposite case — re-verifying identity by
   * phone, against the number already on file, *is* the control.
   */
  contactAllowed: boolean;
  /** Why not, when {@link RiskAlert.contactAllowed} is false. */
  contactNote: string | null;

  /**
   * Whether this IC may clear the row at all.
   *
   * `false` on a live margin call, a sanctions hit and a wash-trade referral:
   * those are closed by the desk or by Compliance, not by the person looking at
   * them. `compliance-alerts.json` already models it — its sanctions row's only
   * action is "Escalate to Compliance".
   */
  dismissible: boolean;

  /** ISO timestamp, stamped from a day offset and a time of day at import. */
  detectedAt: string;

  /**
   * ISO day, or `null` where the finding has no deadline.
   *
   * Null is not missing data. A margin call has a real cut-off; a mule flag
   * does not, and a far-future stand-in would be a date nobody wrote that the
   * UI would then count down to. Most rows are null, which is what forces the
   * list to rank on severity rather than on a date it often has not got.
   */
  dueDate: string | null;
  /** Derived from `dueDate` against today, negative once passed. `null` with it. */
  daysLeft: number | null;
  /** `zoneForDays(daysLeft)` — the app's one urgency axis, reused rather than
   *  re-invented. `null` when there is no deadline *or* it is past 15 days. */
  zone: NotificationZone | null;
};
