/**
 * Risk & compliance findings, with every date stamped at import.
 *
 * `risk-alerts.json` carries **offsets** rather than literal dates, for the
 * reason `campaign-mock-data` and `mockKYCData` both give: authored dates rot,
 * and the urgency bands the UI is built to show — overdue, today, tomorrow,
 * this week — only exist if some row is actually sitting in each one. The
 * spread in the JSON keeps demonstrating them next month as much as today.
 *
 * Two offsets, in two units, because they are two different kinds of fact:
 * `dueOffset` is in **days** (a deadline is a date someone set), while
 * `detectedMinutesAgo` is in **elapsed minutes** (a detection is a span). See
 * {@link timestampFromMinutesAgo} for what that distinction cost to learn.
 *
 * Only the mock inverts it. `dueDate` stays the field of record and `daysLeft`
 * is computed back out of it, so the arithmetic every consumer runs is the
 * arithmetic it will run against a backend that returns a date.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * These rows are what the firm's margin, suitability and surveillance engines would
 * push. What the *IC* then does with one — acknowledging it — is not here; it
 * is a user preference, held through `useStoredIds`. See
 * `app/(dashboard)/command-center/risk-feed`.
 */

import riskAlertsRaw from "@/data/risk-alerts.json";
import { mockClients } from "@/lib/mock-data";
import { formatThbWhole } from "@/lib/client-utils";
import { zoneForDays } from "@/app/[lang]/(dashboard)/notification-zones";
import type {
  RiskAlert,
  RiskAlertCategory,
  RiskAlertKind,
  RiskMetric,
  RiskSeverity,
} from "@/types/domain";

/**
 * Which tab each kind sits under.
 *
 * Derived rather than authored as a `category` beside `kind` in the JSON.
 * Writing both is writing one fact twice, and the second copy is the one that
 * goes wrong — the same reasoning `mockKYCData` applies to `nextReview`.
 * Exported so the UI's category filter is checked against this table rather
 * than against a second list of its own.
 */
export const RISK_CATEGORY_OF_KIND: Record<RiskAlertKind, RiskAlertCategory> = {
  "margin-call": "margin",
  "force-sell": "margin",
  "settlement-overdue": "margin",
  "credit-limit": "margin",
  "risk-profile-breach": "suitability",
  "suitability-expired": "suitability",
  concentration: "suitability",
  "cash-balance-stock": "conduct",
  "wash-trade": "conduct",
  "price-band": "conduct",
};

/**
 * The fields only some rows carry, read as optionals.
 *
 * `resolveJsonModule` collapses the fixtures into one element type whose
 * row-specific keys are optional, so `"clientLabel" in raw` narrows nothing and
 * the value still arrives as `string | undefined`. Naming the shape once beats
 * an assertion at each site — the reason `campaign-mock-data` declares
 * `RawEventFields`.
 */
type RawOptionalFields = {
  /** Only on a row with no `clientId` — what to print in place of a name. */
  clientLabel?: string;
};

type RawMetric = {
  label: string;
  value?: string;
  amountThb?: number;
  emphasis?: boolean;
};

type RawRiskAlert = (typeof riskAlertsRaw)[number] & RawOptionalFields;

/**
 * An offset in days turned into an ISO day.
 *
 * Local midnight, not UTC: `daysLeft` below is compared against the user's own
 * today, and `dayOffset`/`todayDateKey` in `calendar-grid` read local parts
 * too. A UTC stamp would put a Bangkok afternoon on the previous day.
 */
function dayFromOffset(offset: number): string {
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  const month = String(day.getMonth() + 1).padStart(2, "0");
  return `${day.getFullYear()}-${month}-${String(day.getDate()).padStart(2, "0")}`;
}

/** Whole days from today to an ISO day — negative once it has passed. */
function daysFromToday(isoDay: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = isoDay.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86_400_000);
}

