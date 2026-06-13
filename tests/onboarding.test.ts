import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import { adminPrisma } from "@/lib/db/admin";
import { prisma } from "@/lib/db/prisma";
import { forTenant } from "@/lib/db/tenant";
import { provisionTenantWorkspace } from "@/lib/domain/onboarding";
import type { OnboardingInput } from "@/lib/adaptivity/profile";

const RUN = randomUUID().slice(0, 8);
const createdTenantIds: string[] = [];

function input(overrides: Partial<OnboardingInput> = {}): OnboardingInput {
  return {
    orgName: `Onboard A ${RUN}`,
    workspaceName: `Facilities ${RUN}`,
    taxonomyL1: "Facilities",
    orgTier: "SMALL",
    categoryArchetype: "INDIRECT_SERVICE",
    maturity: "FOUNDATIONAL",
    dataReadiness: "FILES",
    ...overrides,
  };
}

afterAll(async () => {
  if (createdTenantIds.length) {
    await adminPrisma.tenant.deleteMany({ where: { id: { in: createdTenantIds } } });
  }
  await Promise.all([adminPrisma.$disconnect(), prisma.$disconnect()]);
});

describe("provisionTenantWorkspace", () => {
  it("creates tenant + OWNER membership + workspace with the profile", async () => {
    const authUserId = randomUUID();
    const result = await provisionTenantWorkspace({
      authUserId,
      email: `owner_${RUN}@example.com`,
      input: input(),
    });
    createdTenantIds.push(result.tenant.id);

    expect(result.created).toBe(true);
    expect(result.tenant.orgTier).toBe("SMALL");
    expect(result.workspace?.name).toBe(`Facilities ${RUN}`);
    expect(result.workspace?.profile).toMatchObject({
      orgTier: "SMALL",
      categoryArchetype: "INDIRECT_SERVICE",
      maturity: "FOUNDATIONAL",
      dataReadiness: "FILES",
    });

    const membership = await adminPrisma.membership.findFirst({
      where: { tenantId: result.tenant.id },
    });
    expect(membership?.role).toBe("OWNER");
  });

  it("is idempotent for the same auth user", async () => {
    const authUserId = randomUUID();
    const first = await provisionTenantWorkspace({
      authUserId,
      email: `idem_${RUN}@example.com`,
      input: input({ orgName: `Onboard B ${RUN}` }),
    });
    createdTenantIds.push(first.tenant.id);

    const second = await provisionTenantWorkspace({
      authUserId,
      email: `idem_${RUN}@example.com`,
      input: input({ orgName: "Should be ignored" }),
    });

    expect(second.created).toBe(false);
    expect(second.tenant.id).toBe(first.tenant.id);

    const tenantCount = await adminPrisma.tenant.count({
      where: { users: { some: { authUserId } } },
    });
    expect(tenantCount).toBe(1);
  });

  it("provisioned workspace is tenant-isolated via forTenant", async () => {
    const a = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `iso_a_${RUN}@example.com`,
      input: input({ orgName: `Iso A ${RUN}` }),
    });
    const b = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `iso_b_${RUN}@example.com`,
      input: input({ orgName: `Iso B ${RUN}`, orgTier: "ENTERPRISE" }),
    });
    createdTenantIds.push(a.tenant.id, b.tenant.id);

    const aWorkspaces = await forTenant(a.tenant.id).workspace.findMany();
    expect(aWorkspaces).toHaveLength(1);
    expect(aWorkspaces[0].tenantId).toBe(a.tenant.id);
    expect(aWorkspaces.some((w) => w.tenantId === b.tenant.id)).toBe(false);
  });
});
