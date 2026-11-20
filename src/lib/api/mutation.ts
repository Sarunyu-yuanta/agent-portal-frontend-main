import { env } from "@/config/env";

type MutationImpl<A extends unknown[], T> = {
  /** Stand-in used until the backend exists (and for endpoints it doesn't serve yet). */
  mock: (...args: A) => Promise<T>;
  /** The real request via `apiFetch`. Used when `NEXT_PUBLIC_API_MODE=http`. */
  http?: (...args: A) => Promise<T>;
};

/**
 * Declares one backend write — the counterpart of `defineEndpoint` for
 * commands (sign in, submit, send). Callers just `await` the returned
 * function; whether it hit the mock or the API is decided here.
 */
export function defineMutation<A extends unknown[], T>(
  impl: MutationImpl<A, T>,
): (...args: A) => Promise<T> {
  return env.apiMode === "http" && impl.http ? impl.http : impl.mock;
}
