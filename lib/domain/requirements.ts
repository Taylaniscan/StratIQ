import { Prisma } from "@prisma/client";

import { forTenant } from "@/lib/db/tenant";

import { recordAudit } from "./audit";

/**
 * Requirements intake (M3). The stored shape is archetype-driven: `data` is keyed
 * by `Capabilities.requirementFields` ids. Writes are validated against the gated
 * field set so ungated fields are rejected (CLAUDE.md §2.2).
 */

export type RequirementData = Record<string, string | string[]>;

export async function getRequirement(
  tenantId: string,
  workspaceId: string,
  kind = "INTAKE",
) {
  return forTenant(tenantId).requirementArtifact.findFirst({
    where: { workspaceId, kind },
  });
}

export async function saveRequirement(
  tenantId: string,
  workspaceId: string,
  actorId: string,
  data: RequirementData,
  allowedFieldIds: string[],
  kind = "INTAKE",
) {
  const allowed = new Set(allowedFieldIds);
  const unknown = Object.keys(data).filter((k) => !allowed.has(k));
  if (unknown.length > 0) {
    throw new Error(`Ungated requirement fields: ${unknown.join(", ")}`);
  }

  const db = forTenant(tenantId);
  const existing = await db.requirementArtifact.findFirst({
    where: { workspaceId, kind },
  });

  const json = data as Prisma.InputJsonObject;
  const saved = existing
    ? await db.requirementArtifact.update({
        where: { id: existing.id },
        data: { data: json },
      })
    : await db.requirementArtifact.create({
        data: { tenantId, workspaceId, kind, data: json },
      });

  await recordAudit({
    tenantId,
    actorId,
    action: "requirements.save",
    entity: "Workspace",
    entityId: workspaceId,
    payload: { kind, fields: Object.keys(data) },
  });

  return saved;
}
