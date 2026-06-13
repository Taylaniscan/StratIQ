import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { resolveCapabilities } from "@/lib/adaptivity";
import { adminPrisma } from "@/lib/db/admin";
import { prisma } from "@/lib/db/prisma";
import { provisionTenantWorkspace } from "@/lib/domain/onboarding";
import { getRequirement, saveRequirement } from "@/lib/domain/requirements";
import type { OnboardingInput } from "@/lib/adaptivity/profile";

const RUN = randomUUID().slice(0, 8);
const tenantIds: string[] = [];

let tenantAId: string;
let tenantBId: string;
let workspaceAId: string;
let actorAId: string;
let allowedFieldIds: string[];

function input(orgName: string): OnboardingInput {
  return {
    orgName,
    workspaceName: `Req WS ${RUN}`,
    taxonomyL1: "Steel",
    orgTier: "ENTERPRISE",
    categoryArchetype: "DIRECT_MATERIAL",
    maturity: "ADVANCED",
    dataReadiness: "CONNECTED",
  };
}

beforeAll(async () => {
  const a = await provisionTenantWorkspace({
    authUserId: randomUUID(),
    email: `req_a_${RUN}@example.com`,
    input: input(`Req A ${RUN}`),
  });
  const b = await provisionTenantWorkspace({
    authUserId: randomUUID(),
    email: `req_b_${RUN}@example.com`,
    input: input(`Req B ${RUN}`),
  });
  tenantAId = a.tenant.id;
  tenantBId = b.tenant.id;
  workspaceAId = a.workspace!.id;
  tenantIds.push(tenantAId, tenantBId);

  const m = await adminPrisma.membership.findFirst({ where: { tenantId: tenantAId } });
  actorAId = m!.userId;

  allowedFieldIds = resolveCapabilities({
    orgTier: "ENTERPRISE",
    categoryArchetype: "DIRECT_MATERIAL",
    maturity: "ADVANCED",
    dataReadiness: "CONNECTED",
  }).requirementFields.map((f) => f.id);
});

afterAll(async () => {
  await adminPrisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await Promise.all([adminPrisma.$disconnect(), prisma.$disconnect()]);
});

describe("requirements", () => {
  it("persists and reloads intake data", async () => {
    await saveRequirement(
      tenantAId,
      workspaceAId,
      actorAId,
      { specGrade: "AISI 1018", makeVsBuy: "BUY" },
      allowedFieldIds,
    );
    const loaded = await getRequirement(tenantAId, workspaceAId);
    expect(loaded?.data).toMatchObject({ specGrade: "AISI 1018", makeVsBuy: "BUY" });
  });

  it("rejects ungated field ids", async () => {
    await expect(
      saveRequirement(
        tenantAId,
        workspaceAId,
        actorAId,
        { scopeOfWork: "not a direct-material field" },
        allowedFieldIds,
      ),
    ).rejects.toThrow(/ungated/i);
  });

  it("re-save updates the single artifact (one per kind)", async () => {
    await saveRequirement(tenantAId, workspaceAId, actorAId, { specGrade: "AISI 1045" }, allowedFieldIds);
    const count = await adminPrisma.requirementArtifact.count({
      where: { workspaceId: workspaceAId, kind: "INTAKE" },
    });
    expect(count).toBe(1);
    const loaded = await getRequirement(tenantAId, workspaceAId);
    expect((loaded?.data as Record<string, string>).specGrade).toBe("AISI 1045");
  });

  it("is tenant-isolated", async () => {
    expect(await getRequirement(tenantBId, workspaceAId)).toBeNull();
  });
});
