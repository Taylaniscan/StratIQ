import { describe, it, expect } from "vitest";

import { formatMinor, minorToNumber, parseAmountToMinor } from "@/lib/domain/money";

describe("parseAmountToMinor", () => {
  it("parses plain, formatted, and numeric amounts", () => {
    expect(parseAmountToMinor("1,234.56")).toBe(123456n);
    expect(parseAmountToMinor("$1,000")).toBe(100000n);
    expect(parseAmountToMinor("12500.00")).toBe(1250000n);
    expect(parseAmountToMinor("0.5")).toBe(50n);
    expect(parseAmountToMinor(1000)).toBe(100000n);
  });

  it("handles accounting-style and signed negatives", () => {
    expect(parseAmountToMinor("(500)")).toBe(-50000n);
    expect(parseAmountToMinor("-42.10")).toBe(-4210n);
  });

  it("throws on empty / non-numeric input", () => {
    expect(() => parseAmountToMinor("")).toThrow();
    expect(() => parseAmountToMinor("abc")).toThrow();
  });
});

describe("formatMinor / minorToNumber", () => {
  it("formats minor units as currency", () => {
    expect(formatMinor(123456n, "USD")).toContain("1,235");
    expect(minorToNumber(123456n)).toBeCloseTo(1234.56);
  });
});
