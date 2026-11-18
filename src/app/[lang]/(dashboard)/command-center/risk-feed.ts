/**
 * Risk & compliance findings, as the Command Center card and
 * `/command-center/risk-alerts` read them.
 *
 * Sits beside `call-log-feed` and does the same job: turn a dataset plus the
 * privacy flag into display rows, ranked, with the derivations in one place
 * rather than in whichever component happened to need them first.
 *
 * The colours and the Thai labels are *not* here — they are in `risk-config`,
 * which is a component concern. This file exports the ranking and the counts.
 */

import { maskName } from "@/lib/mask-name";
import type {
  RiskAlert,
  RiskAlertCategory,
  RiskSeverity,
} from "@/types/domain";

/** One finding, as a row: the alert, the name as it may be shown, and whether
 *  this IC has already waved it through. */
export type RiskAlertRow = {
  alert: RiskAlert;
  /** Masked at build time, for the reason a KYC queue row's title is: only the
   *  function assembling the row knows which of its strings is a person. */
  displayName: string;
  acknowledged: boolean;
};

/** Severity order, so `critical` leads whatever order the JSON is authored in.
 *  Same move as `PRIORITY_RANK` in `dashboard-data`. */
export const RISK_SEVERITY_RANK: Record<RiskSeverity, number> = {
  critical: 0,
  warning: 1,
  watch: 2,
};

/**
 * Findings this IC has acknowledged.
 *
 * Its own preference key, namespaced by feature rather than by page, because
 * two surfaces read it — the Command Center card and the full list — and a
 * shared key would let a stale id from another feed prune rows out of this one
 * (the reason `HIDDEN_NBA_IDS_PREF` is separate from `HIDDEN_QUEUE_IDS_PREF`).
 *
 * "acknowledged", not "hidden": the full page keeps showing these behind a
 * toggle, which is what lets the detail panel skip a confirmation step.
 */
export const RISK_ACK_IDS_PREF = "risk-alerts:acknowledged";

/**
 * `risk:ra-01:critical:today`
 *
 * Deliberately *not* the alert's own id. Acknowledging a row must not silence a
 * risk that is getting worse — the reasoning behind the queue's
 * `kyc:110002:d7`, applied to the two axes a finding escalates along:
 *
 * - **severity** — a `watch` dormant-account flag waved through on Monday comes
 *   back as a new row the moment surveillance raises it to `warning`.
 * - **zone** — a margin call acknowledged while it was `thisWeek` returns at
 *   `tomorrow`, again at `today`, again at `overdue`. Four chances not to miss
 *   a force sell, on the app's existing urgency axis rather than a new one.
 *
 * `nodate` and `far` are kept apart: a finding with no deadline never escalates
 * along that axis at all, while one more than 15 days out eventually will, and
 * collapsing them would make a distant Suitability review un-returnable.
 */
export function riskAckId(alert: RiskAlert): string {
  const band = alert.zone ?? (alert.daysLeft === null ? "nodate" : "far");
  return `risk:${alert.id}:${alert.severity}:${band}`;
}

/**
 * Drops stored ids this feed can no longer raise.
 *
 * Matches on the *shape* rather than testing membership against
 * `mockRiskAlerts`: an id written before a rule was renamed should simply stop
 * matching, not silence something unrelated — the argument `isQueueId` makes
 * for matching on prefixes.
 */
export function isRiskAlertId(id: string): boolean {
  return /^risk:[a-z0-9-]+:(critical|warning|watch):(overdue|today|tomorrow|thisWeek|next2Weeks|far|nodate)$/.test(
    id,
  );
}

/**
 * Every finding, ranked, each flagged with whether it has been acknowledged.
 *
 * **Severity first, then urgency** — the opposite of `buildQueue`, which sorts
 * on `daysLeft` first. That is right for a deadline list where every row is the
 * same kind of thing; it is wrong here, where most rows carry no deadline at
 * all and a sanctions hit would otherwise sort below a Suitability review with
 * twelve days left.
 *
 * `daysLeft ?? 0` reads a missing deadline as **now, not never**. A mule flag
 * has no deadline because nobody set one, not because it can wait; dropping it
 * to the bottom of its severity band is the reading that gets it missed.
 *
 * No horizon is applied. `buildQueue` cuts at 15 days because the bell has to
 * stop somewhere a reader would still call "soon"; this list is ranked by how
 * bad a thing is, and a critical finding does not stop mattering because its
 * deadline happens to be three weeks out.
 *
 * Acknowledged rows are flagged rather than dropped — the full page shows them
 * behind a toggle. Only the Command Center card filters them, via
 * {@link openRiskAlerts}.
 */
export function buildRiskAlertRows({
  alerts,
  acknowledgedIds,
  isPrivate,
}: {
  alerts: RiskAlert[];
  acknowledgedIds: Set<string>;
  isPrivate: boolean;
}): RiskAlertRow[] {
  return alerts
    .map((alert) => ({
      alert,
      // An un-attributed finding's label is not a name, so it is not masked —
      // "ยังระบุตัวตนไม่ได้" survives privacy mode intact.
      displayName:
        alert.clientId === null
          ? alert.clientName
          : maskName(alert.clientName, isPrivate),
      acknowledged: acknowledgedIds.has(riskAckId(alert)),
    }))
    .sort(
      (a, b) =>
        RISK_SEVERITY_RANK[a.alert.severity] - RISK_SEVERITY_RANK[b.alert.severity] ||
        (a.alert.daysLeft ?? 0) - (b.alert.daysLeft ?? 0) ||
        b.alert.detectedAt.localeCompare(a.alert.detectedAt) ||
        // A total order, so two findings stamped at the same minute cannot fall
        // back to the order the fixture happens to be authored in. Sort
        // stability makes that *look* fine and it is not: the same tie resolved
        // against a differently-filtered array lands differently, which is how
        // the card and the sub page would start disagreeing about row order.
        a.alert.id.localeCompare(b.alert.id),
    );
}

/** The rows still asking for something. */
export function openRiskAlerts(rows: RiskAlertRow[]): RiskAlertRow[] {
  return rows.filter((row) => !row.acknowledged);
}

export function countRiskBySeverity(
  rows: RiskAlertRow[],
): Record<RiskSeverity, number> {
  const out: Record<RiskSeverity, number> = { critical: 0, warning: 0, watch: 0 };
  for (const row of rows) out[row.alert.severity] += 1;
  return out;
}

export function countRiskByCategory(
  rows: RiskAlertRow[],
): Record<RiskAlertCategory, number> {
  const out: Record<RiskAlertCategory, number> = {
    margin: 0,
    suitability: 0,
    conduct: 0,
  };
  for (const row of rows) out[row.alert.category] += 1;
  return out;
}
