"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { NO_IDS, preferenceKey, readIds, subscribeIds, writeIds } from "@/lib/preferences";

/**
 * A set of ids kept as a lasting user preference — see {@link @/lib/preferences}
 * for why this outlives a reload while navigation memory does not.
 *
 * @param name Key within the `pref:` namespace, e.g. `client-hub:hidden-columns`.
 * @param isKnown Drops ids the code no longer defines, so a renamed or removed
 *   entry can't linger in a returning user's preference.
 */
export function useStoredIds<T extends string>(
  name: string,
  isKnown: (id: string) => boolean,
): [Set<T>, (next: Set<T>) => void] {
  const key = preferenceKey(name);

  const subscribe = useCallback((onChange: () => void) => subscribeIds(key, onChange), [key]);
  const getSnapshot = useCallback(() => readIds(key), [key]);
  // The server has no localStorage, so it renders the default; React swaps in
  // the stored value after hydration instead of mismatching the markup.
  const getServerSnapshot = useCallback(() => NO_IDS, []);

  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Kept stable so callers can memoize off it — `ids` only changes identity
  // when the stored value actually does.
  const known = useMemo(() => new Set(ids.filter(isKnown) as T[]), [ids, isKnown]);

  const set = useCallback((next: Set<T>) => writeIds(key, next), [key]);

  return [known, set];
}
