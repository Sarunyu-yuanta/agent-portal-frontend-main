import type { NotificationZone } from "@/lib/notification-zones";

// ── Risk & compliance alerts ─────────────────────────────────────────────────
//
// What the firm's margin, suitability and surveillance systems raise against the book,
// merged into one list an IC works through each morning.
//
// Distinct from two things it sits beside. A KYC expiry is a *record* lapsing
// on a schedule everyone can see coming; a reminder is something a person wrote
// down. Every row here is a rule that fired on its own, against behaviour
// nobody planned.

/** The three filter tabs. Derived from {@link RiskAlertKind}, never authored. */
export type RiskAlertCategory = "margin" | "suitability" | "conduct";

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
   * The rule that fired — "MR-02", "MC-01".
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
   * `false` where ringing the client would itself be the problem — e.g. a
   * surveillance referral the client must not be tipped off about. The detail
   * panel drops the contact button entirely and prints
   * {@link RiskAlert.contactNote}. Authored per row, not derived from the
   * category, because the same family holds both cases.
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
