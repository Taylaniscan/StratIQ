import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { resolveCapabilities, type ContextProfile } from "@/lib/adaptivity";
import { adminPrisma } from "@/lib/db/admin";
import { prisma } from "@/lib/db/prisma";
import { provisionTenantWorkspace } from "@/lib/domain/onboarding";
import { getSimulation, saveSimulation, type SimulationInput } from "@/lib/domain/options";
import { publishReadiness } from "@/lib/domain/publish";
import type { OnboardingInput } from "@/lib/adaptivity/profile";

const RUN = randomUUID().slice(0, 8);
const tenantIds: string[] = [];

const PROFILE: ContextProfile = {
  orgTier: "ENTERPRISE",
  categoryArchetype: "DIRECT_MATERIAL",
  maturity: "ADVANCED",
  dataReadiness: "CONNECTED",
};
const CAPS = resolveCapabilities(PROFILE);

function onboarding(orgName: string): OnboardingInput {
  return { orgName, workspaceName: `Opt WS ${RUN}`, taxonomyL1: "Steel", ...PROFILE };
}

function freshCards() {
  const now = new Date();
  return [
    { category: "POSITIONING_INPUT", confidence: "HIGH" as const, collectedAt: now },
    { category: "DEMAND_BASIS", confidence: "MEDIUM" as const, collectedAt: now },
    { category: "SUPPLIER_UNIVERSE", confidence: "HIGH" as const, collectedAt: now },
  ];
}

describe("publishReadiness", () => {
  const threeOptions = [
    { isBaseline: true, isSelected: false },
    { isBaseline: false, isSelected: true },
    { isBaseline: false, isSelected: false },
  ];

  it("is ready when evidence + option policy are met", () => {
    const r = publishReadiness(CAPS, freshCards(), threeOptions, "x");
    expect(r.ready).toBe(true);
    expect(r.blockers).toHaveLength(0);
  });

  it("blocks on missing evidence, too few options, no baseline, none selected", () => {
    const r = publishReadiness(CAPS, [freshCards()[0]], [{ isBaseline: false, isSelected: false }], null);
    expect(r.ready).toBe(false);
    expect(r.blockers.join(" ")).toMatch(/Demand|Supplier/);
    expect(r.blockers.join(" ")).toMatch(/at least/i);
    expect(r.blockers.join(" ")).toMatch(/baseline/i);
    expect(r.blockers.join(" ")).toMatch(/select/i);
  });
});

describe("saveSimulation (DB)", () => {
  let tenantAId: string;
  let tenantBId: string;
  let workspaceAId: string;
  let actorAId: string;

  beforeAll(async () => {
    const a = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `opt_a_${RUN}@example.com`,
      input: onboarding(`Opt A ${RUN}`),
    });
    const b = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `opt_b_${RUN}@example.com`,
      input: onboarding(`Opt B ${RUN}`),
    });
    tenantAId = a.tenant.id;
    tenantBId = b.tenant.id;
    workspaceAId = a.workspace!.id;
    tenantIds.push(tenantAId, tenantBId);
    const m = await adminPrisma.membership.findFirst({ where: { tenantId: tenantAId } });
    actorAId = m!.userId;
  });

  afterAll(async () => {
    await adminPrisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await adminPrisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    await Promise.all([adminPrisma.$disconnect(), prisma.$disconnect()]);
  });

  const lever = CAPS.strategyLevers[0];

  function sim(overrides: Partial<SimulationInput> = {}): SimulationInput {
    return {
      criteria: [
        { name: "Savings", weight: 3 },
        { name: "Risk", weight: 1 },
      ],
      options: [
        {
          label: "Baseline", isBaseline: true, isSelected: false, leversApplied: [],
          implCostMinor: 0n, savingsBaseMinor: 0n, savingsUpsideMinor: 0n, savingsDownsideMinor: 0n,
          horizonYears: 3, scores: [{ criterionIndex: 0, score: 0 }, { criterionIndex: 1, score: 50 }],
        },
        {
          label: "Consolidate", isBaseline: false, isSelected: true, leversApplied: [lever],
          implCostMinor: 50000n, savingsBaseMinor: 100000n, savingsUpsideMinor: 150000n, savingsDownsideMinor: 50000n,
          horizonYears: 3, scores: [{ criterionIndex: 0, score: 80 }, { criterionIndex: 1, score: 60 }],
        },
      ],
      ...overrides,
    };
  }

  it("persists criteria, options, scores and computes NPV", async () => {
    await saveSimulation(tenantAId, workspaceAId, actorAId, sim(), CAPS.strategyLevers);
    const loaded = await getSimulation(tenantAId, workspaceAId);
    expect(loaded.criteria).toHaveLength(2);
    expect(loaded.options).toHaveLength(2);
    const consolidate = loaded.options.find((o) => o.label === "Consolidate");
    expect(consolidate?.npvMinor).toBeGreaterThan(0n);
    expect(consolidate?.scores).toHaveLength(2);
  });

  it("rejects an ungated lever", async () => {
    await expect(
      saveSimulation(
        tenantAId,
        workspaceAId,
        actorAId,
        sim({
          options: [
            {
              label: "X", isBaseline: false, isSelected: false, leversApplied: ["NOT_A_LEVER"],
              implCostMinor: 0n, savingsBaseMinor: 0n, savingsUpsideMinor: 0n, savingsDownsideMinor: 0n,
              horizonYears: 3, scores: [],
            },
          ],
        }),
        CAPS.strategyLevers,
      ),
    ).rejects.toThrow(/ungated/i);
  });

  it("rejects two baselines", async () => {
    await expect(
      saveSimulation(
        tenantAId,
        workspaceAId,
        actorAId,
        sim({
          options: [
            { label: "B1", isBaseline: true, isSelected: false, leversApplied: [], implCostMinor: 0n, savingsBaseMinor: 0n, savingsUpsideMinor: 0n, savingsDownsideMinor: 0n, horizonYears: 3, scores: [] },
            { label: "B2", isBaseline: true, isSelected: false, leversApplied: [], implCostMinor: 0n, savingsBaseMinor: 0n, savingsUpsideMinor: 0n, savingsDownsideMinor: 0n, horizonYears: 3, scores: [] },
          ],
        }),
        CAPS.strategyLevers,
      ),
    ).rejects.toThrow(/baseline/i);
  });

  it("is tenant-isolated", async () => {
    const empty = await getSimulation(tenantBId, workspaceAId);
    expect(empty.options).toHaveLength(0);
    expect(empty.criteria).toHaveLength(0);
  });
});
