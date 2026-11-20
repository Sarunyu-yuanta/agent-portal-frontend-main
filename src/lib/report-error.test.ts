import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { reportError } from "./report-error";

describe("reportError", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("logs the full error in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = new Error("boom");
    reportError("[x] failed", error);
    expect(warn).toHaveBeenCalledWith("[x] failed", error);
  });

  it("logs no message or payload in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    reportError(
      "[x] failed",
      new ApiError(500, "GET /clients/110001 failed", { email: "a@example.com" }),
    );
    expect(warn).toHaveBeenCalledWith("[x] failed", "ApiError (500)");
    expect(JSON.stringify(warn.mock.calls)).not.toContain("110001");
  });

  it("does not log non-Error values in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    reportError("[x] failed", { secret: "s3cret" });
    expect(warn).toHaveBeenCalledWith("[x] failed", "object");
  });
});
