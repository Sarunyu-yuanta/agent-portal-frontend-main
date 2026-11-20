import { describe, expect, it } from "vitest";
import { formatDecimal, formatInteger } from "./number";

describe("formatInteger", () => {
  it("groups and rounds", () => {
    expect(formatInteger(1234567.6)).toBe("1,234,568");
    expect(formatInteger(0)).toBe("0");
    expect(formatInteger(-1500)).toBe("-1,500");
  });
  it("matches the toLocaleString call it replaces", () => {
    for (const n of [0.4, 999.5, 1e6, 123456.789]) {
      expect(formatInteger(n)).toBe(n.toLocaleString("en-US", { maximumFractionDigits: 0 }));
    }
  });
});

describe("formatDecimal", () => {
  it("pads to the requested digits", () => {
    expect(formatDecimal(1234.5)).toBe("1,234.50");
    expect(formatDecimal(1, 0)).toBe("1");
  });
});
