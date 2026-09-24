"use client";

/**
 * Session-scoped "where the user left off" memory, keyed by sidebar section.
 *
 * A sidebar entry is a section *entry point*, not a fixed destination: coming
 * back to Client 360 from another section should land on the client the user
 * was reading — the same place browser-back goes. Storing the full URL (path +
 * query) is what makes tab / filter / panel state come back with it, since all
 * of those now live in the query string.
 *
 * Session-scoped and cleared on every fresh document load — see
 * {@link ./nav-session} for why refresh counts as "start over".
 */

import { navRead, navWrite } from "./nav-session";

export type NavSectionKey =
  | "dashboard"
  | "client-hub"
  | "product-catalog"
  | "insights"
  | "promotions"
  | "performance"
  | "ic-learning"
  | "notes"
  | "calendar";

type NavSection = {
  key: NavSectionKey;
  /** The section's list page — the floor of its trail. */
  root: string;
  /** Every path prefix that counts as "inside" this section. */
  prefixes: string[];
};

const SECTIONS: NavSection[] = [
  { key: "dashboard", root: "/dashboard", prefixes: ["/dashboard"] },
  // Full Profile (/client/:id) is Client 360's deepest level, not its own section.
  { key: "client-hub", root: "/client-hub", prefixes: ["/client-hub", "/client"] },
  { key: "product-catalog", root: "/product-catalog", prefixes: ["/product-catalog"] },
  { key: "insights", root: "/insights", prefixes: ["/insights"] },
  { key: "promotions", root: "/promotions", prefixes: ["/promotions"] },
  { key: "performance", root: "/performance", prefixes: ["/performance"] },
  { key: "ic-learning", root: "/ic-learning", prefixes: ["/ic-learning"] },
  { key: "notes", root: "/notes", prefixes: ["/notes"] },
  { key: "calendar", root: "/calendar", prefixes: ["/calendar"] },
];

const isUnder = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

function sectionFor(pathname: string): NavSection | undefined {
  return SECTIONS.find((s) => s.prefixes.some((p) => isUnder(pathname, p)));
}

export function sectionForPath(pathname: string): NavSectionKey | null {
  return sectionFor(pathname)?.key ?? null;
}

const storageKey = (key: NavSectionKey) => `nav:last:${key}`;

function lastSectionPath(key: NavSectionKey): string | null {
  return navRead(storageKey(key));
}

/**
 * Query params scoped to one *visit* of a page rather than to the section — the
 * Stock tab's `?market=`.
 *
 * The breadcrumb trail stores whole URLs, so these come back when the user
 * drills into something from the page and presses back, which is the point.
 * Walking into the section again from the sidebar is a fresh arrival, not a
 * return: it resumes the page they left, at that page's defaults.
 */
const VISIT_SCOPED_PARAMS = ["market"];

/** The sidebar's "resume where I left off" target for a section, if it has one. */
export function sectionResumeUrl(key: NavSectionKey): string | null {
  const url = lastSectionPath(key);
  const [pathname, query] = url?.split("?") ?? [];
  if (!url || !query) return url;
  const params = new URLSearchParams(query);
  for (const param of VISIT_SCOPED_PARAMS) params.delete(param);
  const rest = params.toString();
  return rest ? `${pathname}?${rest}` : pathname;
}

// ── Breadcrumb trail ────────────────────────────────────────────────────────
// An in-app "back" button means *up one level*, not *whatever I looked at
// last*. Browser history can't express that: arrive at a bond detail from
// Client 360 (or from a session restore) and history's previous entry is
// Client 360, so `router.back()` walks out of the page the user is reading.
//
// So we keep the trail ourselves: the chain of pages that led to the current
// one, within this section. Revisiting a pathname truncates the trail back to
// it, which is what keeps drill-across chains (bond → company → bond) honest
// instead of growing forever.

const trailKey = (key: NavSectionKey) => `nav:trail:${key}`;
const PREV_URL_KEY = "nav:prev-url";
const CURRENT_URL_KEY = "nav:current-url";
const TRAIL_LIMIT = 20;

/** Path part of a stored trail entry — the query never makes its own rung. */
export const urlPathname = (url: string) => url.split("?")[0];

