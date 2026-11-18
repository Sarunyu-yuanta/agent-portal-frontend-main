/**
 * Dates, times and numbers in the user's language.
 *
 * - Thai dates use the Buddhist calendar (`18 พ.ย. 2569`); English uses the
 *   Gregorian one (`18 Nov 2026`). That comes from the locale tag
 *   (`th-TH-u-ca-buddhist`), never from adding 543 by hand.
 * - Every formatter passes an explicit `timeZone`. Client components are still
 *   rendered on the server, and a formatter that picks up the machine's zone
 *   renders one string on the server and another in the browser — a hydration
 *   mismatch. Bangkok by default; UTC where a caller needs it to match stored
 *   instants exactly.
 * - `Intl` objects are built once per (locale, options) and cached.
 *
 * Use through `useFormat()` in components, which binds the current locale.
 */

import type { Locale } from "./config";

export const TIME_ZONE = "Asia/Bangkok";

const INTL_LOCALE: Record<Locale, string> = {
  th: "th-TH-u-ca-buddhist",
  en: "en-GB",
};

type DateStyle =
  /** 18 พ.ย. 2569 · 18 Nov 2026 */
  | "short"
  /** 18 พฤศจิกายน 2569 · 18 November 2026 */
  | "long"
  /** พุธที่ 18 พ.ย. 2569 · Wed, 18 Nov 2026 */
  | "weekdayShort"
  /** วันพุธที่ 18 พฤศจิกายน 2569 · Wednesday, 18 November 2026 */
  | "weekdayLong"
  /** วันพุธที่ 18 พ.ย. 2569 · Wednesday, 18 Nov 2026 */
  | "weekdayLongMonthShort"
  /** พ. 18 พ.ย. · Wed, 18 Nov */
  | "weekdayDayMonth"
  /** 18 พ.ย. · 18 Nov */
  | "dayMonth"
  /** พฤศจิกายน 2569 · November 2026 */
  | "monthYear"
  /** 18/11/2569 · 18/11/2026 */
  | "numeric";

const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { day: "numeric", month: "short", year: "numeric" },
  long: { day: "numeric", month: "long", year: "numeric" },
  weekdayShort: { weekday: "short", day: "numeric", month: "short", year: "numeric" },
  weekdayLong: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  weekdayLongMonthShort: { weekday: "long", day: "numeric", month: "short", year: "numeric" },
  weekdayDayMonth: { weekday: "short", day: "numeric", month: "short" },
  dayMonth: { day: "numeric", month: "short" },
  monthYear: { month: "long", year: "numeric" },
  numeric: { day: "2-digit", month: "2-digit", year: "numeric" },
};

const cache = new Map<string, Intl.DateTimeFormat>();
function dtf(locale: Locale, options: Intl.DateTimeFormatOptions, timeZone: string) {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(INTL_LOCALE[locale], { ...options, timeZone });
    cache.set(key, f);
  }
  return f;
}

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(
  locale: Locale,
  value: Date | string | number,
  style: DateStyle = "short",
  timeZone: string = TIME_ZONE,
): string {
  return dtf(locale, DATE_OPTIONS[style], timeZone).format(toDate(value));
}

/**
 * Free-form options, for the few places a named style doesn't fit (chart axis
 * ticks). Prefer `formatDate` with a style everywhere else.
 */
export function formatDateWith(
  locale: Locale,
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions,
  timeZone: string = TIME_ZONE,
): string {
  return dtf(locale, options, timeZone).format(toDate(value));
}

/** 14:30 in both languages (24-hour, which is how Thai readers read time too). */
export function formatTime(locale: Locale, value: Date | string | number, timeZone: string = TIME_ZONE): string {
  return dtf(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, timeZone).format(toDate(value));
}

/** 18 พ.ย. 2569 14:30 · 18 Nov 2026 14:30 */
export function formatDateTime(
  locale: Locale,
  value: Date | string | number,
  timeZone: string = TIME_ZONE,
): string {
  return `${formatDate(locale, value, "short", timeZone)} ${formatTime(locale, value, timeZone)}`;
}

/** Month names, January first — for month pickers. */
export function monthNames(locale: Locale, width: "long" | "short" = "long"): string[] {
  const f = dtf(locale, { month: width }, "UTC");
  return Array.from({ length: 12 }, (_, m) => f.format(new Date(Date.UTC(2026, m, 1))));
}

/** Weekday names, Sunday first — for calendar headers. */
export function weekdayNames(locale: Locale, width: "long" | "short" | "narrow" = "short"): string[] {
  const f = dtf(locale, { weekday: width }, "UTC");
  // 2026-11-15 is a Sunday.
  return Array.from({ length: 7 }, (_, d) => f.format(new Date(Date.UTC(2026, 10, 15 + d))));
}

const rtfCache = new Map<Locale, Intl.RelativeTimeFormat>();
/** "เมื่อวาน", "อีก 3 วัน" · "yesterday", "in 3 days". */
export function formatRelativeDays(locale: Locale, days: number): string {
  let f = rtfCache.get(locale);
  if (!f) {
    f = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    rtfCache.set(locale, f);
  }
  return f.format(days, "day");
}

const nfCache = new Map<string, Intl.NumberFormat>();
/** Digit grouping is the same in both languages; only the words around it differ. */
export function formatNumber(
  locale: Locale,
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = nfCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", options);
    nfCache.set(key, f);
  }
  return f.format(value);
}

/** Bound to one locale — what `useFormat()` returns. */
export function createFormat(locale: Locale) {
  return {
    locale,
    date: (value: Date | string | number, style?: DateStyle, timeZone?: string) =>
      formatDate(locale, value, style, timeZone),
    time: (value: Date | string | number, timeZone?: string) => formatTime(locale, value, timeZone),
    dateTime: (value: Date | string | number, timeZone?: string) => formatDateTime(locale, value, timeZone),
    relativeDays: (days: number) => formatRelativeDays(locale, days),
    number: (value: number, options?: Intl.NumberFormatOptions) => formatNumber(locale, value, options),
    monthNames: (width?: "long" | "short") => monthNames(locale, width),
    weekdayNames: (width?: "long" | "short" | "narrow") => weekdayNames(locale, width),
  };
}

export type Format = ReturnType<typeof createFormat>;
