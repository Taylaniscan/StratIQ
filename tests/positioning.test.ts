import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { adminPrisma } from "@/lib/db/admin";
import { prisma } from "@/lib/db/prisma";
import { createEvidenceCard } from "@/lib/domain/evidence";
import { kraljicQuadrant } from "@/lib/domain/kraljic";
import { provisionTenantWorkspace } from "@/lib/domain/onboarding";
import { getPositioning, savePositioning } from "@/lib/domain/positioning";
import type { OnboardingInput } from "@/lib/adaptivity/profile";

const RUN = randomUUID().slice(0, 8);
const tenantIds: string[] = [];

function input(orgName: string): OnboardingInput {
  return {
    orgName,
    workspaceName: `Pos WS ${RUN}`,
    taxonomyL1: "Steel",
    orgTier: "ENTERPRISE",
    categoryArchetype: "DIRECT_MATERIAL",
    maturity: "ADVANCED", // enables Porter etc.
    dataReadiness: "CONNECTED",
  };
}

describe("kraljicQuadrant", () => {
  it("maps the four quadrants", () => {
    expect(kraljicQuadrant(80, 80)).toBe("STRATEGIC");
    expect(kraljicQuadrant(20, 80)).toBe("LEVERAGE");
    expect(kraljicQuadrant(80, 20)).toBe("BOTTLENECK");
    expect(kraljicQuadrant(20, 20)).toBe("NON_CRITICAL");
  });
});

describe("savePositioning (DB)", () => {
  let tenantAId: string;
  let tenantBId: string;
  let workspaceAId: string;
  let ownerAId: string;
  let evidenceId: string;

  beforeAll(async () => {
    const a = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `pos_a_${RUN}@example.com`,
      input: input(`Pos A ${RUN}`),
    });
    const b = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `pos_b_${RUN}@example.com`,
      input: input(`Pos B ${RUN}`),
    });
    tenantAId = a.tenant.id;
    tenantBId = b.tenant.id;
    workspaceAId = a.workspace!.id;
    tenantIds.push(tenantAId, tenantBId);
    const m = await adminPrisma.membership.findFirst({ where: { tenantId: tenantAId } });
    ownerAId = m!.userId;
    const card = await createEvidenceCard(
      tenantAId,
      workspaceAId,
      ownerAId,
      { claim: "Two qualified suppliers", category: "SUPPLIER_UNIVERSE", sourceType: "Internal", collectedAt: new Date(), confidence: "HIGH", triangulationCount: 1 },
      180,
    );
    evidenceId = card.id;
  });

  afterAll(async () => {
    await adminPrisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await adminPrisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    await Promise.all([adminPrisma.$disconnect(), prisma.$disconnect()]);
  });

  it("computes quadrant, persists, and reloads", async () => {
    const saved = await savePositioning(
      tenantAId,
      workspaceAId,
      ownerAId,
      {
        supplyRisk: 80,
        businessImpact: 70,
        rationale: "Critical input",
        frameworks: { PORTER_FIVE_FORCES: "High rivalry" },
        evidenceIds: [evidenceId],
      },
      ["PORTER_FIVE_FORCES", "SUPPLIER_TIERING"],
      [evidenceId],
    );
    expect(saved.kraljicQuadrant).toBe("STRATEGIC");

    const loaded = await getPositioning(tenantAId, workspaceAId);
    expect(loaded?.evidenceIds).toContain(evidenceId);
    expect((loaded?.frameworks as Record<string, string>).PORTER_FIVE_FORCES).toBe("High rivalry");
  });

  it("rejects an ungated framework", async () => {
    await expect(
      savePositioning(
        tenantAId,
        workspaceAId,
        ownerAId,
        { supplyRisk: 50, businessImpact: 50, frameworks: { MADE_UP: "x" }, evidenceIds: [] },
        ["PORTER_FIVE_FORCES"],
        [evidenceId],
      ),
    ).rejects.toThrow(/ungated/i);
  });

  it("rejects an evidence id not in the workspace", async () => {
    await expect(
      savePositioning(
        tenantAId,
        workspaceAId,
        ownerAId,
        { supplyRisk: 50, businessImpact: 50, frameworks: {}, evidenceIds: ["nope"] },
        [],
        [evidenceId],
      ),
    ).rejects.toThrow(/unknown evidence/i);
  });

  it("is tenant-isolated", async () => {
    expect(await getPositioning(tenantBId, workspaceAId)).toBeNull();
  });
});