/**
 * How long ago a rule fired, as a timestamp.
 *
 * Authored as **elapsed minutes**, not as a clock time, which is the one unit
 * that survives being looked at. The rows first carried `{ detectedOffset: 0,
 * detectedTime: "12:05" }` and a clamp to `now`, so an alert "from midday"
 * would not read as detected in the future at a nine-in-the-morning demo.
 *
 * Both halves of that were wrong:
 *
 * - **The clamp was a hydration bug.** It collapsed every still-future row onto
 *   the same instant, so a server rendering at 08:00 and a client hydrating at
 *   12:06 disagreed about which findings were newest — enough to reorder the
 *   card and fail hydration outright.
 * - **The clock time was the wrong unit.** Dropping the clamp only moved the
 *   problem: a demo at 08:00 showed two criticals as "เมื่อสักครู่" because
 *   09:12 and 12:05 had not happened yet. No absolute time fixes that, since
 *   the demo can run at any hour. What the fixture always meant was "this fired
 *   about three hours ago", so that is what it now says.
 *
 * Unlike `dueDate`, this is deliberately *not* anchored to the calendar day.
 * A deadline is a date someone set and the arithmetic against it has to match a
 * real backend's; a detection is an elapsed interval, and the span is the fact
 * worth keeping stable across a demo that might run at any hour.
 *
 * Server and client evaluate this module at different instants, so every stamp
 * shifts by that delta — but all of them shift by the *same* delta, so the
 * ordering the sort depends on is identical either side. Only the rendered
 * label can differ, which is why that span carries `suppressHydrationWarning`.
 */
function timestampFromMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

/** Lookup map — a client's name lives only in `clients.json`. */
const nameById = Object.fromEntries(mockClients.map((c) => [c.id, c.name]));
const riskProfileById = Object.fromEntries(
  mockClients.map((c) => [c.id, c.riskProfile]),
);

/**
 * A suitability alert quotes the client's own risk rating, so it is written as
 * a `{riskProfile}` placeholder and filled from the record here.
 *
 * Direct extension of `fillKycPlaceholders`, and for a sharper reason than
 * convenience: `riskProfile` currently disagrees between `clients.json` and
 * `data/client-profiles.ts` for three of the eight clients. Spelling the word
 * into the fixture picks a side, and whichever side it picked would contradict
 * the next screen the IC opened. `clients.json` is the field of record — it is
 * what `Client.riskProfile` and every segment rule read — so filling from it is
 * the only answer that cannot drift.
 */
function fillClientPlaceholders(text: string, clientId: string | null): string {
  if (!text.includes("{riskProfile}")) return text;
  const profile = clientId ? riskProfileById[clientId] : undefined;
  if (!profile) return text;
  return text.replaceAll("{riskProfile}", profile);
}

function metricOf(raw: RawMetric, clientId: string | null): RiskMetric {
  return {
    label: raw.label,
    // Money is authored once, as a number, and formatted here — so the string
    // and the figure cannot disagree. Same move `fillKycPlaceholders` makes for
    // dates, applied to amounts.
    value: fillClientPlaceholders(
      raw.value ?? formatThbWhole(raw.amountThb ?? 0),
      clientId,
    ),
    amountThb: raw.amountThb ?? null,
    emphasis: raw.emphasis ?? false,
  };
}

/** The seed dataset, dates stamped from today. */
export const mockRiskAlerts: RiskAlert[] = (riskAlertsRaw as RawRiskAlert[]).map(
  (raw) => {
    const kind = raw.kind as RiskAlertKind;
    const clientId = raw.clientId;
    // `dueDate` is the field of record; `daysLeft` is read back out of it
    // rather than taken from `dueOffset`, so the path a real backend exercises
    // is the one running here. Short-circuiting it would leave that path
    // untested until the day it matters.
    const dueDate = raw.dueOffset == null ? null : dayFromOffset(raw.dueOffset);
    const daysLeft = dueDate === null ? null : daysFromToday(dueDate);

    return {
      id: raw.id,
      kind,
      category: RISK_CATEGORY_OF_KIND[kind],
      severity: raw.severity as RiskSeverity,
      ruleCode: raw.ruleCode,
      title: fillClientPlaceholders(raw.title, clientId),
      message: fillClientPlaceholders(raw.message, clientId),
      metrics: raw.metrics.map((m) => metricOf(m, clientId)),
      recommendedAction: fillClientPlaceholders(raw.recommendedAction, clientId),
      clientId,
      // Unmasked here. Masking is the feed's job, for the reason `buildQueue`
      // gives: only the function building a display row knows which of its
      // strings is a person's name.
      clientName: clientId
        ? (nameById[clientId] ?? clientId)
        : (raw.clientLabel ?? "ยังระบุตัวตนไม่ได้"),
      accountLabel: raw.accountLabel,
      contactAllowed: raw.contactAllowed,
      contactNote: raw.contactNote,
      dismissible: raw.dismissible,
      detectedAt: timestampFromMinutesAgo(raw.detectedMinutesAgo),
      dueDate,
      daysLeft,
      zone: daysLeft === null ? null : zoneForDays(daysLeft),
    };
  },
);
