import { Prisma } from "@prisma/client";

import type { ContextProfile } from "@/lib/adaptivity";
import type { OnboardingInput } from "@/lib/adaptivity/profile";
import { adminPrisma } from "@/lib/db/admin";

/**
 * Provision a new tenant from the onboarding wizard: Tenant → User (linked to the
 * Supabase auth id) → Membership(OWNER) → first category Workspace carrying the
 * Context Profile.
 *
 * Uses the admin client (BYPASSRLS): this is a privileged bootstrap that must run
 * before any tenant context exists, which the RLS-bound app role can't do. It is
 * the only place that creates a Tenant.
 *
 * Idempotent: if the auth user is already linked to a User, returns the existing
 * tenant + first workspace instead of creating duplicates.
 */
export interface ProvisionArgs {
  authUserId: string;
  email: string;
  input: OnboardingInput;
}

export async function provisionTenantWorkspace({
  authUserId,
  email,
  input,
}: ProvisionArgs) {
  const existing = await adminPrisma.user.findUnique({
    where: { authUserId },
    include: {
      tenant: {
        include: { workspaces: { orderBy: { createdAt: "asc" }, take: 1 } },
      },
    },
  });

  if (existing) {
    return {
      created: false,
      tenant: existing.tenant,
      workspace: existing.tenant.workspaces[0] ?? null,
    };
  }

  const profile: ContextProfile = {
    orgTier: input.orgTier,
    categoryArchetype: input.categoryArchetype,
    maturity: input.maturity,
    dataReadiness: input.dataReadiness,
  };

  return adminPrisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: input.orgName, orgTier: input.orgTier },
    });
    const user = await tx.user.create({
      data: { tenantId: tenant.id, authUserId, email },
    });
    await tx.membership.create({
      data: { tenantId: tenant.id, userId: user.id, role: "OWNER" },
    });
    const workspace = await tx.workspace.create({
      data: {
        tenantId: tenant.id,
        name: input.workspaceName,
        taxonomyL1: input.taxonomyL1,
        // ContextProfile is a flat string object — a valid JSON object at runtime.
        profile: profile as unknown as Prisma.InputJsonObject,
        status: "DRAFT",
      },
    });
    return { created: true, tenant, workspace };
  });
}
