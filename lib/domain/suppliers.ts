import { forTenant } from "@/lib/db/tenant";

import { recordAudit } from "./audit";

/** Supplier universe (tenant-scoped). Suppliers are also created by M2 ingest. */
export function listSuppliers(tenantId: string) {
  return forTenant(tenantId).supplier.findMany({ orderBy: { name: "asc" } });
}

export interface AddSupplierInput {
  name: string;
  isIncumbent: boolean;
  tier?: string | null;
}

export async function addSupplier(
  tenantId: string,
  actorId: string,
  input: AddSupplierInput,
) {
  const db = forTenant(tenantId);
  const existing = await db.supplier.findFirst({ where: { name: input.name } });
  if (existing) return existing;

  const supplier = await db.supplier.create({
    data: {
      tenantId,
      name: input.name,
      isIncumbent: input.isIncumbent,
      tier: input.tier ?? null,
    },
  });

  await recordAudit({
    tenantId,
    actorId,
    action: "supplier.add",
    entity: "Supplier",
    entityId: supplier.id,
    payload: { name: input.name, isIncumbent: input.isIncumbent },
  });

  return supplier;
}
