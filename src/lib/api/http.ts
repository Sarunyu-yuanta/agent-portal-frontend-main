import type { z } from "zod";
import { env } from "@/config/env";
import { ApiError, ResponseShapeError, TimeoutError } from "./errors";

/** A stalled request must not outlive the UI's patience. */
export const REQUEST_TIMEOUT_MS = 8_000;

type RequestOptions<T> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Serialized as JSON. */
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Validates the response; the parsed value is returned. Strongly recommended. */
  schema?: z.ZodType<T>;
  /** Cancels the request — TanStack Query passes one per query. */
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

/**
 * Provides the `Authorization` header. Registered by the session layer so this
 * module does not depend on it; returns `null` when signed out.
 */
let authHeaderProvider: () => string | null = () => null;

export function setAuthHeaderProvider(provider: () => string | null) {
  authHeaderProvider = provider;
}

function buildUrl(path: string, query?: RequestOptions<unknown>["query"]): string {
  const url = new URL(path.replace(/^\//, ""), env.apiBaseUrl.replace(/\/?$/, "/"));
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * The one way the app talks to the backend.
 *
 * - JSON in, JSON out; non-2xx → {@link ApiError}.
 * - Times out after {@link REQUEST_TIMEOUT_MS} → {@link TimeoutError}.
 * - With `schema`, the body is validated → {@link ResponseShapeError} on mismatch.
 */
export async function apiFetch<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const { method = "GET", body, query, schema, signal, headers } = options;
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;

  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const auth = authHeaderProvider();

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal: combined,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(auth && { Authorization: auth }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (timeout.aborted) throw new TimeoutError(path, timeoutMs);
    throw error;
  }

  const text = await response.text();
  const json: unknown = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new ApiError(response.status, `${method} ${path} failed with ${response.status}`, json);
  }
  if (!schema) return json as T;

  const result = schema.safeParse(json);
  if (!result.success) throw new ResponseShapeError(path, result.error.issues);
  return result.data;
}