function readTrail(key: NavSectionKey): string[] {
  const raw = navRead(trailKey(key));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * The trail *including* `url` — every page walked through to reach it.
 *
 * Deliberately independent of whether {@link recordVisit} has run yet: it
 * derives the trail rather than reading a recorded one, so the header can build
 * a breadcrumb during render without depending on effect ordering.
 */
export function sectionTrail(pathname: string, url: string): string[] {
  const section = sectionFor(pathname);
  if (!section) return [];

  // The section's list page is the floor: landing on it is starting over, never
  // nesting under whatever was open. Without this, arriving at a deep page
  // first (a refresh, a restored sidebar link) and then walking up would append
  // the list *below* that page and the breadcrumb would name it twice.
  if (pathname === section.root) return [url];

  const trail = readTrail(section.key);
  const append = (rungs: string[]) => rungs.concat(url).slice(-TRAIL_LIMIT);

  // Already on the trail — the user walked back up, so drop everything below
  // it. Query strings don't create levels either: `?category=fixed-income` is
  // the same rung as `?category=global-bond`, so match on pathname and let the
  // newer URL replace the older one in place.
  const existing = trail.findIndex((entry) => urlPathname(entry) === pathname);
  if (existing >= 0) return append(trail.slice(0, existing));

  // A sibling of the current page — a "Recommended Bonds" card, a related
  // insight, another client — swaps the leaf instead of nesting under it, the
  // same way the URL swaps one id rather than growing a level.
  const last = trail[trail.length - 1];
  if (last && parentPath(urlPathname(last)) === parentPath(pathname)) {
    return append(trail.slice(0, -1));
  }

  return append(trail);
}

/** Everything above the last path segment — two paths sharing it are siblings. */
const parentPath = (pathname: string) =>
  pathname.slice(0, pathname.lastIndexOf("/"));

/** Records a navigation: section memory, breadcrumb trail and previous URL. */
export function recordVisit(pathname: string, url: string) {
  const current = navRead(CURRENT_URL_KEY);
  if (current === url) return; // re-render, or a reload of the same URL
  if (current) navWrite(PREV_URL_KEY, current);
  navWrite(CURRENT_URL_KEY, url);

  // The forced-entry marker only covers the one navigation it was set for —
  // once the user has moved on to a different page, it would otherwise go on
  // suppressing a *later*, genuine cross-section referrer for whatever page
  // happens to reuse that pathname (e.g. revisiting the same insight from
  // Product Catalog afterwards).
  if (navRead(FORCED_ENTRY_KEY) && navRead(FORCED_ENTRY_KEY) !== pathname) {
    navWrite(FORCED_ENTRY_KEY, "");
  }

  const section = sectionForPath(pathname);
  if (!section) return;

  // A cross-section guest page (e.g. an Insight opened from Product Catalog)
  // isn't really "being in" Insights — recording it as that section's last
  // visit would make the sidebar's "resume Insights" link point right back
  // at this very guest page, so clicking it would silently no-op instead of
  // navigating anywhere.
  if (!crossSectionReferrer(pathname)) {
    navWrite(storageKey(section), url);
    navWrite(trailKey(section), JSON.stringify(sectionTrail(pathname, url)));
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NAV_VISIT_EVENT));
  }
}

/** URL the user was on immediately before the current one, across sections. */
export function previousVisit(): string | null {
  return navRead(PREV_URL_KEY);
}

function currentVisit(): string | null {
  return navRead(CURRENT_URL_KEY);
}

const NAV_VISIT_EVENT = "nav:visit";

/** Lets breadcrumbs re-read session memory after {@link recordVisit} runs. */
export function subscribeNavVisits(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(NAV_VISIT_EVENT, handler);
  return () => window.removeEventListener(NAV_VISIT_EVENT, handler);
}

/** Snapshot for {@link subscribeNavVisits} — changes whenever visit memory updates. */
export function navVisitSnapshot(): string {
  return `${navRead(CURRENT_URL_KEY) ?? ""}|${navRead(PREV_URL_KEY) ?? ""}`;
}

/** Routes that can be opened from another workspace section (guest pages). */
function borrowsCrossSectionReferrer(pathname: string): boolean {
  return /^\/insights\/[^/]+$/.test(pathname);
}

const FORCED_ENTRY_KEY = "nav:forced-entry";

