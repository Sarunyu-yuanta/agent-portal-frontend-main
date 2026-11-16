"use client";

/**
 * The app's data-access seam.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * Nothing here talks to a network today. Every dataset is JSON that ships in the
 * bundle (`src/data/*.json`, assembled in `@/lib/mock-data`), so each hook below
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
import { getCallLogs, type CallLogEntry } from "@/data/call-log-data";
import { getClientProfile, type ClientProfile } from "@/data/client-profiles";
import { DEFAULT_ASSET_ACCOUNTS, type AssetAccountItem } from "@/data/asset-account-details";
import {
  mockClients,
  mockNBAActions,
  mockPipelineDeals,
  mockMiniKanban,
} from "@/lib/mock-data";

/**
 * What every screen in this app reads data through: the value, plus whether it
 * is still on its way.
 *
 * The point of naming it is that a component never has to care which half of
 * the app it is in. It reads `isLoading` and renders its skeleton; whether that
 * flag comes from {@link useResource} (a real request) or {@link useStatic}
 * (data already in the bundle) is the data layer's business, not the view's.
 */
export type Resource<T> = { data: T; isLoading: boolean };

/**
 * Data that ships in the bundle, wearing the same shape as a fetched resource.
 * `isLoading` is `false` because there is genuinely nothing to wait for.
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
 * +   return useResource("useClients", fetcher, mockClients);
 * + }
 * ```
 *
 * The moment that swap happens `isLoading` starts going `true` on the first
 * render and the skeleton already wired to it appears — no component edited, no
 * switch to remember to flip. That is the whole reason this returns a resource
 * instead of the bare value: it costs one line of indirection now and saves
 * having to re-plumb every screen later.
 */
export function useStatic<T>(data: T): Resource<T> {
  return { data, isLoading: false };
}

/** How often {@link useResource} re-fetches once it is given a real fetcher. */
const POLL_MS = 300_000;

/** A stalled request must not outlive the UI's patience — every caller passes a
 *  fallback, so giving up beats hanging. */
export const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Polls `fetcher` every {@link POLL_MS} and returns the latest value,
 * falling back to `fallback` until the first fetch resolves.
 * Rejections are logged (label) but don't reset the state.
 *
 * `isLoading` is only true up to the *first* fetch attempt settling — later
 * background polls swap `data` in silently rather than re-triggering a
 * loading state. A rejection still clears it: `fallback` is already valid
 * data to show, so there's nothing left to block the skeleton on.
 *
 * Unused for now — it is the other half of the seam described on
 * {@link useStatic}, kept ready (and generic over its `fetcher`, so it needs no
 * particular API client) for whoever wires the first endpoint up.
 */
export function useResource<T>(
  label: string,
  fetcher: () => Promise<T>,
  fallback: T,
): Resource<T> {
  const [data, setData] = useState<T>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const resolvedOnce = useRef(false);

  const settleOnce = useCallback(() => {
    if (!resolvedOnce.current) {
      resolvedOnce.current = true;
      setIsLoading(false);
    }
  }, []);

  const load = useCallback(() => {
    fetcher()
      .then((next) => {
        setData(next);
        settleOnce();
      })
      .catch((err) => {
        console.warn(`[${label}]`, err);
        settleOnce();
      });
  }, [fetcher, label, settleOnce]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { data, isLoading };
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
  return useStatic(mockNBAActions).data;
}

export function usePipelineDeals() {
  return useStatic(mockPipelineDeals).data;
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
export function useClientProfile(clientId: string): Resource<ClientProfile> {
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
