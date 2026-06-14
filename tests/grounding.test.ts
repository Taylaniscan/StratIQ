import { describe, it, expect } from "vitest";

import { validateCitations } from "@/lib/ai/grounding";

describe("validateCitations", () => {
  it("keeps valid cited ids and strips unknown ones", () => {
    const r = validateCitations("Risk is high.", ["a", "zzz", "a"], ["a", "b"]);
    expect(r.validCited).toEqual(["a"]);
    expect(r.strippedCount).toBe(1); // "zzz" once (dedup of "a")
  });

  it("sanitizes unknown inline [id] tokens to [unsupported]", () => {
    const r = validateCitations("Prices rose [a] but [zzz] is unverified.", ["a"], ["a", "b"]);
    expect(r.cleanSummary).toBe("Prices rose [a] but [unsupported] is unverified.");
    expect(r.strippedCount).toBe(1);
  });

  it("counts both invalid cited ids and invalid prose tokens", () => {
    const r = validateCitations("See [bad].", ["a", "bad"], ["a"]);
    expect(r.validCited).toEqual(["a"]);
    expect(r.cleanSummary).toBe("See [unsupported].");
    expect(r.strippedCount).toBe(2);
  });
});
