import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { adminPrisma } from "@/lib/db/admin";
import { prisma } from "@/lib/db/prisma";
import { forTenant } from "@/lib/db/tenant";

/**
 * Integration test against the real Supabase Postgres. Proves multi-tenant
 * isolation on two fronts:
 *   - app-layer: forTenant(A) only ever sees tenant A's rows;
 *   - RLS: the runtime role (NOBYPASSRLS) returns NOTHING without app.tenant_id.
 *
 * Seeds two throwaway tenants via the admin client (BYPASSRLS), asserts, then
 * tears everything down.
 */

const RUN = randomUUID().slice(0, 8);

let tenantAId: string;
let tenantBId: string;

beforeAll(async () => {
  const a = await adminPrisma.tenant.create({
    data: { name: `ISO_TEST_A_${RUN}`, orgTier: "SMALL" },
  });
  const b = await adminPrisma.tenant.create({
    data: { name: `ISO_TEST_B_${RUN}`, orgTier: "ENTERPRISE" },
  });
  tenantAId = a.id;
  tenantBId = b.id;

  await adminPrisma.user.createMany({
    data: [
      { tenantId: a.id, email: `a1_${RUN}@example.com`, authUserId: randomUUID() },
      { tenantId: a.id, email: `a2_${RUN}@example.com`, authUserId: randomUUID() },
      { tenantId: b.id, email: `b1_${RUN}@example.com`, authUserId: randomUUID() },
    ],
  });

  const usersA = await adminPrisma.user.findMany({ where: { tenantId: a.id } });
  const usersB = await adminPrisma.user.findMany({ where: { tenantId: b.id } });
  await adminPrisma.membership.createMany({
    data: [
      ...usersA.map((u) => ({ tenantId: a.id, userId: u.id, role: "OWNER" as const })),
      ...usersB.map((u) => ({ tenantId: b.id, userId: u.id, role: "MEMBER" as const })),
    ],
  });
});

afterAll(async () => {
  if (tenantAId) await adminPrisma.tenant.delete({ where: { id: tenantAId } });
  if (tenantBId) await adminPrisma.tenant.delete({ where: { id: tenantBId } });
  await Promise.all([adminPrisma.$disconnect(), prisma.$disconnect()]);
});

describe("tenant isolation (app-layer via forTenant)", () => {
  it("forTenant(A) sees only tenant A users", async () => {
    const users = await forTenant(tenantAId).user.findMany();
    expect(users).toHaveLength(2);
    expect(users.every((u) => u.tenantId === tenantAId)).toBe(true);
    expect(users.some((u) => u.tenantId === tenantBId)).toBe(false);
  });

  it("forTenant(B) sees only tenant B users", async () => {
    const users = await forTenant(tenantBId).user.findMany();
    expect(users).toHaveLength(1);
    expect(users[0].tenantId).toBe(tenantBId);
  });

  it("forTenant(A) sees only tenant A in the tenants table", async () => {
    const tenants = await forTenant(tenantAId).tenant.findMany();
    expect(tenants).toHaveLength(1);
    expect(tenants[0].id).toBe(tenantAId);
  });

  it("forTenant(A) cannot read a specific tenant B user via filter", async () => {
    const leaked = await forTenant(tenantAId).user.findMany({
      where: { email: `b1_${RUN}@example.com` },
    });
    expect(leaked).toHaveLength(0);
  });

  it("forTenant(A) forces the active tenant on create (overwrites a foreign tenantId)", async () => {
    // Attempt to smuggle a row into tenant B while scoped to A; it must land in A.
    const created = await forTenant(tenantAId).user.create({
      data: {
        email: `new_${RUN}@example.com`,
        authUserId: randomUUID(),
        tenantId: tenantBId,
      },
    });
    expect(created.tenantId).toBe(tenantAId);

    const fromB = await forTenant(tenantBId).user.findMany({
      where: { email: `new_${RUN}@example.com` },
    });
    expect(fromB).toHaveLength(0);
  });
});

describe("RLS enforcement (runtime role)", () => {
  it("returns 0 rows when app.tenant_id is not set", async () => {
    const rows = await prisma.$queryRawUnsafe<{ c: number }[]>(
      "select count(*)::int as c from users",
    );
    expect(rows[0].c).toBe(0);
  });

  it("runtime connects as a NOBYPASSRLS role (not postgres)", async () => {
    const rows = await prisma.$queryRawUnsafe<{ current_user: string }[]>(
      "select current_user",
    );
    expect(rows[0].current_user).not.toBe("postgres");
  });
});
