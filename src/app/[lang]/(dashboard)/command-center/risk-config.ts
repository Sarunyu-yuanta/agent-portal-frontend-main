"use client";

/**
 * How a risk finding is drawn: the words, the glyph and the tints.
 *
 * Apart from `risk-feed`, which ranks and counts, for the split
 * `compliance/AlertCards` and `ai-insights/insight-config` already make — the
 * data layer exports the unions and the ordering, never the colours.
 */

import type { ElementType } from "react";
import {
  ChartLineDownIcon,
  EyeIcon,
  InfoIcon,
  UserFocusIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import type { RiskAlertCategory, RiskSeverity } from "@/types/domain";

/** Where "ดูทั้งหมด" lands. Exported from here rather than from the panel the
 *  way `CALL_LOG_PAGE` is: the sub page needs the string, and importing it out
 *  of the card component would pull the whole panel into the page's graph. */
export const RISK_ALERTS_PAGE = "/command-center/risk-alerts";

/** Worst first — the order the strip and the chip row are drawn in. */
export const SEVERITY_ORDER: RiskSeverity[] = ["critical", "warning", "watch"];

/** The order of the category tabs. */
export const RISK_CATEGORY_ORDER: RiskAlertCategory[] = [
  "margin",
  "suitability",
  "conduct",
];

/** A query param read back as a category. Anything unrecognised — a stale
 *  bookmark, a renamed family — degrades to "ทั้งหมด" rather than filtering the
 *  list down to nothing. */
export function parseRiskCategory(
  value: string | null,
): RiskAlertCategory | "all" {
  return RISK_CATEGORY_ORDER.includes(value as RiskAlertCategory)
    ? (value as RiskAlertCategory)
    : "all";
}

/**
 * How bad, as everything that draws it.
 *
 * `variant` is `Tag`'s; `pill` is a `RowIcon` tone (background plus text off
 * the `--fill-*` ramp, the shape `StatTiles`' `TONE` and `kycCheckpointTone`
 * already use); `text` colours an inline countdown; `dot` is the strip's bullet;
 * `bar` is the full-width deadline band in the detail panel.
 */
export const RISK_SEVERITY_META: Record<
  RiskSeverity,
  {
    label: string;
    variant: "red" | "yellow" | "blue";
    pill: string;
    text: string;
    dot: string;
    bar: string;
    Icon: ElementType;
  }
> = {
  critical: {
    label: "วิกฤต",
    variant: "red",
    pill: "bg-[var(--fill-red-100)] text-[var(--fill-red-600)]",
    text: "text-[var(--fill-red-600)]",
    dot: "bg-[var(--fill-red-500)]",
    bar: "bg-[var(--bg-danger-light)] text-[var(--text-danger-primary)]",
    Icon: XCircleIcon,
  },
  warning: {
    label: "เฝ้าระวัง",
    variant: "yellow",
    pill: "bg-[var(--fill-amber-100)] text-[var(--fill-amber-600)]",
    text: "text-[var(--fill-amber-600)]",
    dot: "bg-[var(--fill-amber-500)]",
    bar: "bg-[var(--bg-warning-light)] text-[var(--text-warning-primary)]",
    Icon: WarningCircleIcon,
  },
  watch: {
    label: "ข้อสังเกต",
    variant: "blue",
    pill: "bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]",
    text: "text-[var(--fill-p1-600)]",
    dot: "bg-[var(--fill-p1-500)]",
    bar: "bg-primary-action-light text-primary-action",
    Icon: InfoIcon,
  },
};

/**
 * Which rule family raised it — a word and a glyph, and no colour.
 *
 * The family deliberately has no tint of its own. Every tinted surface in this
 * feature means **severity**: the row's `RowIcon`, the detail panel's header
 * square, the filter chips. A family hue briefly lived here for the panel's
 * square, and all it bought was one finding wearing two colours — red in the
 * list, amber in the panel it opened — plus amber chrome around alerts the list
 * had just called วิกฤต.
 *
 * Which family a finding belongs to is carried by the glyph's shape and by the
 * grey Tag that says it in words, neither of which competes with severity for
 * the reader's first glance.
 */
export const RISK_CATEGORY_META: Record<
  RiskAlertCategory,
  { label: string; Icon: ElementType }
> = {
  margin: { label: "มาร์จิ้น/วงเงิน", Icon: ChartLineDownIcon },
  suitability: { label: "ความเหมาะสมการลงทุน", Icon: UserFocusIcon },
  conduct: { label: "พฤติกรรมการซื้อขาย", Icon: EyeIcon },
};

/** What the category strip is made of — "ทั้งหมด" and then the three families.
 *  Built here rather than in the component so the card and the sub page cannot
 *  end up offering different tabs. */
export const RISK_CATEGORY_TABS: {
  id: RiskAlertCategory | "all";
  title: string;
}[] = [
  { id: "all", title: "ทั้งหมด" },
  ...RISK_CATEGORY_ORDER.map((id) => ({
    id,
    title: RISK_CATEGORY_META[id].label,
  })),
];

/**
 * The label on a finding's one action — **a placeholder**.
 *
 * "Lorem ipsum" on purpose: which actions this desk can actually fire from an
 * alert is still an open question, and a plausible-looking Thai verb is the
 * worst thing to put on a button that does nothing. A reviewer reads "ติดต่อ
 * ลูกค้า" as a decision already taken; they read this as the question it
 * still is.
 *
 * What it replaced, for whenever the answer arrives: the CTA used to be
 * derived two ways from the record rather than authored per rule — a finding
 * the IC may raise with the client (`contactAllowed && clientId`) got "ติดต่อ
 * ลูกค้า", and one they may not — tipping-off under พ.ร.บ. ปปง., or a
 * sanctions hit nobody is attributed to yet — got "ส่งต่อฝ่ายกำกับ". Every
 * authored `recommendedAction` in the fixture falls on the side that split
 * predicts, so it is the shape to come back to.
 *
 * One label for every row, and no icon. Two placeholders with different
 * glyphs would be guessing at the very distinction this is here to avoid
 * claiming.
 */
export const RISK_CTA_LABEL = "Lorem ipsum";

/**
 * The deadline, as a signed phrase.
 *
 * Same three cases as `KycAlertsPanel`'s `countdownLabel`, because "เลยกำหนด"
 * and "ต้องดำเนินการใน" are opposite situations and a bare number is neither.
 * Worded for an obligation rather than an expiry: a margin call is something to
 * *do*, where a KYC record is something that lapses.
 */
export function deadlineLabel(daysLeft: number): string {
  if (daysLeft === 0) return "ครบกำหนดวันนี้";
  if (daysLeft < 0) return `เลยกำหนดมา ${Math.abs(daysLeft)} วัน`;
  return `ต้องดำเนินการใน ${daysLeft} วัน`;
}

/**
 * The deadline itself — "27 ต.ค.".
 *
 * Split on the string rather than `new Date(isoDay)`, the same way
 * `daysFromToday` reads one: `dueDate` is a **local** calendar day, and the
 * Date constructor reads a bare `YYYY-MM-DD` as UTC midnight, which lands on
 * the day before anywhere west of Greenwich.
 *
 * No year. Every deadline this feature carries is within a few weeks, and a
 * พ.ศ. year on a margin call due Tuesday is three characters that never change
 * sitting where the eye wants the day.
 */
export function dueDayLabel(dueDate: string): string {
  const [y, m, d] = dueDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

/**
 * How a deadline is painted on a row — a tinted pill, background and text.
 *
 * **Two colours, and they answer "how close", not "how bad".** Red is today.
 * Amber is everything else.
 *
 * Severity used to pick this tint and it was the wrong fact to colour by: two
 * rows both reading "ครบกำหนดวันนี้ 28 ต.ค." came out red on one and amber on
 * the other because one finding was วิกฤต and the other เฝ้าระวัง — the same
 * sentence in two colours, which reads as a difference in the deadline rather
 * than in the rule behind it. Severity is already stated twice on every row,
 * by the tinted square and by the Tag; this slot is the only one that can say
 * *when*, so it says only that.
 *
 * Deliberately not a gradient of nearness. Three days out and twelve days out
 * are the same answer — "not today" — and shading between them would restate
 * the number that is written inside the pill anyway.
 *
 * The `--fill-*` pairs are the ones `RISK_SEVERITY_META` uses for `critical`
 * and `warning`, so a red pill matches a red row-icon exactly rather than
 * approximately.
 */
export function deadlineToneClass(daysLeft: number): string {
  return daysLeft === 0
    ? "bg-[var(--fill-red-100)] text-[var(--fill-red-600)]"
    : "bg-[var(--fill-amber-100)] text-[var(--fill-amber-600)]";
}

/**
 * The deadline as a row states it: the date, plus how far off it is.
 *
 * Both halves, because neither answers on its own. "ครบกำหนดวันนี้" does not
 * say *which* day to write on a follow-up note, and "27 ต.ค." makes the reader
 * work out whether that is today — on a list where the whole point is spotting
 * what is already late.
 *
 * The date leads and the countdown trails as a qualifier, which is also the
 * order that survives being read at a glance: a desk scanning this column is
 * matching dates against its own diary.
 *
 * Falls back to the bare countdown if a finding somehow carries `daysLeft`
 * without a `dueDate`. The two are derived from one field and should never
 * disagree, but a missing date must not blank out the urgency with it.
 */
export function deadlineDateLabel(
  daysLeft: number,
  dueDate: string | null,
): string {
  if (dueDate === null) return deadlineLabel(daysLeft);
  const day = dueDayLabel(dueDate);
  if (daysLeft === 0) return `ครบกำหนดวันนี้ ${day}`;
  if (daysLeft < 0) return `เลยกำหนด ${day} · ${Math.abs(daysLeft)} วัน`;
  return `ครบกำหนด ${day} · อีก ${daysLeft} วัน`;
}

/**
 * How long ago the rule fired — "3 ชม. ที่แล้ว", "เมื่อวาน", "5 วันก่อน".
 *
 * What a row wants, where {@link detectedAtLabel} is what the record wants.
 * Reading a list, the question is *how stale is this*, and a clock time makes
 * the reader do the subtraction on every row; an elapsed figure has already
 * done it. The exact stamp is one click away in the detail panel, and sits on
 * the row's `title` for a hover.
 *
 * Hours rather than only days, which is as fine as `relativeCallDate` and
 * `daysAgoLabelTh` go. A call log is a history where the day is the unit; these
 * fire through the trading session, and "2 ชม." versus "8 ชม." is the
 * difference between this morning's problem and yesterday's.
 */
export function detectedAgoLabel(detectedAt: string, now: Date): string {
  const at = new Date(detectedAt);

  /**
   * Hours are only ever counted **within today**; the moment a finding is on an
   * earlier calendar day it is named by the day.
   *
   * A pure elapsed count reads wrong in a list. Yesterday 16:45 came out as "23
   * ชม. ที่แล้ว" while yesterday 08:05 — one row below it — came out as
   * "เมื่อวาน": two findings from the same afternoon described two different
   * ways, and the reader has to do arithmetic to notice they belong together.
   * The calendar boundary is also what a desk actually says, and what
   * `daysAgoLabelTh` already uses for the bell.
   */
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThatDay = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  const daysAgo = Math.round(
    (startOfToday.getTime() - startOfThatDay.getTime()) / 86_400_000,
  );

  if (daysAgo <= 0) {
    const minutes = Math.max(0, Math.floor((now.getTime() - at.getTime()) / 60_000));
    if (minutes < 1) return "เมื่อสักครู่";
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    return `${Math.floor(minutes / 60)} ชม. ที่แล้ว`;
  }
  if (daysAgo === 1) return "เมื่อวาน";
  if (daysAgo < 7) return `${daysAgo} วันก่อน`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} สัปดาห์ก่อน`;
  return `${Math.floor(daysAgo / 30)} เดือนก่อน`;
}

/**
 * When the rule fired, as a stamp — "วันนี้ 09:12 น.", "20 ต.ค. 16:45 น.".
 *
 * The detail panel's line, beside the rule code: a compliance finding is a
 * record, and a record says when, not how long ago. Past two days the date is
 * the clearer answer, the same cut `daysAgoLabelTh` makes for the bell.
 */
export function detectedAtLabel(detectedAt: string, now: Date): string {
  const at = new Date(detectedAt);
  const time = at.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  const daysAgo = Math.round((today.getTime() - day.getTime()) / 86_400_000);

  if (daysAgo <= 0) return `วันนี้ ${time} น.`;
  if (daysAgo === 1) return `เมื่อวาน ${time} น.`;
  const date = at.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  return `${date} ${time} น.`;
}
