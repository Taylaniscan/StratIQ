import { PrismaClient } from "@prisma/client";

/**
 * Privileged Prisma client connected as the `postgres` role via DIRECT_URL.
 *
 * This role has BYPASSRLS, so it ignores Row Level Security. Use it ONLY for
 * system-level, non-tenant-facing work: migrations-adjacent scripts, seeding,
 * test setup, and cross-tenant lookups that resolve which tenant a request
 * belongs to (e.g. mapping a Supabase auth user to their Membership).
 *
 * NEVER use this client to serve tenant data — use `forTenant()` from
 * lib/db/tenant.ts, which enforces both app-layer scoping and RLS.
 */
const globalForAdmin = globalThis as unknown as {
  adminPrisma: PrismaClient | undefined;
};

export const adminPrisma =
  globalForAdmin.adminPrisma ??
  new PrismaClient({
    datasourceUrl: process.env.DIRECT_URL,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForAdmin.adminPrisma = adminPrisma;
}
