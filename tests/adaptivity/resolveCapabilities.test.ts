import { describe, it, expect } from "vitest";

import {
  resolveCapabilities,
  withProfileDefaults,
  type ContextProfile,
} from "@/lib/adaptivity";

const SMALL_SERVICE: ContextProfile = {
  orgTier: "SMALL",
  categoryArchetype: "INDIRECT_SERVICE",
  maturity: "FOUNDATIONAL",
  dataReadiness: "FILES",
};

const ENTERPRISE_MATERIAL: ContextProfile = {
  orgTier: "ENTERPRISE",
  categoryArchetype: "DIRECT_MATERIAL",
  maturity: "ADVANCED",
  dataReadiness: "CONNECTED",
};

describe("resolveCapabilities — purity", () => {
  it("is deterministic (deep-equal across calls)", () => {
    expect(resolveCapabilities(SMALL_SERVICE)).toEqual(
      resolveCapabilities(SMALL_SERVICE),
    );
  });

  it("returns fresh objects callers cannot use to mutate config", () => {
    const a = resolveCapabilities(SMALL_SERVICE);
    a.frameworks.push("PESTLE");
    const b = resolveCapabilities(SMALL_SERVICE);
    expect(b.frameworks).toEqual(["KRALJIC"]);
  });
});

describe("resolveCapabilities — adaptivity acceptance (§2.4)", () => {
  const small = resolveCapabilities(SMALL_SERVICE);
  const ent = resolveCapabilities(ENTERPRISE_MATERIAL);

  it("changes visible modules across profiles", () => {
    expect(small.enabledModules).not.toContain("M12");
    expect(small.enabledModules).not.toContain("M7");
    expect(ent.enabledModules).toContain("M12");
    expect(ent.enabledModules.length).toBeGreaterThan(small.enabledModules.length);
  });

  it("changes the role set (3 vs 8)", () => {
    expect(small.roleSet).toHaveLength(3);
    expect(ent.roleSet).toHaveLength(8);
  });

  it("changes the approval chain depth (1 vs council)", () => {
    expect(small.approvalChain).toHaveLength(1);
    expect(ent.approvalChain).toHaveLength(3);
  });

  it("changes frameworks (Kraljic-only vs many)", () => {
    expect(small.frameworks).toEqual(["KRALJIC"]);
    expect(ent.frameworks.length).toBeGreaterThan(1);
    expect(ent.frameworks).toContain("KRALJIC");
  });

  it("changes option rigor (POINT vs PROBABILISTIC)", () => {
    expect(small.optionPolicy.scenarios).toBe("POINT");
    expect(small.optionPolicy.baseline).toBe(true);
    expect(ent.optionPolicy.scenarios).toBe("PROBABILISTIC");
  });

  it("changes archetype-shaped requirement fields", () => {
    const smallIds = small.requirementFields.map((f) => f.id);
    const entIds = ent.requirementFields.map((f) => f.id);
    expect(smallIds).toContain("scopeOfWork");
    expect(entIds).toContain("bom");
    expect(smallIds).not.toContain("bom");
  });
});

describe("resolveCapabilities — SMALL invariants", () => {
  const small = resolveCapabilities(SMALL_SERVICE);

  it("never exposes the external supplier role or SSO/SCIM", () => {
    expect(small.roleSet).not.toContain("SUPPLIER_USER");
    expect(small.sso).toBe(false);
    expect(small.scim).toBe(false);
  });

  it("uses plainer terminology", () => {
    expect(small.terminology.supplierSingular).toBe("Vendor");
  });
});

describe("resolveCapabilities — integration mode clamp", () => {
  it("clamps CONNECTED down for tiers that don't allow it", () => {
    expect(
      resolveCapabilities({ ...SMALL_SERVICE, dataReadiness: "CONNECTED" }).integrationMode,
    ).toBe("FILES");
    expect(
      resolveCapabilities({
        orgTier: "MID",
        categoryArchetype: "INDIRECT_GOODS",
        maturity: "DEVELOPING",
        dataReadiness: "CONNECTED",
      }).integrationMode,
    ).toBe("FILES");
  });

  it("allows CONNECTED for ENTERPRISE and passes through MANUAL", () => {
    expect(resolveCapabilities(ENTERPRISE_MATERIAL).integrationMode).toBe("CONNECTED");
    expect(
      resolveCapabilities({ ...SMALL_SERVICE, dataReadiness: "MANUAL" }).integrationMode,
    ).toBe("MANUAL");
  });
});

describe("resolveCapabilities — uiDensity blend", () => {
  it("FOUNDATIONAL is GUIDED, ADVANCED is EXPERT, DEVELOPING uses the tier default", () => {
    expect(resolveCapabilities(SMALL_SERVICE).uiDensity).toBe("GUIDED");
    expect(resolveCapabilities(ENTERPRISE_MATERIAL).uiDensity).toBe("EXPERT");
    expect(
      resolveCapabilities({
        orgTier: "MID",
        categoryArchetype: "INDIRECT_GOODS",
        maturity: "DEVELOPING",
        dataReadiness: "FILES",
      }).uiDensity,
    ).toBe("STANDARD");
  });
});

describe("withProfileDefaults", () => {
  it("fills missing dimensions with defaults", () => {
    expect(withProfileDefaults({ orgTier: "ENTERPRISE" })).toEqual({
      orgTier: "ENTERPRISE",
      categoryArchetype: "INDIRECT_SERVICE",
      maturity: "FOUNDATIONAL",
      dataReadiness: "FILES",
    });
  });

  it("produces a profile resolveCapabilities accepts", () => {
    const caps = resolveCapabilities(withProfileDefaults({ categoryArchetype: "CAPEX_PROJECT" }));
    expect(caps.requirementFields.map((f) => f.id)).toContain("projectScope");
  });
});
