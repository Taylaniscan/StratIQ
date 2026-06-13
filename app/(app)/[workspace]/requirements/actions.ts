"use server";

import { revalidatePath } from "next/cache";

import { resolveCapabilities } from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";
import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { saveRequirement, type RequirementData } from "@/lib/domain/requirements";
import { getWorkspace } from "@/lib/domain/workspace";

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveRequirements(
  workspaceId: string,
  values: RequirementData,
): Promise<SaveResult> {
  const { membership, tenant } = await requireActiveMembership();
  if (!can(membership.role, "workspace:write")) {
    return { ok: false, error: "You don't have permission to edit requirements." };
  }

  const ws = await getWorkspace(tenant.id, workspaceId);
  if (!ws) return { ok: false, error: "Workspace not found." };

  const caps = resolveCapabilities(contextProfileSchema.parse(ws.profile));
  if (!caps.enabledModules.includes("M3")) {
    return { ok: false, error: "This workspace doesn't include requirements." };
  }

  const allowed = caps.requirementFields.map((f) => f.id);
  try {
    await saveRequirement(tenant.id, workspaceId, membership.userId, values, allowed);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed." };
  }

  revalidatePath(`/${workspaceId}/requirements`);
  return { ok: true };
}
