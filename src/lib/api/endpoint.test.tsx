import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createQueryClient } from "./query-client";
import { defineEndpoint, useEndpoint, type Endpoint } from "./endpoint";

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>;
}

/** An endpoint served over "HTTP" (a test function), bypassing env. */
function httpEndpoint<T>(fetch: () => Promise<T>): Endpoint<[], T> {
  return {
    key: `test-${Math.random()}`,
    isMock: false,
    fetch: () => fetch(),
    peek: () => undefined,
  };
}

describe("defineEndpoint (mock mode)", () => {
  it("serves the mock synchronously", () => {
    const endpoint = defineEndpoint("greeting", { mock: (name: string) => `hi ${name}` });
    expect(endpoint.isMock).toBe(true);
    expect(endpoint.peek(["ann"])).toBe("hi ann");
  });
});

describe("useEndpoint", () => {
  it("renders mock data on the first frame, without a loading state", () => {
    const endpoint = defineEndpoint("numbers", { mock: () => [1, 2, 3] });
    const { result } = renderHook(() => useEndpoint(endpoint, [], { fallback: [] }), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([1, 2, 3]);
  });

  it("keeps `undefined` results (not-found lookups) as data", () => {
    const endpoint = defineEndpoint("missing", {
      mock: (_id: string) => undefined as string | undefined,
    });
    const { result } = renderHook(() => useEndpoint(endpoint, ["x"], { fallback: undefined }), {
      wrapper,
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("shows the fallback while loading, then the response", async () => {
    const endpoint = httpEndpoint(() => Promise.resolve(["real"]));
    const { result } = renderHook(() => useEndpoint(endpoint, [], { fallback: [] as string[] }), {
      wrapper,
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(["real"]);
    expect(result.current.error).toBeNull();
  });

  it("reports a first-load failure as `error` and keeps the fallback", async () => {
    const endpoint = httpEndpoint<string[]>(() => Promise.reject(new Error("down")));
    const { result } = renderHook(() => useEndpoint(endpoint, [], { fallback: [] as string[] }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.error).not.toBeNull(), { timeout: 10_000 });
    expect(result.current.data).toEqual([]);
    expect(result.current.isStale).toBe(false);
  });
});
