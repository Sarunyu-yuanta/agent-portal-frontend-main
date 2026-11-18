"use client";

/**
 * The Product Catalog search modal's "recent searches" row — durable across
 * visits (unlike the rest of this app's nav memory, which is session-scoped),
 * since a search history that vanishes on refresh isn't much of a history.
 */

const STORAGE_KEY = "productCatalog:recentSearches";

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Adds `term` to the front, de-duplicating case-insensitively. No cap — the row scrolls instead. */
export function addRecentSearch(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed || typeof window === "undefined") return getRecentSearches();

  const existing = getRecentSearches().filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
  const next = [trimmed, ...existing];

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable (private browsing) — the in-memory list
    // still reflects this search for the rest of the session.
  }
  return next;
}

export function clearRecentSearches(): string[] {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to reconcile — there's no in-memory list left to fall out of sync.
    }
  }
  return [];
}
