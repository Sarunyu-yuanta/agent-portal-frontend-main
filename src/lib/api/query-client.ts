import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./errors";

/** Five minutes — the default poll tier in docs/api-by-page.md. */
const DEFAULT_STALE_MS = 5 * 60_000;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_MS,
        refetchOnWindowFocus: false,
        // Retrying a 4xx only repeats the same answer.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < 500) && failureCount < 2,
      },
    },
  });
}