/**
 * Marks `pathname` as a deliberate entry into its own section, overriding
 * {@link crossSectionReferrer}'s URL-history heuristic for it.
 *
 * That heuristic can't otherwise tell apart two situations that leave
 * identical breadcrumbs in `previousVisit()`: a Product Catalog card opening
 * a guest page like `/insights/:id`, versus the sidebar's own "resume where I
 * left off" link landing on that very same guest page because it's the last
 * Insights article the user had open. Both have Product Catalog as the
 * immediately preceding URL — only the *click* (an explicit section-entry
 * gesture) knows which one this is, so it has to say so up front, before the
 * navigation happens.
 */
export function markSectionEntry(pathname: string) {
  navWrite(FORCED_ENTRY_KEY, pathname);
}

/**
 * The page the user came from when entering `pathname` from another section.
 *
 * Only applies on guest routes such as `/insights/:id`. When the user has
 * already navigated back to their home section (e.g. Product Catalog), we must
 * not treat `previousVisit` pointing at Insights as a cross-section referrer —
 * that would hijack the sidebar, breadcrumb, and smart-resume links.
 *
 * Checks the stored current URL first — on the first render after a
 * cross-section navigation, {@link recordVisit} has not run yet, so the
 * referrer is still in `nav:current-url`. After it runs, the referrer moves
 * to {@link previousVisit}.
 *
 * The two are checked in that order, and `currentVisit` short-circuits
 * rather than falling through: once it agrees this page belongs to its own
 * section (an ordinary hop from one guest page to another, or from the
 * section's own root), older history has nothing to add. Checking
 * `previousVisit` unconditionally would let a hop two or more pages deep
 * inside the section resurface a much older, unrelated cross-section
 * referrer that `currentVisit` had already ruled out.
 */
export function crossSectionReferrer(pathname: string): string | null {
  if (!borrowsCrossSectionReferrer(pathname)) return null;
  if (navRead(FORCED_ENTRY_KEY) === pathname) return null;

  const pageSection = sectionForPath(pathname);
  if (!pageSection) return null;

  const current = currentVisit();
  if (current && urlPathname(current) !== pathname) {
    const currentSection = sectionForPath(urlPathname(current));
    if (currentSection) return currentSection === pageSection ? null : current;
  }

  const prev = previousVisit();
  if (prev && urlPathname(prev) !== pathname) {
    const prevSection = sectionForPath(urlPathname(prev));
    if (prevSection && prevSection !== pageSection) return prev;
  }

  return null;
}

/**
 * When the current page was opened from another section, stitch the referrer
 * section's trail onto this page — e.g. Product Catalog → House View insight.
 */
export function crossSectionTrail(pathname: string, url: string): string[] | null {
  const referrer = crossSectionReferrer(pathname);
  if (!referrer) return null;

  const refPathname = urlPathname(referrer);
  const prefix = sectionTrail(refPathname, referrer);
  if (prefix.length === 0) return [referrer, url];

  const last = prefix[prefix.length - 1];
  if (urlPathname(last) !== refPathname) return [...prefix, referrer, url];
  return [...prefix, url];
}

/**
 * Which sidebar section should appear active on `pathname`.
 *
 * Cross-section drill-ins (e.g. Product Catalog → `/insights/:id`) keep the
 * section the user came from lit, not the destination route's section.
 */
export function activeSectionForPath(pathname: string): NavSectionKey | null {
  const referrer = crossSectionReferrer(pathname);
  if (referrer) {
    const fromSection = sectionForPath(urlPathname(referrer));
    if (fromSection) return fromSection;
  }
  return sectionForPath(pathname);
}

/** The trail entry one rung above `pathname`, or `fallback` if it has none. */
export function parentTrailUrl(pathname: string, fallback: string): string {
  const section = sectionForPath(pathname);
  if (!section) return fallback;
  const trail = readTrail(section);
  const idx = trail.findIndex((entry) => urlPathname(entry) === pathname);
  return idx > 0 ? trail[idx - 1] : fallback;
}

// ── Product Catalog list URL ────────────────────────────────────────────────
// Tracked separately from the section path: the section path may point at a
// detail page, but a detail page's "back" needs the *list* it belongs to,
// with the category tab the user had open.

const CATALOG_LIST_KEY = "nav:last:product-catalog-list";

export function rememberCatalogList(url: string) {
  navWrite(CATALOG_LIST_KEY, url);
}

export function catalogListUrl(): string {
  return navRead(CATALOG_LIST_KEY) ?? "/product-catalog";
}
