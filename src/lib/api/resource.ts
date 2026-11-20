"use client";

import { useState } from "react";

/**
 * What every screen reads data through: the value, whether it is still on its
 * way, and whether getting it failed. A view never cares where the data came
 * from — it renders from these four fields.
 *
 * ─── The order every screen checks ───────────────────────────────────────────
 *   isLoading → error → not-found → empty → data
 * `ResourceView` in `@/components/ui/empty-state` enforces it.
 *
 * - `error` — the FIRST load failed, so `data` is only the fallback and must
 *   not be shown as if it were real. Render `ErrorState` with `retry`.
 * - `isStale` — a LATER refresh failed. `data` is the last good value; show it,
 *   with `StaleBanner` if the screen cares how fresh it is.
 */
export type Resource<T> = {
  data: T;
  isLoading: boolean;
  error: Error | null;
  isStale: boolean;
  retry: () => void;
};

const NOOP = () => {};

/**
 * A resource that is already settled: no request, no error. For values that
 * come from a client-side store (`OrdersProvider`, `NotesProvider`, …) or are
 * derived from other resources.
 */
export function staticResource<T>(data: T, isLoading = false): Resource<T> {
  return { data, isLoading, error: null, isStale: false, retry: NOOP };
}

/**
 * Whether a screen has finished its FIRST load. Starts `false` while
 * `isLoading`, flips to `true` the first time it isn't, and stays there.
 *
 * The two-level loading model: until a page has loaded once, the whole page —
 * tab strip included — is skeleton. After that, tabs stay real and clickable,
 * and a tab whose own data is still coming shows a skeleton in its content
 * only. Pass the loading flag of whatever the page shows first.
 */
export function useHasLoaded(isLoading: boolean): boolean {
  const [loaded, setLoaded] = useState(!isLoading);
  if (!isLoading && !loaded) setLoaded(true);
  return loaded;
}
