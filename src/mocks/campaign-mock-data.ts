/**
 * Promotions and events, with every date stamped from today.
 *
 * `campaigns.json` carries **day offsets** (`startOffset`, `endOffset`,
 * `eventOffset`) rather than literal dates, and this turns them into the
 * `startDate` / `endDate` / `eventDate` every consumer reads. Same reason
 * `mockKYCData` inverts the relationship for KYC reviews:
 *
 * 1. Authored dates rot. A fixture written as "ends 2026-10-20" is an expired
 *    campaign by November, and the whole surface — the countdown badge, the
 *    "โปรที่ใช้ได้" count, the greyed-out "หมดเขต" card — stops demonstrating
 *    anything but the ended state.
 * 2. The states only exist if some campaign is actually sitting in each one.
 *    The spread in the JSON keeps one promotion ending inside seven days, one
 *    not yet open, one closed, one event full and one already held — next month
 *    as much as today.
 *
 * Only the mock inverts it. `startDate` / `endDate` stay the fields of record,
 * so `campaign-data`'s arithmetic behaves exactly as it will against a backend
 * that returns dates.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * The seeds below are the *starting* state. Everything the IC then does —
 * sharing, registering, marking attendance — is held in
 * `contexts/campaigns-context`, which is where the endpoints go.
 */

import campaignsRaw from "@/mocks/campaigns.json";
import { mockClients } from "./mock-data";
import { MOCK_CURRENT_IC } from "@/mocks/session";
import type {
  Campaign,
  CampaignClient,
  CampaignClientStatus,
  CampaignFormat,
  CampaignMaterial,
  CampaignMaterialType,
  CampaignProduct,
  CampaignRsvp,
  CampaignType,
  ClientSegment,
  RsvpStatus,
  ShareLog,
} from "@/types/campaign";

/** Whoever is signed in — the `sentBy` on every ShareLog this session writes. */
export const CAMPAIGN_ACTOR = MOCK_CURRENT_IC.name;

type RawCampaign = (typeof campaignsRaw)[number];
type RawClientRow = RawCampaign["clients"][number];

/**
 * The event-only fields, read as optionals.
 *
 * `resolveJsonModule` collapses the fixtures into one element type whose
 * event-only keys are optional, so `"eventOffset" in raw` narrows nothing and
 * the value still arrives as `number | undefined`. Naming the optional shape
 * once is clearer than an assertion at each of the eight sites.
 */
type RawEventFields = {
  /**
   * Absent on a campaign the firm published with no window — see
   * {@link Campaign.startDate}. Read through the same optional shape as the
   * event-only keys for the same `resolveJsonModule` reason.
   */
  startOffset?: number;
  endOffset?: number;
  eventOffset?: number;
  format?: string;
  venue?: string;
  joinUrl?: string;
  seatsTotal?: number;
  seatsLeftSeed?: number;
  agenda?: { time: string; title: string; speaker?: string }[];
  speakers?: { name: string; title: string; photo?: string }[];
};

/**
 * An offset in days turned into an ISO day — `null` when there is no offset.
 *
 * Local midnight, not UTC: every comparison downstream is against the user's
 * own "today" (`dayKey` in `calendar-grid` reads local parts too), and a UTC
 * stamp would put a Bangkok afternoon on the previous day.
 *
 * The null passes straight through rather than defaulting to today: a fixture
 * that omits `startOffset` is stating that the firm published no window, and
 * substituting a date here would be this module inventing the one fact it
 * exists to keep honest.
 */
function dayFromOffset(offset: number): string;
function dayFromOffset(offset: number | undefined): string | null;
function dayFromOffset(offset: number | undefined): string | null {
  if (offset === undefined) return null;
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  const month = String(day.getMonth() + 1).padStart(2, "0");
  return `${day.getFullYear()}-${month}-${String(day.getDate()).padStart(2, "0")}`;
}

/** An offset in days turned into a timestamp, for the seeded audit rows. */
function timestampFromOffset(offset: number): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 10, 30).toISOString();
}

function materialsOf(raw: RawCampaign): CampaignMaterial[] {
  return raw.materials.map((m) => ({
    id: m.id,
    type: m.type as CampaignMaterialType,
    label: m.label,
    url: m.url,
    version: m.version,
    approved: m.approved,
    // `in` rather than `?? undefined`: only the unapproved rows carry one, and
    // the JSON type is a union across all of them.
    pendingReason: "pendingReason" in m ? m.pendingReason : undefined,
  }));
}

