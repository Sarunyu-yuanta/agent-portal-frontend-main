"use client";

/**
 * The app's data-access seam.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * Nothing here talks to a network today. Every dataset is JSON that ships in the
 * bundle (`src/mocks/*.json`, assembled in `@/mocks/mock-data`), so each hook below
 * hands it straight back through {@link useStatic}.
 *
 * What the indirection buys is the swap: screens consume a {@link Resource},
 * never a bare array, and they already render skeletons against its
 * `isLoading`. Giving a dataset a real endpoint is a change *here* — see
 * {@link useStatic} for the diff — and the loading states light up on their own.
 *
 * The Product Catalog and Insights datasets have their own module,
 * `@/hooks/use-catalog`. This file holds the ones the dashboard shell needs.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getCallLogs, type CallLogEntry } from "@/mocks/call-log-data";
import { getClientProfile, type ClientProfile } from "@/mocks/client-profiles";
import { DEFAULT_ASSET_ACCOUNTS, type AssetAccountItem } from "@/mocks/asset-account-details";
import { mockClients, mockNBAActions, mockPipelineDeals, mockMiniKanban } from "@/mocks/mock-data";

/**
 * What every screen in this app reads data through: the value, whether it is
 * still on its way, and whether getting it failed.
 *
 * The point of naming it is that a component never has to care which half of
 * the app it is in. It reads `isLoading` / `error` and renders its skeleton or
 * its error state; whether those come from {@link useResource} (a real request)
 * or {@link useStatic} (data already in the bundle) is the data layer's
 * business, not the view's.
 *
 * ─── The order every screen checks ───────────────────────────────────────────
 *   isLoading → error → not-found → empty → data
 * `ResourceView` in `@/components/ui/empty-state` enforces it.
 *
 * - `error` — the FIRST load failed, so `data` is only the fallback and must
 *   not be shown as if it were real. Render `ErrorState` with `retry`.
 * - `isStale` — a LATER poll failed. `data` is the last good value; show it,
 *   with `StaleBanner` if the screen cares how fresh it is.
 *
 * Like loading, an error is a property of the data and never of the screen:
 * nothing in the app may simulate one with a flag or a timer.
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
 * A resource that is already settled: no request, no error. For stores that
 * hold their own state (`OrdersProvider`, `NotesProvider`, …) and for hooks
 * that assemble one resource out of others.
 */
export function staticResource<T>(data: T, isLoading = false): Resource<T> {
  return { data, isLoading, error: null, isStale: false, retry: NOOP };
}

/**
 * Data that ships in the bundle, wearing the same shape as a fetched resource.
 * `isLoading` is `false` because there is genuinely nothing to wait for, and
 * `error` is `null` because nothing can fail.
 *
 * ─── This is the backend seam ────────────────────────────────────────────────
 * Screens that have no endpoint yet still consume a {@link Resource}, so giving
 * one an endpoint is a change *here* rather than in the view:
 *
 * ```diff
 * - export function useClientsResource() {
 * -   return useStatic(mockClients);
 * - }
 * + export function useClientsResource() {
 * +   const fetcher = useCallback(() => fetchClients(), []);
 * +   return useResource("useClients", fetcher, []);
 * + }
 * ```
 *
 * The moment that swap happens `isLoading` starts going `true` on the first
 * render and the skeleton already wired to it appears — no component edited, no
 * switch to remember to flip. A failed request lights up the error state the
 * same way.
 */
export function useStatic<T>(data: T): Resource<T> {
  return staticResource(data);
}

/** How often {@link useResource} re-fetches by default. Pass `pollMs` for data
 *  that must be fresher (see "ความถี่การอัปเดตข้อมูล" in docs/api-by-page.md). */
const POLL_MS = 300_000;

/** A stalled request must not outlive the UI's patience. */
export const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Polls `fetcher` every `pollMs` (default {@link POLL_MS}) and returns the
 * latest value.
 *
 * - `isLoading` is true only until the FIRST attempt settles — later polls swap
 *   `data` in silently rather than re-triggering a skeleton.
 * - If the first attempt fails, `error` is set and `data` stays `fallback`.
 *   **Pass an empty value as `fallback`, never mock data:** a screen must not
 *   show invented figures as real when the API is down. The error state is what
 *   the user should see.
 * - If a later poll fails, `data` keeps the last good value and `isStale` goes
 *   true. Any success clears both.
 * - `retry()` fetches again immediately.
 *
 * Unused for now — it is the other half of the seam described on
 * {@link useStatic}, kept ready (and generic over its `fetcher`, so it needs no
 * particular API client) for whoever wires the first endpoint up.
 */
export function useResource<T>(
  label: string,
  fetcher: () => Promise<T>,
  fallback: T,
  { pollMs = POLL_MS }: { pollMs?: number } = {},
): Resource<T> {
  const [data, setData] = useState<T>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const resolvedOnce = useRef(false);

  const load = useCallback(() => {
    fetcher()
      .then((next) => {
        resolvedOnce.current = true;
        setData(next);
        setError(null);
        setIsStale(false);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        console.warn(`[${label}]`, err);
        if (resolvedOnce.current) {
          setIsStale(true);
        } else {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
        setIsLoading(false);
      });
  }, [fetcher, label]);

  useEffect(() => {
    load();
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return { data, isLoading, error, isStale, retry: load };
}

/** The client list, plus whether it is still loading. */
export function useClientsResource() {
  return useStatic(mockClients);
}

/** Just the client list — use {@link useClientsResource} when you also need `isLoading`. */
export function useClients() {
  return useClientsResource().data;
}

export function useNBAActions() {
  return useStatic(mockNBAActions);
}

export function usePipelineDeals() {
  return useStatic(mockPipelineDeals);
}

export function useMiniKanban() {
  return useStatic(mockMiniKanban).data;
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

// ── Client 360 per-tab resources ─────────────────────────────────────────────
// Each profile tab that would be its own endpoint reads through its own hook,
// so switching to a tab whose data is slow shows a skeleton in that tab only.

/** KYC tab: the client's KYC profile. */
/** `undefined` once loaded means the client has no profile on file. */
export function useClientProfile(clientId: string): Resource<ClientProfile | undefined> {
  const profile = useMemo(() => getClientProfile(clientId), [clientId]);
  return useStatic(profile);
}

/** Call Log tab: the client's calls. */
export function useClientCallLogs(clientId: string): Resource<CallLogEntry[]> {
  const logs = useMemo(() => getCallLogs(clientId), [clientId]);
  return useStatic(logs);
}

/** Assets tab: the client's accounts (one shared mock list today). */
export function useClientAssetAccounts(_clientId: string): Resource<AssetAccountItem[]> {
  return useStatic(DEFAULT_ASSET_ACCOUNTS);
}
