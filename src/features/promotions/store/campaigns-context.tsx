"use client";

/**
 * Everything the IC *does* on a campaign: what has been sent to whom, who is
 * registered for which event, and who turned up.
 *
 * Mounted once in the dashboard layout, for the same reason `OrdersProvider`
 * is: a share sent from `/promotions/cmp-dr-qqqm19` has to move the
 * "ลูกค้าที่เข้าเงื่อนไขแต่ยังไม่ได้ชวน" tile on `/promotions` without either
 * screen remounting, and the layout is the only thing that doesn't.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * Held in React state, seeded from `lib/campaign-mock-data`. Every mutator is
 * `async` and awaited at every call site, so pointing them at real endpoints is
 * a change in this file alone. `isLoading` is in the contract and permanently
 * `false` for the same reason `useStatic` returns one — the screens already
 * render skeletons against it.
 *
 * Three rules are enforced here rather than in the views, because this is where
 * the endpoint will enforce them:
 *
 * 1. **Only an approved material can be shared.** {@link shareMaterial} throws
 *    on anything else. The UI also disables those rows, but a disabled button
 *    is a courtesy, not a control.
 * 2. **A closed campaign takes no shares.** Same reasoning: the cards and the
 *    detail page both grey out, and this is what makes that true rather than
 *    merely drawn.
 * 3. **Every share writes a {@link ShareLog}.** The per-client status is
 *    updated *alongside* the log, never instead of it — the log is the
 *    compliance record and is append-only.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  CAMPAIGN_ACTOR,
  seedCampaignClients,
  seedRsvps,
  seedShareLogs,
} from "@/features/promotions/api/promotions.api";
import { useCampaigns } from "@/features/promotions/hooks/use-campaigns";
import type { Dictionary } from "@/i18n/dictionaries/th";
import type {
  CampaignClient,
  CampaignClientStatus,
  CampaignRsvp,
  RsvpStatus,
  ShareLog,
} from "@/types/campaign";

/** Which rule refused — a screen turns it into IC copy with {@link campaignRuleMessage}. */
export type CampaignRuleCode =
  "materialMissing" | "materialNotApproved" | "campaignClosed" | "notEnoughSeats";

/**
 * A share or registration the rules refuse. `code` (plus `seats` for the
 * seat check) is what a screen localises for the toast; `message` is the
 * English detail for logs.
 */
export class CampaignRuleError extends Error {
  constructor(
    readonly code: CampaignRuleCode,
    detail: string,
    readonly seats?: { open: number; requested: number },
  ) {
    super(detail);
    this.name = "CampaignRuleError";
  }
}

/** The IC-facing toast line for a refused share or registration. */
export function campaignRuleMessage(error: CampaignRuleError, t: Dictionary): string {
  const m = t.campaigns.rules;
  if (error.code === "notEnoughSeats") {
    return m.notEnoughSeats(error.seats?.open ?? 0, error.seats?.requested ?? 0);
  }
  return m[error.code];
}

type CampaignsContextValue = {
  campaignClients: CampaignClient[];
  rsvps: CampaignRsvp[];
  /** Append-only, newest last. The compliance record. */
  shareLogs: ShareLog[];
  /** Always `false` today — see the module note. */
  isLoading: boolean;
  /**
   * Sends one approved material to any number of clients at once.
   *
   * Rejects an unapproved material, and skips clients the campaign has marked
   * ineligible — a bulk action must not become a way around a per-row block.
   * Returns the log rows actually written, so the caller can report how many
   * went out rather than how many were asked for.
   */
  shareMaterial: (input: {
    campaignId: string;
    clientIds: string[];
    materialId: string;
  }) => Promise<ShareLog[]>;
  /** Moves one client along the promotion funnel — สนใจ, ใช้สิทธิ์แล้ว. */
  setClientStatus: (
    campaignId: string,
    clientId: string,
    status: CampaignClientStatus,
  ) => Promise<void>;
  /**
   * Registers clients for an event. Rejects when the seats left won't cover
   * them, and silently skips anyone already holding a seat.
   */
  registerClients: (input: { campaignId: string; clientIds: string[] }) => Promise<CampaignRsvp[]>;
  /** Confirms a seat, or records attendance after the event. */
  setRsvpStatus: (campaignId: string, clientId: string, status: RsvpStatus) => Promise<void>;
  /** Seats still open, after this session's registrations. */
  seatsLeft: (campaignId: string) => number | null;
};

const CampaignsContext = createContext<CampaignsContextValue | null>(null);

/** Ids minted in the browser — sequential, and prefixed so a locally written
 *  log row is distinguishable from a seeded one at a glance. */
let localSeq = 0;
const localId = (prefix: string) => `${prefix}-local-${++localSeq}`;

/** Today as the `YYYY-MM-DD` the campaign dates are written in, so the two can
 *  be compared as strings — local parts, not `toISOString`, which would put a
 *  Bangkok morning on the previous day. */
