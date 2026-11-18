/**
 * Adding and removing the `/th` · `/en` prefix.
 *
 * The app's own code works on **unprefixed** paths everywhere — route tables,
 * breadcrumbs, the nav trail, path helpers like `catalogListHref`. The prefix
 * is added at the moment of navigating (`useLocalizedRouter`, `LocaleLink`,
 * `setQueryState`) and removed at the moment of reading (`useAppPathname`).
 * That keeps the 150-odd literal paths in the codebase untouched and the
 * stored nav trails language-neutral.
 *
 * Pure, so the proxy can use it.
 */

import { DEFAULT_LOCALE, hasLocale, type Locale } from "./config";

/** The locale a path starts with, or `null`. */
export function localeOf(path: string): Locale | null {
  const first = path.split("/")[1] ?? "";
  return hasLocale(first) ? first : null;
}

/** `/en/client-hub?x=1` → `/client-hub?x=1`. A path without a prefix is returned as is. */
export function stripLocale(path: string): string {
  const locale = localeOf(path);
  if (!locale) return path;
  const rest = path.slice(locale.length + 1);
  return rest === "" || rest.startsWith("?") || rest.startsWith("#") ? `/${rest}` : rest;
}

/**
 * `/client-hub` → `/en/client-hub`. Idempotent (an already-prefixed path is
 * re-prefixed with `locale`, so this also switches language), and leaves
 * anything that isn't an app path alone: external URLs, `mailto:`/`tel:`,
 * in-page `#anchors`, and relative paths.
 */
export function localizePath(path: string, locale: Locale = DEFAULT_LOCALE): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const bare = stripLocale(path);
  if (bare === "/") return `/${locale}`;
  // `/?q=1` → `/en?q=1`, not `/en/?q=1`.
  if (bare.startsWith("/?") || bare.startsWith("/#")) return `/${locale}${bare.slice(1)}`;
  return `/${locale}${bare}`;
}
