import { z } from "zod";

/**
 * Public runtime configuration, validated once at startup.
 *
 * Only `NEXT_PUBLIC_*` variables reach the browser, and Next inlines them at
 * build time — so each one must be read by its literal name below (no dynamic
 * `process.env[key]`). See `.env.example` for what each does.
 */
const schema = z.object({
  /**
   * `mock` serves every endpoint from the bundled data in `src/mocks`.
   * `http` calls the backend for every endpoint that has an `http`
   * implementation, and still falls back to mock for the ones that don't —
   * so endpoints can be wired one at a time.
   */
  NEXT_PUBLIC_API_MODE: z.enum(["mock", "http"]).default("mock"),
  /** Base URL of the backend (BFF). Required in `http` mode. */
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_API_MODE: process.env.NEXT_PUBLIC_API_MODE,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
}

if (parsed.data.NEXT_PUBLIC_API_MODE === "http" && !parsed.data.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required when NEXT_PUBLIC_API_MODE=http");
}

export const env = {
  apiMode: parsed.data.NEXT_PUBLIC_API_MODE,
  apiBaseUrl: parsed.data.NEXT_PUBLIC_API_BASE_URL ?? "",
} as const;
