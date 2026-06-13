import { describe, it, expect } from "vitest";

import {
  ARCHETYPES,
  ORG_TIERS,
  MATURITY,
  DATA_READINESS,
  FIELD_REGISTRY,
  MODULE_LABELS,
  FRAMEWORK_LABELS,
  SOURCE_LABELS,
  LEVER_LABELS,
  KPI_LABELS,
} from "@/lib/adaptivity";

const ARCHETYPE_KEYS = ["DIRECT_MATERIAL", "INDIRECT_GOODS", "INDIRECT_SERVICE", "CAPEX_PROJECT"];
const TIER_KEYS = ["SMALL", "MID", "ENTERPRISE"];
const MATURITY_KEYS = ["FOUNDATIONAL", "DEVELOPING", "ADVANCED"];
const DATA_READINESS_KEYS = ["MANUAL", "FILES", "CONNECTED"];

describe("config completeness", () => {
  it("defines every dimension value", () => {
    expect(Object.keys(ARCHETYPES).sort()).toEqual([...ARCHETYPE_KEYS].sort());
    expect(Object.keys(ORG_TIERS).sort()).toEqual([...TIER_KEYS].sort());
    expect(Object.keys(MATURITY).sort()).toEqual([...MATURITY_KEYS].sort());
    expect(Object.keys(DATA_READINESS).sort()).toEqual([...DATA_READINESS_KEYS].sort());
  });
});

describe("config integrity", () => {
  it("every archetype requirement field has a FieldSpec", () => {
    for (const [name, cfg] of Object.entries(ARCHETYPES)) {
      for (const id of cfg.requirementFields) {
        expect(FIELD_REGISTRY[id], `${name}.${id}`).toBeDefined();
        expect(FIELD_REGISTRY[id].id).toBe(id);
      }
    }
  });

  it("every referenced source / lever / KPI has a UI label", () => {
    for (const cfg of Object.values(ARCHETYPES)) {
      for (const s of cfg.intelligenceSources) expect(SOURCE_LABELS[s], s).toBeTruthy();
      for (const l of cfg.strategyLevers) expect(LEVER_LABELS[l], l).toBeTruthy();
      for (const k of cfg.scorecardDimensions) expect(KPI_LABELS[k], k).toBeTruthy();
    }
  });

  it("every enabled module and framework has a UI label", () => {
    for (const cfg of Object.values(ORG_TIERS)) {
      for (const m of cfg.enabledModules) expect(MODULE_LABELS[m], m).toBeTruthy();
    }
    for (const cfg of Object.values(MATURITY)) {
      for (const f of cfg.frameworks) expect(FRAMEWORK_LABELS[f], f).toBeTruthy();
    }
  });
});
