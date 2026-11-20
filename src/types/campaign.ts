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
export type CampaignProduct = "stock" | "mutual-fund" | "global" | "fcn" | "bond";

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
  "uhnw" | "hnw" | "aggressive" | "moderate" | "conservative" | "idle-cash";

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
export type CampaignClientStatus = "not-sent" | "sent" | "interested" | "redeemed";

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
