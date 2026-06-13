import type { DataQuality } from "@prisma/client";

import { forTenant } from "@/lib/db/tenant";

import type { ParsedSpendRow, RowError } from "./parse";

const STALE_AFTER_DAYS = 365;

export interface IngestArgs {
  tenantId: string;
  workspaceId: string;
  uploadedById: string;
  filename: string;
  rows: ParsedSpendRow[];
  errors: RowError[];
}

function computeQuality(rows: ParsedSpendRow[], errors: RowError[]): DataQuality {
  if (rows.length === 0) return "BLOCKED";
  if (errors.length > 0) return "PARTIAL";
  const newest = rows.reduce((max, r) => (r.glDate > max ? r.glDate : max), rows[0].glDate);
  const ageDays = (Date.now() - newest.getTime()) / 86_400_000;
  if (ageDays > STALE_AFTER_DAYS) return "STALE";
  return "COMPLETE";
}

export async function ingestSpend({
  tenantId,
  workspaceId,
  uploadedById,
  filename,
  rows,
  errors,
}: IngestArgs) {
  const db = forTenant(tenantId);

  // 1. Resolve suppliers (find-or-create by name).
  const names = [...new Set(rows.map((r) => r.supplier).filter((n): n is string => !!n))];
  if (names.length > 0) {
    const existing = await db.supplier.findMany({ where: { name: { in: names } } });
    const existingNames = new Set(existing.map((s) => s.name));
    const missing = names.filter((n) => !existingNames.has(n));
    if (missing.length > 0) {
      await db.supplier.createMany({
        data: missing.map((name) => ({ tenantId, name })),
        skipDuplicates: true,
      });
    }
  }
  const suppliers = await db.supplier.findMany({ where: { name: { in: names } } });
  const supplierId = new Map(suppliers.map((s) => [s.name, s.id]));

  // 2. Dataset summary.
  const totalMinor = rows.reduce((sum, r) => sum + r.amountMinor, 0n);
  const currencies = new Set(rows.map((r) => r.currency));
  const dates = rows.map((r) => r.glDate.getTime());

  const dataset = await db.spendDataset.create({
    data: {
      tenantId,
      workspaceId,
      filename,
      status: computeQuality(rows, errors),
      rowCount: rows.length,
      errorCount: errors.length,
      totalMinor,
      currency: currencies.size === 1 ? [...currencies][0] : null,
      periodStart: dates.length ? new Date(Math.min(...dates)) : null,
      periodEnd: dates.length ? new Date(Math.max(...dates)) : null,
      uploadedById,
    },
  });

  // 3. Spend lines.
  if (rows.length > 0) {
    await db.spendLine.createMany({
      data: rows.map((r) => ({
        tenantId,
        workspaceId,
        datasetId: dataset.id,
        supplierId: r.supplier ? supplierId.get(r.supplier) ?? null : null,
        buUnit: r.buUnit,
        site: r.site,
        glDate: r.glDate,
        amountMinor: r.amountMinor,
        currency: r.currency,
        classification: r.classification,
        contractId: r.contractId,
      })),
    });
  }

  return { dataset, supplierCount: suppliers.length, lineCount: rows.length };
}
