"use client";

/**
 * Everything the Promotions surfaces derive rather than store.
 *
 * Kept out of the components for the reason `dashboard-data` is: a campaign's
 * status, its countdown and its eligible-client count are each read by more
 * than one surface — the card, the KPI strip, the right rail's "ใกล้หมดเขต"
 * list, the detail header — and two of them disagreeing is exactly the class of
 * bug this file exists to make unauthorable. The card's "เหลือ 3 วัน" and the
 * rail's ordering come from one function.
 *
 * Nothing here reaches into state. These take the campaign (and, where
 * relevant, the clients or the store's rows) and return a derivation, so they
 * stay testable and the components stay about layout.
 */

import type {
  Campaign,
  CampaignClient,
  CampaignClientStatus,
  CampaignFormat,
  CampaignProduct,
  CampaignRsvp,
  CampaignStatus,
  CampaignType,
  Client,
  ClientSegment,
  RsvpStatus,
} from "@/types/domain";

// ── Dates and status ────────────────────────────────────────────────────────

/**
 * An ISO day (`2026-10-12`) as a local midnight `Date`.
 *
 * Deliberately **not** `dayFromKey` from `calendar-grid`, which looks like it
 * would do: that one reads the month the way `dayKey` writes it — zero-based,
 * straight off `getMonth()` — so feeding it an ISO day puts every campaign a
 * month early. Its own doc warns about the mirror image of this mistake. The
 * two string formats are not interchangeable, so keep them apart.
 *
 * Also not `new Date(iso)`, which parses as UTC and lands a Bangkok morning on
 * the day before.
 */
export function dayFromIso(isoDay: string): Date {
  const [year, month, day] = isoDay.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Whole days from today to an ISO day. Negative once the day is past. */
export function daysUntil(isoDay: string, today: Date): number {
  const target = dayFromIso(isoDay);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Where a campaign stands today.
 *
 * The window is inclusive at both ends: a campaign ending today is still one
 * the IC can act on this afternoon, and calling it "หมดเขต" at midnight of its
 * own last day would be wrong by a working day.
 *
 * A campaign with no window is "active" — see {@link Campaign.startDate}. It
 * has been published and nothing has closed it, which is the whole of what the
 * other two states are about; "upcoming" and "ended" are both claims about a
 * date, and there is none to make them from.
 */
export function campaignStatus(campaign: Campaign, today: Date): CampaignStatus {
  if (campaign.startDate === null) return "active";
  if (daysUntil(campaign.startDate, today) > 0) return "upcoming";
  if (campaign.endDate !== null && daysUntil(campaign.endDate, today) < 0) {
    return "ended";
  }
  return "active";
}

/**
 * Days left to act. Negative for an ended campaign, so callers can clamp.
 *
 * `null` when there is no closing date — distinct from a large number, because
 * "runs until pulled" is not "runs for a long time", and the callers that print
 * a countdown have nothing to print.
 */
export function daysLeft(campaign: Campaign, today: Date): number | null {
  return campaign.endDate === null ? null : daysUntil(campaign.endDate, today);
}

/** The threshold the countdown badge and the "ใกล้หมดเขต" rail both use. */
export const ENDING_SOON_DAYS = 7;

/** Active, and inside {@link ENDING_SOON_DAYS} of closing. */
export function isEndingSoon(campaign: Campaign, today: Date): boolean {
  const left = daysLeft(campaign, today);
  // Nothing to run out of, so never soon — see {@link daysLeft}.
  if (left === null) return false;
  return (
    campaignStatus(campaign, today) === "active" &&
    left >= 0 &&
    left <= ENDING_SOON_DAYS
  );
}

/** How long after opening a campaign still wears the "ใหม่" tag. */
export const NEW_DAYS = 7;

/**
 * Opened within {@link NEW_DAYS} and still running.
 *
 * Keyed on `startDate` because a campaign carries no publish date of its own;
 * when the backend sends one, this is the line to change. An upcoming campaign
 * is not "new" — it has "เร็ว ๆ นี้" for that, and a campaign with no window
 * has no opening day to be within seven of.
 */
export function isNewCampaign(campaign: Campaign, today: Date): boolean {
  if (campaign.startDate === null) return false;
  return (
    campaignStatus(campaign, today) === "active" &&
    daysUntil(campaign.startDate, today) >= -NEW_DAYS
  );
}

/** An event already held — the only state in which attendance can be marked. */
export function isPastEvent(campaign: Campaign, today: Date): boolean {
  return (
    campaign.type === "event" &&
    campaign.eventDate !== undefined &&
    daysUntil(campaign.eventDate, today) < 0
  );
}

/**
 * Where an event stands for booking, as the event tab's chips filter it.
 *
 * Held apart from {@link CampaignFilters}: the seat count lives in the
 * campaigns store, not on the `Campaign`, so this is applied by the page after
 * `filterCampaigns` rather than inside it. A past event is "past" whatever its
 * seats say — a full room last week is not something to wait on.
 */
export type SeatState = "available" | "full" | "past";

export const SEAT_STATES: SeatState[] = ["available", "full", "past"];

export const SEAT_STATE_LABEL: Record<SeatState, string> = {
  available: "ยังไม่เต็ม",
  full: "เต็มแล้ว",
  past: "ผ่านไปแล้ว",
};

export function seatState(
  campaign: Campaign,
  today: Date,
  seatsLeft: number | null,
): SeatState {
  if (isPastEvent(campaign, today)) return "past";
  return seatsLeft === 0 ? "full" : "available";
}

// ── Eligibility ─────────────────────────────────────────────────────────────

/**
 * One row per client the campaign concerns, joined to the client record and
 * ordered so the IC's remaining work is at the top.
 *
 * Ineligible rows stay in the list rather than being filtered out: the spec's
 * disabled-row-plus-reason is the point — an IC who can't see why a client is
 * missing will ask, and the answer belongs on screen.
 */
export type CampaignClientRow = {
  client: Client;
  eligible: boolean;
  ineligibleReason?: string;
  status: CampaignClientStatus;
  updatedAt: string;
  /** Present only on events. */
  rsvp?: RsvpStatus;
};

/** Eligible-and-untouched first, then the rest of the eligible, then blocked. */
const STATUS_ORDER: Record<CampaignClientStatus, number> = {
  "not-sent": 0,
  sent: 1,
  interested: 2,
  redeemed: 3,
};

export function campaignClientRows(
  campaign: Campaign,
  rows: CampaignClient[],
  rsvps: CampaignRsvp[],
  clients: Client[],
): CampaignClientRow[] {
  const byId = new Map(clients.map((c) => [c.id, c]));
  const rsvpById = new Map(
    rsvps
      .filter((r) => r.campaignId === campaign.id)
      .map((r) => [r.clientId, r.status]),
  );

  return rows
    .filter((row) => row.campaignId === campaign.id)
    .flatMap((row) => {
      const client = byId.get(row.clientId);
      if (!client) return [];
      return [
        {
          client,
          eligible: row.eligible,
          ineligibleReason: row.ineligibleReason,
          status: row.status,
          updatedAt: row.updatedAt,
          rsvp: rsvpById.get(row.clientId),
        },
      ];
    })
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (byStatus !== 0) return byStatus;
      return a.client.name.localeCompare(b.client.name);
    });
}

