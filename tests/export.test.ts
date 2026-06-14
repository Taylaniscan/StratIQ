import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { adminPrisma } from "@/lib/db/admin";
import { prisma } from "@/lib/db/prisma";
import { createEvidenceCard } from "@/lib/domain/evidence";
import { provisionTenantWorkspace } from "@/lib/domain/onboarding";
import { saveSimulation } from "@/lib/domain/options";
import { buildStrategyPack, type StrategyPack } from "@/lib/domain/strategyPack";
import { toPdfBuffer } from "@/lib/export/pdf";
import { toPptxBuffer } from "@/lib/export/pptx";
import { toXlsxBuffer } from "@/lib/export/xlsx";
import type { OnboardingInput } from "@/lib/adaptivity/profile";

const RUN = randomUUID().slice(0, 8);
const tenantIds: string[] = [];

function onboarding(orgName: string): OnboardingInput {
  return {
    orgName,
    workspaceName: `Export WS ${RUN}`,
    taxonomyL1: "Steel",
    orgTier: "ENTERPRISE",
    categoryArchetype: "DIRECT_MATERIAL",
    maturity: "ADVANCED",
    dataReadiness: "CONNECTED",
  };
}

const FIXTURE: StrategyPack = {
  title: "Resin",
  tenantName: "Atlas Industrial",
  generatedAt: new Date().toISOString(),
  orgTier: "ENTERPRISE",
  archetype: "DIRECT_MATERIAL",
  maturity: "ADVANCED",
  status: "DRAFT",
  taxonomy: "Raw materials › Polymers",
  objective: "Cut resin cost 7%",
  modules: ["Spend & Contract Data Fabric"],
  frameworks: ["Kraljic matrix", "Porter's five forces"],
  positioning: {
    quadrant: "Strategic",
    posture: "Partner",
    supplyRisk: 80,
    businessImpact: 70,
    rationale: "Single qualified source",
  },
  options: [
    { label: "Baseline", isBaseline: true, isSelected: false, npv: "$0", score: 20 },
    { label: "Dual-source", isBaseline: false, isSelected: true, npv: "$1,200,000", score: 78 },
  ],
  evidence: [{ claim: "Index up 6%", sourceType: "Report", confidence: "HIGH", collectedAt: "2026-06-01" }],
  aiSummary: { output: "Resin is strategic; dual-source recommended.", model: "fake:test", createdAt: new Date().toISOString() },
  spend: { total: "$2,400,000", topSuppliers: [{ name: "Tata", amount: "$1,000,000" }] },
};

function magic(buf: Uint8Array, n: number) {
  return Array.from(buf.slice(0, n));
}

describe("export generators (magic bytes)", () => {
  it("xlsx is a zip (PK)", () => {
    const buf = toXlsxBuffer(FIXTURE);
    expect(buf.length).toBeGreaterThan(100);
    expect(magic(buf, 2)).toEqual([0x50, 0x4b]); // "PK"
  });

  it("pptx is a zip (PK)", async () => {
    const buf = await toPptxBuffer(FIXTURE);
    expect(buf.length).toBeGreaterThan(100);
    expect(magic(buf, 2)).toEqual([0x50, 0x4b]);
  });

  it("pdf starts with %PDF", async () => {
    const buf = await toPdfBuffer(FIXTURE);
    expect(buf.length).toBeGreaterThan(100);
    expect(Buffer.from(buf.slice(0, 4)).toString()).toBe("%PDF");
  });
});

describe("buildStrategyPack (DB)", () => {
  let tenantAId: string;
  let tenantBId: string;
  let workspaceAId: string;
  let actorAId: string;

  beforeAll(async () => {
    const a = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `exp_a_${RUN}@example.com`,
      input: onboarding(`Exp A ${RUN}`),
    });
    const b = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `exp_b_${RUN}@example.com`,
      input: onboarding(`Exp B ${RUN}`),
    });
    tenantAId = a.tenant.id;
    tenantBId = b.tenant.id;
    workspaceAId = a.workspace!.id;
    tenantIds.push(tenantAId, tenantBId);
    const m = await adminPrisma.membership.findFirst({ where: { tenantId: tenantAId } });
    actorAId = m!.userId;

    await createEvidenceCard(
      tenantAId, workspaceAId, actorAId,
      { claim: "Index up 6%", category: "PRICING", sourceType: "Report", collectedAt: new Date(), confidence: "HIGH", triangulationCount: 1 },
      180,
    );
    await saveSimulation(
      tenantAId, workspaceAId, actorAId,
      {
        criteria: [{ name: "Savings", weight: 1 }],
        options: [
          { label: "Baseline", isBaseline: true, isSelected: false, leversApplied: [], implCostMinor: 0n, savingsBaseMinor: 0n, savingsUpsideMinor: 0n, savingsDownsideMinor: 0n, horizonYears: 3, scores: [{ criterionIndex: 0, score: 10 }] },
          { label: "Dual-source", isBaseline: false, isSelected: true, leversApplied: [], implCostMinor: 0n, savingsBaseMinor: 100000n, savingsUpsideMinor: 0n, savingsDownsideMinor: 0n, horizonYears: 3, scores: [{ criterionIndex: 0, score: 90 }] },
        ],
      },
      [],
    );
  });

  afterAll(async () => {
    await adminPrisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await adminPrisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    await Promise.all([adminPrisma.$disconnect(), prisma.$disconnect()]);
  });

  it("assembles the pack and round-trips through all generators", async () => {
    const pack = await buildStrategyPack(tenantAId, workspaceAId, "Exp A");
    expect(pack).not.toBeNull();
    expect(pack!.options).toHaveLength(2);
    expect(pack!.evidence).toHaveLength(1);
    expect(pack!.frameworks.length).toBeGreaterThan(0);

    expect(toXlsxBuffer(pack!).length).toBeGreaterThan(100);
    expect((await toPdfBuffer(pack!)).length).toBeGreaterThan(100);
  });

  it("is tenant-isolated", async () => {
    expect(await buildStrategyPack(tenantBId, workspaceAId, "Exp B")).toBeNull();
  });
});
