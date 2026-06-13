import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { adminPrisma } from "@/lib/db/admin";
import { prisma } from "@/lib/db/prisma";
import { provisionTenantWorkspace } from "@/lib/domain/onboarding";
import { spendCube } from "@/lib/domain/spend/cube";
import { ingestSpend } from "@/lib/domain/spend/ingest";
import { parseSpendFile } from "@/lib/domain/spend/parse";
import { buildSampleSpendRows } from "@/lib/domain/spend/sample";
import type { OnboardingInput } from "@/lib/adaptivity/profile";

const RUN = randomUUID().slice(0, 8);
const tenantIds: string[] = [];

function midInput(orgName: string): OnboardingInput {
  return {
    orgName,
    workspaceName: `Spend WS ${RUN}`,
    taxonomyL1: "Facilities",
    orgTier: "MID", // MID enables M2
    categoryArchetype: "INDIRECT_SERVICE",
    maturity: "DEVELOPING",
    dataReadiness: "FILES",
  };
}

describe("parseSpendFile (CSV)", () => {
  it("parses good rows and flags invalid ones", () => {
    const csv = [
      "supplier,amount,currency,date,businessUnit,site,category,contractId",
      "Acme,12500.00,USD,2026-01-15,Operations,London,Facilities,",
      "BadAmount,abc,USD,2026-01-15,Operations,London,Facilities,",
      "NoDate,500,USD,,Operations,London,Facilities,",
    ].join("\n");
    const buf = new TextEncoder().encode(csv).buffer;
    const { rows, errors } = parseSpendFile(buf, "test.csv");
    expect(rows).toHaveLength(1);
    expect(rows[0].supplier).toBe("Acme");
    expect(rows[0].amountMinor).toBe(1250000n);
    expect(errors).toHaveLength(2);
  });
});

describe("spend ingest + cube", () => {
  let tenantAId: string;
  let tenantBId: string;
  let workspaceAId: string;

  beforeAll(async () => {
    const a = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `spend_a_${RUN}@example.com`,
      input: midInput(`Spend A ${RUN}`),
    });
    const b = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `spend_b_${RUN}@example.com`,
      input: midInput(`Spend B ${RUN}`),
    });
    tenantAId = a.tenant.id;
    tenantBId = b.tenant.id;
    workspaceAId = a.workspace!.id;
    tenantIds.push(tenantAId, tenantBId);
  });

  afterAll(async () => {
    await adminPrisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    await Promise.all([adminPrisma.$disconnect(), prisma.$disconnect()]);
  });

  it("ingests sample spend, upserts suppliers, and computes a quality status", async () => {
    const rows = buildSampleSpendRows();
    const result = await ingestSpend({
      tenantId: tenantAId,
      workspaceId: workspaceAId,
      uploadedById: "test-user",
      filename: "sample.csv",
      rows,
      errors: [],
    });
    expect(result.lineCount).toBe(rows.length);
    expect(result.dataset.rowCount).toBe(rows.length);
    expect(result.dataset.status).toBe("COMPLETE");
    expect(result.supplierCount).toBe(5);
  });

  it("builds a correct, tenant-isolated cube", async () => {
    const cube = await spendCube(tenantAId, workspaceAId);
    expect(cube.lineCount).toBe(40);
    expect(cube.currency).toBe("USD");
    expect(cube.bySupplier).toHaveLength(5);
    expect(cube.byMonth.length).toBeGreaterThan(1);
    // sorted descending by amount
    expect(cube.bySupplier[0].amount).toBeGreaterThanOrEqual(cube.bySupplier[1].amount);

    const empty = await spendCube(tenantBId, workspaceAId);
    expect(empty.lineCount).toBe(0);
  });
});
