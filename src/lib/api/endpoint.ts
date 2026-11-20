"use client";

import { useQuery } from "@tanstack/react-query";
import { env } from "@/config/env";
import type { Resource } from "./resource";

/** Arguments an endpoint is keyed by — kept primitive so query keys stay stable. */
type Args = readonly (string | number | boolean | null)[];

export type Endpoint<A extends Args, T> = {
  /** Query-key prefix; unique per endpoint. */
  readonly key: string;
  /** `true` when this endpoint is answered from bundled mock data. */
  readonly isMock: boolean;
  fetch(args: A, signal?: AbortSignal): Promise<T>;
  /** The mock value, synchronously — `undefined` when served over HTTP. */
  peek(args: A): T | undefined;
};

type EndpointImpl<A extends Args, T> = {
  /** Answer from `src/mocks`. Required until the backend serves this data. */
  mock: (...args: A) => T;
  /** Answer from the backend via `apiFetch`. Used when `NEXT_PUBLIC_API_MODE=http`. */
  http?: (signal: AbortSignal | undefined, ...args: A) => Promise<T>;
};

/**
 * Declares one backend read.
 *
 * ```ts
 * export const clientsEndpoint = defineEndpoint("clients", {
 *   mock: () => mockClients,
 *   http: (signal) => apiFetch("/clients", { schema: clientListSchema, signal }),
 * });
 * ```
 *
 * Wiring an endpoint to the real API is adding its `http` implementation —
 * hooks and screens do not change. Endpoints without one keep answering from
 * mock even in `http` mode, so the backend can be connected one at a time.
 */
export function defineEndpoint<A extends Args, T>(
  key: string,
  impl: EndpointImpl<A, T>,
): Endpoint<A, T> {
  const http = env.apiMode === "http" ? impl.http : undefined;
  return {
    key,
    isMock: !http,
    fetch: (args, signal) => (http ? http(signal, ...args) : Promise.resolve(impl.mock(...args))),
    peek: (args) => (http ? undefined : impl.mock(...args)),
  };
}

const box = <T>(value: T) => ({ value });

type UseEndpointOptions<T> = {
  /**
   * Rendered while the first response is on its way, and after a first-load
   * failure. Pass an EMPTY value (`[]`, `null`) — never mock data: a screen must
   * not show invented figures as real when the API is down.
   */
  fallback: T;
  /** Re-fetch interval, ms. Pick it from the tiers in docs/api-by-page.md. */
  pollMs?: number;
  /** `false` skips the request (e.g. while a required id is still unknown). */
  enabled?: boolean;
};

/**
 * Reads an endpoint as a {@link Resource}. Built on TanStack Query, so requests
 * are cached, de-duplicated across components and cancelled on unmount.
 *
 * - `isLoading` is true only until the FIRST attempt settles; later polls swap
 *   `data` in without re-showing the skeleton.
 * - A mock-served endpoint is available synchronously, so it never shows a
 *   loading frame — exactly like the data it replaces.
 */
export function useEndpoint<A extends Args, T>(
  endpoint: Endpoint<A, T>,
  args: A,
  { fallback, pollMs, enabled = true }: UseEndpointOptions<T>,
): Resource<T> {
  const query = useQuery({
    queryKey: [endpoint.key, ...args],
    // Boxed: TanStack Query rejects `undefined` data, and "not found" lookups
    // legitimately resolve to `undefined`.
    queryFn: ({ signal }) => endpoint.fetch(args, signal).then(box),
    initialData: () => (endpoint.isMock ? box(endpoint.peek(args) as T) : undefined),
    // Bundled data never changes underneath us; don't re-"fetch" it.
    staleTime: endpoint.isMock ? Infinity : undefined,
    refetchInterval: endpoint.isMock ? false : pollMs,
    enabled,
  });

  return {
    data: query.data ? query.data.value : fallback,
    isLoading: enabled && query.isPending,
    error: query.isLoadingError ? query.error : null,
    isStale: query.isRefetchError,
    retry: () => void query.refetch(),
  };
}
