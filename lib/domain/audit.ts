import { Prisma } from "@prisma/client";

import { forTenant } from "@/lib/db/tenant";

/**
 * Append-only audit log (CLAUDE.md §5). Writes go through the tenant-scoped client
 * so the entry is stamped + RLS-checked; the app role has no UPDATE/DELETE on
 * `audit_logs` (see scripts/db/setup-rls.mjs), so history can't be rewritten.
 */
export interface AuditInput {
  tenantId: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  payload?: Record<string, unknown>;
}

export async function recordAudit(input: AuditInput) {
  await forTenant(input.tenantId).auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      ...(input.payload
        ? { payload: input.payload as Prisma.InputJsonObject }
        : {}),
    },
  });
}
