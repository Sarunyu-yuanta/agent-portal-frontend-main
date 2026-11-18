/**
 * The two languages the portal speaks, and how a request picks one.
 *
 * The locale is the first path segment (`/th/...`, `/en/...`). `src/proxy.ts`
 * adds it to a URL that arrives without one: the `NEXT_LOCALE` cookie first
 * (the last language the user chose), then the browser's `Accept-Language`,
 * then Thai.
 *
 * Pure — no React, no Next imports — so the proxy can use it too.
 */

export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "th";

/** Remembers the user's last choice, so a bare URL opens in that language. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function hasLocale(value: string | null | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? "");
}

/**
 * The best supported locale for an `Accept-Language` header, or `null`.
 * Honours `q` weights and matches on the primary subtag (`en-US` → `en`).
 * Hand-written rather than a dependency: two locales don't need a negotiator.
 */
export function matchAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((x) => x.tag && !Number.isNaN(x.q))
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const primary = tag.split("-")[0];
    if (hasLocale(primary)) return primary;
  }
  return null;
}