function todayIsoDay(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Where a client lands after being sent something.
 *
 * A share only ever moves `not-sent` forward. Someone who already said they
 * were interested, or who has used the offer, does not go back to "ส่งแล้ว"
 * because a second piece of artwork went out — that would read as progress
 * being undone.
 */
function statusAfterShare(current: CampaignClientStatus): CampaignClientStatus {
  return current === "not-sent" ? "sent" : current;
}

export function CampaignsProvider({ children }: { children: ReactNode }) {
  const [campaignClients, setCampaignClients] = useState<CampaignClient[]>(seedCampaignClients);
  const [rsvps, setRsvps] = useState<CampaignRsvp[]>(seedRsvps);
  const [shareLogs, setShareLogs] = useState<ShareLog[]>(seedShareLogs);
  const { data: campaigns } = useCampaigns();

  /**
   * Seats held against this campaign right now.
   *
   * `no-show` still counts: the seat was taken and the event has happened, so
   * releasing it would make a past event look like it had room.
   */
  const seatsLeft = useCallback(
    (campaignId: string) => {
      const campaign = campaigns.find((c) => c.id === campaignId);
      if (campaign?.seatsLeftSeed === undefined) return null;
      const seededHolders = seedRsvps.filter((r) => r.campaignId === campaignId).length;
      const holders = rsvps.filter((r) => r.campaignId === campaignId).length;
      // The seed figure already accounts for the seeded RSVPs, so only the
      // seats taken *since* come off it.
      return Math.max(0, campaign.seatsLeftSeed - (holders - seededHolders));
    },
    [campaigns, rsvps],
  );

  const shareMaterial = useCallback<CampaignsContextValue["shareMaterial"]>(
    async ({ campaignId, clientIds, materialId }) => {
      const campaign = campaigns.find((c) => c.id === campaignId);
      const material = campaign?.materials.find((m) => m.id === materialId);
      if (!material) {
        throw new CampaignRuleError(
          "materialMissing",
          `No material ${materialId} on campaign ${campaignId}`,
        );
      }
      if (!material.approved) {
        throw new CampaignRuleError(
          "materialNotApproved",
          `Material ${materialId} is not approved and cannot be shared`,
        );
      }
      // `endDate` inclusive, matching `campaignStatus` — a campaign closing
      // today is one the IC can still act on this afternoon. A null one never
      // closes, so there is nothing to refuse.
      if (campaign?.endDate != null && todayIsoDay() > campaign.endDate) {
        throw new CampaignRuleError(
          "campaignClosed",
          `Campaign ${campaignId} has closed and takes no shares`,
        );
      }

      const sentAt = new Date().toISOString();

      // Resolved from the current state rather than inside the updater below:
      // React may invoke an updater more than once for one call, and minting
      // ids in there would append the same share to the log twice.
      const allowed = new Set(
        campaignClients
          .filter(
            (row) =>
              row.campaignId === campaignId && row.eligible && clientIds.includes(row.clientId),
          )
          .map((row) => row.clientId),
      );

      const written: ShareLog[] = [...allowed].map((clientId) => ({
        id: localId("shr"),
        campaignId,
        clientId,
        materialId,
        materialVersion: material.version,
        sentBy: CAMPAIGN_ACTOR,
        sentAt,
      }));
      if (written.length === 0) return [];

      setCampaignClients((prev) =>
        prev.map((row) =>
          row.campaignId === campaignId && allowed.has(row.clientId)
            ? { ...row, status: statusAfterShare(row.status), updatedAt: sentAt }
            : row,
        ),
      );
      // Both setters run in the same commit, so the table can never paint a
      // "ส่งแล้ว" row that has no log behind it.
      setShareLogs((prev) => [...prev, ...written]);
      return written;
    },
    [campaignClients, campaigns],
  );

  const setClientStatus = useCallback<CampaignsContextValue["setClientStatus"]>(
    async (campaignId, clientId, status) => {
      const updatedAt = new Date().toISOString();
      setCampaignClients((prev) =>
        prev.map((row) =>
          row.campaignId === campaignId && row.clientId === clientId
            ? { ...row, status, updatedAt }
            : row,
        ),
      );
    },
    [],
  );

  const registerClients = useCallback<CampaignsContextValue["registerClients"]>(
    async ({ campaignId, clientIds }) => {
      const held = new Set(rsvps.filter((r) => r.campaignId === campaignId).map((r) => r.clientId));
      const fresh = clientIds.filter((id) => !held.has(id));
      if (fresh.length === 0) return [];

      const open = seatsLeft(campaignId);
      if (open !== null && fresh.length > open) {
        throw new CampaignRuleError(
          "notEnoughSeats",
          `Only ${open} seat(s) left on ${campaignId}; ${fresh.length} requested`,
          { open, requested: fresh.length },
        );
      }

      const updatedAt = new Date().toISOString();
      const added: CampaignRsvp[] = fresh.map((clientId) => ({
        campaignId,
        clientId,
        status: "registered",
        updatedAt,
      }));
      setRsvps((prev) => [...prev, ...added]);
      return added;
    },
    [rsvps, seatsLeft],
  );

  const setRsvpStatus = useCallback<CampaignsContextValue["setRsvpStatus"]>(
    async (campaignId, clientId, status) => {
      const updatedAt = new Date().toISOString();
      setRsvps((prev) =>
        prev.map((r) =>
          r.campaignId === campaignId && r.clientId === clientId ? { ...r, status, updatedAt } : r,
        ),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      campaignClients,
      rsvps,
      shareLogs,
      isLoading: false,
      shareMaterial,
      setClientStatus,
      registerClients,
      setRsvpStatus,
      seatsLeft,
    }),
    [
      campaignClients,
      rsvps,
      shareLogs,
      shareMaterial,
      setClientStatus,
      registerClients,
      setRsvpStatus,
      seatsLeft,
    ],
  );

  return <CampaignsContext.Provider value={value}>{children}</CampaignsContext.Provider>;
}

export function useCampaignStore() {
  const ctx = useContext(CampaignsContext);
  if (!ctx) {
    throw new Error("useCampaignStore must be used within a CampaignsProvider");
  }
  return ctx;
}
