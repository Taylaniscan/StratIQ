"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { generateSynthesis, setSynthesisStatus } from "@/lib/domain/synthesis";
import { getWorkspace } from "@/lib/domain/workspace";

export type GenerateResult =
  | { ok: true; strippedCount: number }
  | { ok: false; error: string };
export type StatusResult = { ok: true } | { ok: false; error: string };

async function ensureMember(workspaceId: string) {
  const { membership, tenant } = await requireActiveMembership();
  const ws = await getWorkspace(tenant.id, workspaceId);
  if (!ws) return { ok: false as const, error: "Workspace not found." };
  return { ok: true as const, tenantId: tenant.id, membership };
}

export async function generateSynthesisAction(
  workspaceId: string,
): Promise<GenerateResult> {
  const ctx = await ensureMember(workspaceId);
  if (!ctx.ok) return { ok: false, error: ctx.error };
  if (!can(ctx.membership.role, "workspace:write")) {
    return { ok: false, error: "You don't have permission to generate AI drafts." };
  }

  try {
    const { strippedCount } = await generateSynthesis(
      ctx.tenantId,
      workspaceId,
      ctx.membership.userId,
    );
    revalidatePath(`/${workspaceId}/synthesis`);
    return { ok: true, strippedCount };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Generation failed." };
  }
}

export async function setSynthesisStatusAction(
  workspaceId: string,
  artifactId: string,
  approve: boolean,
): Promise<StatusResult> {
  const ctx = await ensureMember(workspaceId);
  if (!ctx.ok) return { ok: false, error: ctx.error };
  // Approving an exec-ready draft requires sign-off capability; rejecting needs write.
  const allowed = approve
    ? can(ctx.membership.role, "strategy:approve") || can(ctx.membership.role, "workspace:write")
    : can(ctx.membership.role, "workspace:write");
  if (!allowed) {
    return { ok: false, error: "You don't have permission to change this draft." };
  }

  try {
    await setSynthesisStatus(
      ctx.tenantId,
      workspaceId,
      ctx.membership.userId,
      artifactId,
      approve ? "APPROVED" : "REJECTED",
    );
    revalidatePath(`/${workspaceId}/synthesis`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}
