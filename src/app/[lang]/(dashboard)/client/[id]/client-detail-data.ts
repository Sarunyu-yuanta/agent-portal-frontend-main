import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/th";
import { formatDate } from "@/i18n/format";
/**
 * Client 360 detail — static data and helpers.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * `IMPORTANT_FORMS` is hard-coded and should come from the API per client
 * (form title, description, last-updated date, completion status). "Last
 * contact" is derived from the call log here; the backend may return it directly.
 */

import { mockClients, mockClientDetails, mockKYCData } from "@/lib/mock-data";
import type { CallLogEntry } from "@/data/call-log-data";

/** Per-client detail keyed by client id, aligned with the client roster. */
export const clientDetailById = Object.fromEntries(
  mockClients.map((c) => [c.id, mockClientDetails[c.id]]),
);

/** Re-exported so this stays the one import for Client 360 detail data; the
 *  palette itself lives with the donut that draws it. */
export { ALLOCATION_COLORS } from "@/components/allocation-donut";

export type SortDir = "none" | "asc" | "desc";
export type HoldingsSortKey = "value" | "pnlPct" | "pct" | null;

/** Human "last contact" label derived from the most recent call log. */
export function lastContactFromCallLogs(logs: CallLogEntry[]): string {
  if (logs.length === 0) return "No contact";
  const MONTHS: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  const parsed = logs
    .map((log) => {
      const [d, m, y] = log.date.split(" ");
      return new Date(Number(y), MONTHS[m] ?? 0, Number(d));
    })
    .filter((d) => !isNaN(d.getTime()));
  if (parsed.length === 0) return "No contact";
  const latest = new Date(Math.max(...parsed.map((d) => d.getTime())));
  const now = new Date();
  const days = Math.floor((now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/**
 * When this client's KYC lapses, for the KYC tab.
 *
 * `null` when the roster carries a client the KYC data doesn't — the mock data
 * does have one (client 110008), so the tab renders the gap rather than assuming
 * every client has a record.
 *
 * `daysLeft` is derived from `nextReview` rather than read from the record's own
 * `daysUntilExpiry`: a stored day count is stale the moment it's serialised, and
 * a date printed next to a contradicting countdown is what the mock used to do
 * before `mockKYCData` started stamping the date from the offset (see the note
 * there). Deriving keeps every KYC surface saying the same number, whatever the
 * backend ends up sending.
 *
 * Backend: return `nextReview` and let this do the arithmetic.
 */
export function kycExpiry(clientId: string): {
  /** `nextReview` as sent (an ISO day). Format it with {@link formatKycDate}. */
  date: string;
  /** `null` when the date couldn't be parsed, so there is no countdown to show. */
  daysLeft: number | null;
  /** Within 30 days — the window Client 360's "KYC ครบกำหนด" card also uses. */
  dueSoon: boolean;
  /** Within a week, where "due soon" stops being a heads-up. */
  urgent: boolean;
} | null {
  const record = mockKYCData.find((k) => k.clientId === clientId);
  if (!record) return null;

  const parsed = new Date(record.nextReview);
  if (isNaN(parsed.getTime())) {
    // Show whatever the backend sent rather than inventing a countdown off a
    // date we couldn't read, or rendering "in NaN days".
    return { date: record.nextReview, daysLeft: null, dueSoon: false, urgent: false };
  }

  // Both floored to midnight UTC so the difference counts calendar days rather
  // than hours-since-now, which would make "due today" flip mid-afternoon.
  const startOfDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const now = new Date();
  const daysLeft = Math.round(
    (startOfDay(parsed) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000,
  );

  return {
    date: record.nextReview,
    daysLeft,
    dueSoon: daysLeft < 30,
    urgent: daysLeft <= 7,
  };
}

/**
 * A KYC date for display — `15 ธ.ค. 2569` / `15 Dec 2026`. A value that won't
 * parse is shown as sent rather than as "Invalid Date".
 */
export function formatKycDate(date: string, locale: Locale): string {
  return Number.isNaN(new Date(date).getTime()) ? date : formatDate(locale, date, "short");
}

/**
 * The KYC expiry as one sentence, for the profile's identity bar, the
 * Dashboard queue, the bell and the calendar — one helper so the surfaces word
 * the same deadline the same way.
 *
 * `null` when the client has no KYC record — the caller drops the whole line
 * rather than printing a countdown to nothing.
 */
export function kycExpiryLabel(clientId: string, t: Dictionary, locale: Locale): string | null {
  const expiry = kycExpiry(clientId);
  if (!expiry) return null;

  const { date, daysLeft } = expiry;
  const m = t.dates.kyc;
  // Unparseable `nextReview` — show the date as sent rather than a countdown
  // derived from a value we couldn't read.
  if (daysLeft === null) return m.expiresOn(formatKycDate(date, locale));
  if (daysLeft < 0) return m.expiredDays(Math.abs(daysLeft));
  if (daysLeft === 0) return m.expiresToday;
  return m.expiresIn(daysLeft);
}

export type FormStatus = "done" | "pending" | "not-done" | "oncoming" | null;

/** A form's id — its key in `t.client.kyc.forms`, which holds its title and description. */
export type ImportantFormId =
  | "wealthDeclaration"
  | "fatcaCrs"
  | "w8ben"
  | "knowledgeAssessment"
  | "bondKnowledgeTest"
  | "suitabilityTest";

export const IMPORTANT_FORMS: {
  id: ImportantFormId;
  /** Last-updated date, as sent. */
  updatedAt: string;
  status: FormStatus;
}[] = [
  { id: "wealthDeclaration", updatedAt: "24 Jul 2024", status: "done" },
  { id: "fatcaCrs", updatedAt: "24 Jul 2024", status: "pending" },
  { id: "w8ben", updatedAt: "24 Jul 2024", status: null },
  { id: "knowledgeAssessment", updatedAt: "24 Jul 2024", status: "not-done" },
  { id: "bondKnowledgeTest", updatedAt: "24 Jul 2024", status: "not-done" },
  { id: "suitabilityTest", updatedAt: "24 Jul 2024", status: "oncoming" },
];
