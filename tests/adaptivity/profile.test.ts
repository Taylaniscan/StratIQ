import { describe, it, expect } from "vitest";

import {
  contextProfileSchema,
  onboardingInputSchema,
} from "@/lib/adaptivity/profile";

const VALID_INPUT = {
  orgName: "Acme Corp",
  workspaceName: "Facilities management",
  taxonomyL1: "Facilities",
  orgTier: "SMALL",
  categoryArchetype: "INDIRECT_SERVICE",
  maturity: "FOUNDATIONAL",
  dataReadiness: "FILES",
};

describe("onboardingInputSchema", () => {
  it("accepts a complete, valid payload", () => {
    expect(onboardingInputSchema.safeParse(VALID_INPUT).success).toBe(true);
  });

  it("trims and rejects too-short names", () => {
    expect(onboardingInputSchema.safeParse({ ...VALID_INPUT, orgName: "a" }).success).toBe(false);
    expect(onboardingInputSchema.safeParse({ ...VALID_INPUT, workspaceName: "  " }).success).toBe(false);
  });

  it("rejects unknown enum values", () => {
    expect(onboardingInputSchema.safeParse({ ...VALID_INPUT, orgTier: "HUGE" }).success).toBe(false);
    expect(
      onboardingInputSchema.safeParse({ ...VALID_INPUT, categoryArchetype: "SERVICES" }).success,
    ).toBe(false);
  });
});

describe("contextProfileSchema", () => {
  it("parses a valid profile", () => {
    const parsed = contextProfileSchema.parse({
      orgTier: "ENTERPRISE",
      categoryArchetype: "DIRECT_MATERIAL",
      maturity: "ADVANCED",
      dataReadiness: "CONNECTED",
    });
    expect(parsed.orgTier).toBe("ENTERPRISE");
  });

  it("rejects an incomplete profile", () => {
    expect(contextProfileSchema.safeParse({ orgTier: "SMALL" }).success).toBe(false);
  });
});
