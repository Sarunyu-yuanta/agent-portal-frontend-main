/**
 * Locale-independent number formatting for financial figures.
 *
 * Amounts in this app are always grouped the en-US way ("1,234,567") in both
 * languages — the desk's convention — so these do not take a locale. For
 * locale-aware numbers in running text use `useFormat().number`.
 */

const cache = new Map<string, Intl.NumberFormat>();

function formatter(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-US", options);
    cache.set(key, f);
  }
  return f;
}

/** "1,234,568" — grouped, rounded to a whole number. */
export function formatInteger(value: number): string {
  return formatter({ maximumFractionDigits: 0 }).format(value);
}

/** "1,234.50" — grouped, with exactly `digits` decimals (default 2). */
export function formatDecimal(value: number, digits = 2): string {
  return formatter({ minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}
