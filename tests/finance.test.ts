import { describe, it, expect } from "vitest";

import { computeNpvMinor, expectedSavingsMinor, weightedScore } from "@/lib/domain/finance";

describe("computeNpvMinor", () => {
  it("discounts level annual savings minus upfront cost", () => {
    // 1 year, 1000.00 savings, 0 cost, 10% -> 1000/1.1 = 909.09 -> 90909 minor
    expect(computeNpvMinor(100000n, 1, 0n, 10)).toBe(90909n);
  });

  it("subtracts implementation cost at year 0", () => {
    // cost 100000 minor, no savings -> NPV = -100000
    expect(computeNpvMinor(0n, 3, 100000n, 10)).toBe(-100000n);
  });

  it("positive over multiple years when savings outweigh cost", () => {
    expect(computeNpvMinor(100000n, 5, 100000n, 10)).toBeGreaterThan(0n);
  });
});

describe("expectedSavingsMinor", () => {
  it("weights base/upside/downside 60/20/20", () => {
    // 100*0.6 + 200*0.2 + 50*0.2 = 60+40+10 = 110
    expect(expectedSavingsMinor(10000n, 20000n, 5000n)).toBe(11000n);
  });
});

describe("weightedScore", () => {
  it("computes a weighted average over criteria", () => {
    const criteria = [
      { id: "a", weight: 3 },
      { id: "b", weight: 1 },
    ];
    const scores = [
      { criterionId: "a", score: 80 },
      { criterionId: "b", score: 40 },
    ];
    // (80*3 + 40*1) / 4 = 280/4 = 70
    expect(weightedScore(scores, criteria)).toBe(70);
  });

  it("returns 0 when no weighted criteria", () => {
    expect(weightedScore([], [])).toBe(0);
  });
});