export const mockCampaigns: Campaign[] = campaignsRaw.map((raw) => {
  const event = raw as RawEventFields;
  return {
    id: raw.id,
    type: raw.type as CampaignType,
    title: raw.title,
    summary: raw.summary,
    description: raw.description,
    cover: raw.cover,
    featured: raw.featured,
    products: raw.products as CampaignProduct[],
    segments: raw.segments as ClientSegment[],
    startDate: dayFromOffset(event.startOffset),
    endDate: dayFromOffset(event.endOffset),
    eventDate: dayFromOffset(event.eventOffset) ?? undefined,
    format: event.format as CampaignFormat | undefined,
    venue: event.venue,
    joinUrl: event.joinUrl,
    seatsTotal: event.seatsTotal,
    seatsLeftSeed: event.seatsLeftSeed,
    agenda: event.agenda,
    speakers: event.speakers,
    conditions: raw.conditions,
    terms: raw.terms,
    disclaimer: raw.disclaimer,
    materials: materialsOf(raw),
  };
});

/**
 * Which segments a client falls into.
 *
 * Read off the client record rather than stored as a list on the client: a
 * segment is a *description* of their current state (wealth band, risk rating,
 * how much cash is sitting idle), and a stored copy would be wrong the moment
 * any of the three moved. See {@link ClientSegment} for why these six.
 */
const IDLE_CASH_PCT = 25;

export function segmentsOfClient(client: {
  tier: string;
  riskProfile: string;
  cashIdlePct: number;
}): ClientSegment[] {
  const segments: ClientSegment[] = [];
  if (client.tier === "UHNW") segments.push("uhnw");
  if (client.tier === "HNW") segments.push("hnw");
  if (client.riskProfile === "Aggressive") segments.push("aggressive");
  if (client.riskProfile === "Moderate") segments.push("moderate");
  if (client.riskProfile === "Conservative") segments.push("conservative");
  if (client.cashIdlePct >= IDLE_CASH_PCT) segments.push("idle-cash");
  return segments;
}

/**
 * The per-client rows a campaign starts with.
 *
 * Eligibility is the segment match by default — that is the rule the firm sets
 * the campaign up with. A JSON row may override it to `false` with a reason,
 * which is how a client who *looks* eligible on paper but is blocked for a
 * reason the segments can't see (suitability, an existing holding) ends up as a
 * disabled row with the reason printed, rather than silently missing.
 */
function seedRowsFor(raw: RawCampaign): CampaignClient[] {
  const campaignSegments = raw.segments as ClientSegment[];
  const authored = new Map<string, RawClientRow>(raw.clients.map((row) => [row.clientId, row]));

  return mockClients
    .map((client): CampaignClient | null => {
      const row = authored.get(client.id);
      const matches = segmentsOfClient(client).some((s) => campaignSegments.includes(s));
      // Neither authored nor a segment match — the campaign simply isn't about
      // this client, so they get no row at all rather than an ineligible one.
      if (!row && !matches) return null;

      const overridden = row && "eligible" in row ? row.eligible : undefined;
      return {
        campaignId: raw.id,
        clientId: client.id,
        eligible: overridden ?? matches,
        ineligibleReason: row && "ineligibleReason" in row ? row.ineligibleReason : undefined,
        status: row && "status" in row ? (row.status as CampaignClientStatus) : "not-sent",
        // Dated a few days back so the column isn't a wall of identical
        // timestamps; the exact day carries no meaning.
        updatedAt: timestampFromOffset(-3),
      };
    })
    .filter((row): row is CampaignClient => row !== null);
}

export const seedCampaignClients: CampaignClient[] = campaignsRaw.flatMap(seedRowsFor);

/** RSVPs authored on the event fixtures — the `rsvp` field on a client row. */
export const seedRsvps: CampaignRsvp[] = campaignsRaw.flatMap((raw) =>
  raw.clients
    .filter((row): row is RawClientRow & { rsvp: string } => "rsvp" in row)
    .map((row) => ({
      campaignId: raw.id,
      clientId: row.clientId,
      status: row.rsvp as RsvpStatus,
      updatedAt: timestampFromOffset(-4),
    })),
);

/**
 * The compliance log as it already stands.
 *
 * Derived from the seeded statuses rather than authored separately: a row that
 * says "ส่งแล้ว" and a log with no entry for it is exactly the drift this
 * whole module is arranged to make unauthorable. Anything past `not-sent` had
 * to have been sent, so it gets an entry against the campaign's first approved
 * material.
 */
export const seedShareLogs: ShareLog[] = seedCampaignClients
  .filter((row) => row.status !== "not-sent")
  .flatMap((row, index) => {
    const campaign = mockCampaigns.find((c) => c.id === row.campaignId);
    const material = campaign?.materials.find((m) => m.approved);
    if (!material) return [];
    return [
      {
        id: `shr-seed-${index + 1}`,
        campaignId: row.campaignId,
        clientId: row.clientId,
        materialId: material.id,
        materialVersion: material.version,
        sentBy: CAMPAIGN_ACTOR,
        sentAt: row.updatedAt,
      },
    ];
  });
