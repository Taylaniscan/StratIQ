"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import {
  getWorkspace,
  governancePatchSchema,
  updateWorkspaceGovernance,
} from "@/lib/domain/workspace";

export type GovernanceResult = { ok: true } | { ok: false; error: string };

/**
 * Update a workspace's governance fields. Guards: authenticated + active
 * membership, RBAC (`workspace:write`), tenant-scoped ownership of the workspace,
 * and Zod validation. Records an audit entry (via the domain layer).
 */
export async function updateGovernance(
  workspaceId: string,
  raw: unknown,
): Promise<GovernanceResult> {
  const { membership, tenant } = await requireActiveMembership();

  if (!can(membership.role, "workspace:write")) {
    return { ok: false, error: "You don't have permission to edit this workspace." };
  }

  const parsed = governancePatchSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please check the fields and try again." };
  }

  const workspace = await getWorkspace(tenant.id, workspaceId);
  if (!workspace) {
    return { ok: false, error: "Workspace not found." };
  }

  await updateWorkspaceGovernance(
    tenant.id,
    workspaceId,
    membership.userId,
    parsed.data,
  );

  revalidatePath(`/${workspaceId}/overview`);
  revalidatePath(`/${workspaceId}/governance`);
  return { ok: true };
}
