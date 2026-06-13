import { forTenant } from "@/lib/db/tenant";

import { minorToNumber } from "../money";

export interface CubeBucket {
  key: string;
  amount: number; // major units, for charts
}

export interface SpendCube {
  lineCount: number;
  totalMinor: bigint;
  currency: string;
  bySupplier: CubeBucket[];
  byBusinessUnit: CubeBucket[];
  bySite: CubeBucket[];
  byMonth: CubeBucket[];
}

function groupSum<T>(items: T[], keyFn: (t: T) => string, amountFn: (t: T) => bigint) {
  const map = new Map<string, bigint>();
  for (const item of items) {
    const k = keyFn(item);
    map.set(k, (map.get(k) ?? 0n) + amountFn(item));
  }
  return map;
}

function topBuckets(map: Map<string, bigint>, limit: number): CubeBucket[] {
  return [...map.entries()]
    .map(([key, minor]) => ({ key, amount: minorToNumber(minor) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

/** Spend cube for a workspace, aggregated in JS from tenant-scoped rows. */
export async function spendCube(
  tenantId: string,
  workspaceId: string,
): Promise<SpendCube> {
  const lines = await forTenant(tenantId).spendLine.findMany({
    where: { workspaceId },
    include: { supplier: true },
  });

  const totalMinor = lines.reduce((sum, l) => sum + l.amountMinor, 0n);

  const currencyCounts = groupSum(lines, (l) => l.currency, () => 1n);
  const currency =
    [...currencyCounts.entries()].sort((a, b) => Number(b[1] - a[1]))[0]?.[0] ?? "USD";

  const bySupplier = topBuckets(
    groupSum(lines, (l) => l.supplier?.name ?? "Unclassified", (l) => l.amountMinor),
    8,
  );
  const byBusinessUnit = topBuckets(
    groupSum(lines, (l) => l.buUnit ?? "Unspecified", (l) => l.amountMinor),
    8,
  );
  const bySite = topBuckets(
    groupSum(lines, (l) => l.site ?? "Unspecified", (l) => l.amountMinor),
    8,
  );

  const byMonthMap = groupSum(
    lines,
    (l) => l.glDate.toISOString().slice(0, 7), // YYYY-MM
    (l) => l.amountMinor,
  );
  const byMonth = [...byMonthMap.entries()]
    .map(([key, minor]) => ({ key, amount: minorToNumber(minor) }))
    .sort((a, b) => a.key.localeCompare(b.key));

  return {
    lineCount: lines.length,
    totalMinor,
    currency,
    bySupplier,
    byBusinessUnit,
    bySite,
    byMonth,
  };
}
