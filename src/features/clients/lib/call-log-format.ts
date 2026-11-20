import type { Dictionary } from "@/i18n/dictionaries/th";

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

export function relativeCallDate(dateStr: string, t: Dictionary): string {
  const [d, m, y] = dateStr.split(" ");
  const date = new Date(Number(y), MONTHS[m] ?? 0, Number(d));
  if (isNaN(date.getTime())) return dateStr;
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  const w = t.dates;
  if (days <= 0) return w.today;
  if (days === 1) return w.yesterday;
  if (days < 7) return w.daysAgo(days);
  if (days < 30) return w.weeksAgo(Math.floor(days / 7));
  return w.monthsAgo(Math.floor(days / 30));
}
