import { z } from "zod";

import { forTenant } from "@/lib/db/tenant";

import { recordAudit } from "./audit";

/**
 * Workspace governance domain (M1). All reads/writes go through the tenant-scoped
 * client (`forTenant`), so cross-tenant access returns null / throws, and RLS is
 * the backstop. Every mutation records an audit entry.
 */

export const governancePatchSchema = z.object({
  name: z.string().trim().min(2).max(160),
  objective: z.string().trim().max(2000).optional().or(z.literal("")),
  taxonomyL1: z.string().trim().min(2).max(120),
  taxonomyL2: z.string().trim().max(120).optional().or(z.literal("")),
  taxonomyL3: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum([
    "DRAFT",
    "REVIEW",
    "APPROVED",
    "IN_EXECUTION",
    "MONITORING",
    "REFRESH",
  ]),
});

export type GovernancePatch = z.infer<typeof governancePatchSchema>;

export function listWorkspaces(tenantId: string) {
  return forTenant(tenantId).workspace.findMany({ orderBy: { createdAt: "asc" } });
}

export function getWorkspace(tenantId: string, workspaceId: string) {
  return forTenant(tenantId).workspace.findFirst({ where: { id: workspaceId } });
}

export function listTenantMembers(tenantId: string) {
  return forTenant(tenantId).membership.findMany({
    include: { user: true },
    orderBy: { role: "asc" },
  });
}

export function listWorkspaceAudit(tenantId: string, workspaceId: string) {
  return forTenant(tenantId).auditLog.findMany({
    where: { entity: "Workspace", entityId: workspaceId },
    orderBy: { at: "desc" },
    take: 50,
  });
}

export async function updateWorkspaceGovernance(
  tenantId: string,
  workspaceId: string,
  actorId: string,
  patch: GovernancePatch,
) {
  const db = forTenant(tenantId);

  // Normalize optional/empty strings to null for nullable columns.
  const updated = await db.workspace.update({
    where: { id: workspaceId },
    data: {
      name: patch.name,
      objective: patch.objective ? patch.objective : null,
      taxonomyL1: patch.taxonomyL1,
      taxonomyL2: patch.taxonomyL2 ? patch.taxonomyL2 : null,
      taxonomyL3: patch.taxonomyL3 ? patch.taxonomyL3 : null,
      status: patch.status,
    },
  });

  await recordAudit({
    tenantId,
    actorId,
    action: "workspace.governance.update",
    entity: "Workspace",
    entityId: workspaceId,
    payload: { ...patch },
  });

  return updated;
}
