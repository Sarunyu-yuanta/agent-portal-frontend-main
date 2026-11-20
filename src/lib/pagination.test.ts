import { describe, expect, it } from "vitest";
import { pageCount, pageSlice } from "./pagination";

describe("pageCount", () => {
  it("is at least one page", () => {
    expect(pageCount(0, 10)).toBe(1);
  });
  it("rounds partial pages up", () => {
    expect(pageCount(21, 10)).toBe(3);
    expect(pageCount(20, 10)).toBe(2);
  });
});

describe("pageSlice", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);
  it("returns the requested page", () => {
    expect(pageSlice(items, 1, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(pageSlice(items, 3, 10)).toEqual([21, 22, 23, 24, 25]);
  });
  it("is empty past the end", () => {
    expect(pageSlice(items, 4, 10)).toEqual([]);
  });
});