// ── Filtering and ordering the list ─────────────────────────────────────────

/**
 * The list is split by type, with no combined view.
 *
 * A promotion and an event are not two flavours of one thing on this page —
 * they carry different facts (a seminar has a venue, seats and a registration
 * state; a promotion has none of the three) and the card that renders them
 * leaves visible gaps where the other kind's rows would be. Shown in one grid
 * they read as broken records rather than as two kinds of campaign, so there
 * is no "ทั้งหมด": a tab is always exactly one type.
 */
export type CampaignTab = CampaignType;

export type CampaignFilters = {
  product: CampaignProduct | null;
  status: CampaignStatus | null;
  segment: ClientSegment | null;
  format: CampaignFormat | null;
  search: string;
};

export function hasActiveFilters(filters: CampaignFilters): boolean {
  return (
    filters.product !== null ||
    filters.status !== null ||
    filters.segment !== null ||
    filters.format !== null ||
    filters.search.trim() !== ""
  );
}

export function filterCampaigns(
  campaigns: Campaign[],
  {
    tab,
    filters,
    today,
  }: {
    tab: CampaignTab;
    filters: CampaignFilters;
    today: Date;
  },
): Campaign[] {
  const needle = filters.search.trim().toLowerCase();
  return campaigns.filter((campaign) => {
    // The tab *is* the type — see `CampaignTab`.
    if (campaign.type !== tab) return false;
    if (filters.product && !campaign.products.includes(filters.product)) {
      return false;
    }
    if (filters.status && campaignStatus(campaign, today) !== filters.status) {
      return false;
    }
    if (filters.segment && !campaign.segments.includes(filters.segment)) {
      return false;
    }
    // A promotion has no format, so filtering by one excludes every promotion
    // rather than letting them through on a field they don't have.
    if (filters.format && campaign.format !== filters.format) return false;
    if (needle) {
      const haystack = `${campaign.title} ${campaign.summary}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

/**
 * Default order: ending soonest first.
 *
 * Ended campaigns sink to the bottom whatever their dates say — they are
 * reference, not work — and within each group the nearer deadline leads. An
 * upcoming campaign sorts by when it *closes* like everything else, so the
 * question the order answers stays "what runs out first".
 *
 * A campaign with no closing date answers that question with "it doesn't", so
 * it sits below every dated one but above the ended block: there is no deadline
 * to beat, and nothing is lost by reaching it last.
 */
export function sortByEndingSoonest(
  campaigns: Campaign[],
  today: Date,
): Campaign[] {
  return [...campaigns].sort((a, b) => {
    const aEnded = campaignStatus(a, today) === "ended";
    const bEnded = campaignStatus(b, today) === "ended";
    if (aEnded !== bEnded) return aEnded ? 1 : -1;
    if ((a.endDate === null) !== (b.endDate === null)) {
      return a.endDate === null ? 1 : -1;
    }
    if (a.endDate !== null && b.endDate !== null) {
      const byDate = a.endDate.localeCompare(b.endDate);
      if (byDate !== 0) return byDate;
    }
    return a.title.localeCompare(b.title);
  });
}

// ── Labels ──────────────────────────────────────────────────────────────────

export const PRODUCT_LABEL: Record<CampaignProduct, string> = {
  stock: "หุ้น",
  "mutual-fund": "กองทุน",
  global: "Global",
  fcn: "FCN",
  bond: "Bond",
};

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  upcoming: "เร็ว ๆ นี้",
  active: "กำลังดำเนินการ",
  ended: "หมดเขต",
};

export const SEGMENT_LABEL: Record<ClientSegment, string> = {
  uhnw: "UHNW",
  hnw: "HNW",
  aggressive: "รับความเสี่ยงสูง",
  moderate: "รับความเสี่ยงปานกลาง",
  conservative: "รับความเสี่ยงต่ำ",
  "idle-cash": "มีเงินสดคงค้าง",
};

export const FORMAT_LABEL: Record<CampaignFormat, string> = {
  online: "Online",
  onsite: "Onsite",
};

export const TYPE_LABEL: Record<CampaignType, string> = {
  promotion: "โปรโมชัน",
  event: "สัมมนา/อีเว้นท์",
};

export const CLIENT_STATUS_LABEL: Record<CampaignClientStatus, string> = {
  "not-sent": "ยังไม่ส่ง",
  sent: "ส่งแล้ว",
  interested: "สนใจ",
  redeemed: "ใช้สิทธิ์แล้ว",
};

export const RSVP_LABEL: Record<RsvpStatus, string> = {
  registered: "ลงทะเบียน",
  confirmed: "ยืนยัน",
  attended: "เข้าร่วม",
  "no-show": "ไม่มา",
};

/** "12 ต.ค. 2569" — Buddhist era, matching every other date in the app. */
export function thaiDay(isoDay: string): string {
  return dayFromIso(isoDay).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** What a card and the detail header print where a date range would go. */
export const NO_PERIOD_LABEL = "ไม่ระบุช่วงเวลา";

/**
 * The one date line a card shows.
 *
 * An event is defined by the day it happens; a promotion by the window it is
 * open. Printing both for an event would put the registration deadline next to
 * the event date with nothing to tell them apart.
 *
 * A promotion with no window says so in words rather than rendering an empty
 * row: the dash the row would otherwise collapse to reads as a layout fault,
 * and the IC's question — "how long have I got?" — still has an answer.
 */
export function campaignDateLine(campaign: Campaign): string {
  if (campaign.type === "event" && campaign.eventDate) {
    return thaiDay(campaign.eventDate);
  }
  if (campaign.startDate === null || campaign.endDate === null) {
    return NO_PERIOD_LABEL;
  }
  return `${thaiDay(campaign.startDate)} – ${thaiDay(campaign.endDate)}`;
}

/** "เหลือ 3 วัน" / "วันสุดท้าย" — only meaningful while a campaign is open. */
export function countdownLabel(campaign: Campaign, today: Date): string | null {
  if (!isEndingSoon(campaign, today)) return null;
  const left = daysLeft(campaign, today);
  if (left === null) return null;
  return left === 0 ? "วันสุดท้าย" : `เหลือ ${left} วัน`;
}
