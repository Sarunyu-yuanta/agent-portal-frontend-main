"use client";

import { DEFAULT_LOCALE } from "@/i18n/config";
import { localeOf, localizePath } from "@/i18n/locale-path";

/**
 * Helpers for keeping view state — category tab, filter chip, open panel, sub-tab
 * — in the query string instead of in component state that dies on unmount.
 *
 * These use the native History API rather than `router.push/replace`. Every
 * param involved is read on the client through `useSearchParams`, so a router
 * navigation would buy a pointless RSC round-trip (and a scroll reset) for a
 * change the server has no opinion about. Next patches `pushState` /
 * `replaceState` into its router, so `usePathname` / `useSearchParams` stay in
 * sync and browser back/forward keep working.
 */

/** Builds a URL from the current params with `updates` applied (`null` deletes). */
export function withQuery(
  pathname: string,
  current: URLSearchParams | string,
  updates: Record<string, string | null>,
): string {
  const params = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * `push` for state the user should be able to walk out of with the back button
 * (a category tab, an opened panel); `replace` for refinements that would
 * otherwise pile up entries they have to click through (filters, sub-tabs).
 */
export function setQueryState(url: string, mode: "push" | "replace" = "replace") {
  // Callers pass unprefixed app paths (`/client-hub?...`). Keep the language
  // the page is already in — writing a bare path here would silently drop it.
  const localized = localizePath(url, localeOf(window.location.pathname) ?? DEFAULT_LOCALE);
  if (mode === "push") window.history.pushState(null, "", localized);
  else window.history.replaceState(null, "", localized);
}
