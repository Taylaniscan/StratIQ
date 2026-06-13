import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { adminPrisma } from "@/lib/db/admin";
import { prisma } from "@/lib/db/prisma";
import { forTenant } from "@/lib/db/tenant";
import { provisionTenantWorkspace } from "@/lib/domain/onboarding";
import {
  getWorkspace,
  listWorkspaces,
  listWorkspaceAudit,
  updateWorkspaceGovernance,
} from "@/lib/domain/workspace";
import type { OnboardingInput } from "@/lib/adaptivity/profile";

const RUN = randomUUID().slice(0, 8);
const tenantIds: string[] = [];

let tenantAId: string;
let tenantBId: string;
let workspaceAId: string;
let actorAId: string;

function input(orgName: string): OnboardingInput {
  return {
    orgName,
    workspaceName: `WS ${RUN}`,
    taxonomyL1: "Facilities",
    orgTier: "MID",
    categoryArchetype: "INDIRECT_SERVICE",
    maturity: "DEVELOPING",
    dataReadiness: "FILES",
  };
}

beforeAll(async () => {
  const a = await provisionTenantWorkspace({
    authUserId: randomUUID(),
    email: `ws_a_${RUN}@example.com`,
    input: input(`WS Tenant A ${RUN}`),
  });
  const b = await provisionTenantWorkspace({
    authUserId: randomUUID(),
    email: `ws_b_${RUN}@example.com`,
    input: input(`WS Tenant B ${RUN}`),
  });
  tenantAId = a.tenant.id;
  tenantBId = b.tenant.id;
  workspaceAId = a.workspace!.id;
  tenantIds.push(tenantAId, tenantBId);

  const membership = await adminPrisma.membership.findFirst({ where: { tenantId: tenantAId } });
  actorAId = membership!.userId;
});

afterAll(async () => {
  // audit_logs have no FK cascade — delete them explicitly (admin can; the app
  // role is blocked from DELETE by the append-only revoke).
  await adminPrisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await adminPrisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await Promise.all([adminPrisma.$disconnect(), prisma.$disconnect()]);
});

describe("workspace domain", () => {
  it("getWorkspace is tenant-isolated", async () => {
    expect(await getWorkspace(tenantAId, workspaceAId)).not.toBeNull();
    expect(await getWorkspace(tenantBId, workspaceAId)).toBeNull();
  });

  it("listWorkspaces returns only the tenant's workspaces", async () => {
    const list = await listWorkspaces(tenantAId);
    expect(list).toHaveLength(1);
    expect(list[0].tenantId).toBe(tenantAId);
  });

  it("updateWorkspaceGovernance updates fields and appends an audit entry", async () => {
    const updated = await updateWorkspaceGovernance(tenantAId, workspaceAId, actorAId, {
      name: `Renamed ${RUN}`,
      objective: "Reduce facilities spend 8%",
      taxonomyL1: "Facilities",
      taxonomyL2: "Cleaning",
      taxonomyL3: "",
      status: "APPROVED",
    });
    expect(updated.name).toBe(`Renamed ${RUN}`);
    expect(updated.status).toBe("APPROVED");
    expect(updated.objective).toBe("Reduce facilities spend 8%");
    expect(updated.taxonomyL3).toBeNull();

    const audit = await listWorkspaceAudit(tenantAId, workspaceAId);
    expect(audit.length).toBeGreaterThanOrEqual(1);
    expect(audit[0].action).toBe("workspace.governance.update");
  });

  it("audit log is append-only (UPDATE rejected for the app role)", async () => {
    const audit = await listWorkspaceAudit(tenantAId, workspaceAId);
    const entryId = audit[0].id;
    await expect(
      forTenant(tenantAId).auditLog.update({
        where: { id: entryId },
        data: { action: "tampered" },
      }),
    ).rejects.toThrow();
  });
});
