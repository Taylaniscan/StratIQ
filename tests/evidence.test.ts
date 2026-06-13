import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { adminPrisma } from "@/lib/db/admin";
import { prisma } from "@/lib/db/prisma";
import {
  computeFreshness,
  createEvidenceCard,
  evidenceReadiness,
  listEvidenceCards,
} from "@/lib/domain/evidence";
import { addSupplier, listSuppliers } from "@/lib/domain/suppliers";
import { provisionTenantWorkspace } from "@/lib/domain/onboarding";
import type { EvidencePolicy } from "@/lib/adaptivity";
import type { OnboardingInput } from "@/lib/adaptivity/profile";

const RUN = randomUUID().slice(0, 8);
const tenantIds: string[] = [];
const RECENCY = 180;

function input(orgName: string): OnboardingInput {
  return {
    orgName,
    workspaceName: `Intel WS ${RUN}`,
    taxonomyL1: "Steel",
    orgTier: "ENTERPRISE",
    categoryArchetype: "DIRECT_MATERIAL",
    maturity: "FOUNDATIONAL",
    dataReadiness: "FILES",
  };
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000);
}

describe("computeFreshness", () => {
  it("classifies by age vs recency", () => {
    expect(computeFreshness(daysAgo(10), RECENCY)).toBe("FRESH");
    expect(computeFreshness(daysAgo(200), RECENCY)).toBe("AGING");
    expect(computeFreshness(daysAgo(400), RECENCY)).toBe("STALE");
  });
});

describe("evidenceReadiness", () => {
  const policy: EvidencePolicy = {
    recencyDays: RECENCY,
    triangulationMin: 1,
    requiredCards: [
      { kind: "POSITIONING_INPUT", label: "Positioning", minConfidence: "MEDIUM" },
      { kind: "DEMAND_BASIS", label: "Demand", minConfidence: "MEDIUM" },
    ],
  };

  it("satisfies a kind only with a fresh, high-enough card", () => {
    const cards = [
      { category: "POSITIONING_INPUT", confidence: "HIGH" as const, collectedAt: daysAgo(5) },
      { category: "DEMAND_BASIS", confidence: "LOW" as const, collectedAt: daysAgo(5) }, // too low
      { category: "POSITIONING_INPUT", confidence: "HIGH" as const, collectedAt: daysAgo(400) }, // stale
    ];
    const rows = evidenceReadiness(cards, policy);
    expect(rows.find((r) => r.kind === "POSITIONING_INPUT")?.satisfied).toBe(true);
    expect(rows.find((r) => r.kind === "DEMAND_BASIS")?.satisfied).toBe(false);
  });
});

describe("evidence + suppliers (DB, tenant-isolated)", () => {
  let tenantAId: string;
  let tenantBId: string;
  let workspaceAId: string;
  let ownerAId: string;

  beforeAll(async () => {
    const a = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `intel_a_${RUN}@example.com`,
      input: input(`Intel A ${RUN}`),
    });
    const b = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `intel_b_${RUN}@example.com`,
      input: input(`Intel B ${RUN}`),
    });
    tenantAId = a.tenant.id;
    tenantBId = b.tenant.id;
    workspaceAId = a.workspace!.id;
    tenantIds.push(tenantAId, tenantBId);
    const m = await adminPrisma.membership.findFirst({ where: { tenantId: tenantAId } });
    ownerAId = m!.userId;
  });

  afterAll(async () => {
    await adminPrisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await adminPrisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    await Promise.all([adminPrisma.$disconnect(), prisma.$disconnect()]);
  });

  it("creates and lists evidence cards, isolated by tenant", async () => {
    await createEvidenceCard(
      tenantAId,
      workspaceAId,
      ownerAId,
      {
        claim: "Resin index up 6% QoQ",
        category: "PRICING",
        sourceType: "Report",
        collectedAt: new Date(),
        confidence: "HIGH",
        triangulationCount: 2,
      },
      RECENCY,
    );
    const aCards = await listEvidenceCards(tenantAId, workspaceAId);
    expect(aCards).toHaveLength(1);
    expect(aCards[0].confidence).toBe("HIGH");

    const bCards = await listEvidenceCards(tenantBId, workspaceAId);
    expect(bCards).toHaveLength(0);
  });

  it("adds suppliers, isolated by tenant", async () => {
    await addSupplier(tenantAId, ownerAId, { name: `Tata Steel ${RUN}`, isIncumbent: true });
    const aSuppliers = await listSuppliers(tenantAId);
    expect(aSuppliers.some((s) => s.name === `Tata Steel ${RUN}`)).toBe(true);
    const bSuppliers = await listSuppliers(tenantBId);
    expect(bSuppliers.some((s) => s.name === `Tata Steel ${RUN}`)).toBe(false);
  });
});
