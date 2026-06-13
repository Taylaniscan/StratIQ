import { prisma } from "./prisma";

/**
 * Tenant-scoped database access — the primary line of defense for multi-tenancy,
 * backed by Postgres RLS as the second.
 *
 * `forTenant(tenantId)` returns a Prisma client that, for every model operation:
 *   1. Wraps the query in a transaction that sets `app.tenant_id`, so the RLS
 *      `tenant_isolation` policy filters rows for the (NOBYPASSRLS) runtime role.
 *   2. Injects the tenant id into `where` (filterable reads/bulk writes) and into
 *      `data` (creates), so isolation holds even before RLS and so inserts satisfy
 *      the RLS `WITH CHECK`.
 *
 * Use this for ALL tenant-facing data access. Never use the bare `prisma` /
 * `adminPrisma` clients to serve tenant data.
 */

// Model name -> the column that carries the tenant id. `Tenant` is scoped by its
// own primary key.
const TENANT_FIELD: Record<string, "tenantId" | "id"> = {
  User: "tenantId",
  Membership: "tenantId",
  Tenant: "id",
};

// Operations whose `where` is a free-form filter (safe to add a tenant predicate).
const WHERE_FILTER_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);

// Operations that create rows (stamp the tenant id onto the data).
const CREATE_OPS = new Set(["create", "createMany"]);

export function forTenant(tenantId: string) {
  if (!tenantId) throw new Error("forTenant requires a tenantId");

  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const field = model ? TENANT_FIELD[model] : undefined;

          if (field) {
            const a = (args ?? {}) as Record<string, unknown>;

            // Inject the tenant predicate into filterable operations.
            if (WHERE_FILTER_OPS.has(operation)) {
              a.where = { ...((a.where as object) ?? {}), [field]: tenantId };
            }

            // Stamp the tenant id onto created rows (skip Tenant, whose id is the
            // tenant id and is supplied explicitly).
            if (CREATE_OPS.has(operation) && field === "tenantId") {
              if (operation === "createMany") {
                const data = a.data;
                if (Array.isArray(data)) {
                  a.data = data.map((d) => ({ ...(d as object), [field]: tenantId }));
                } else if (data) {
                  a.data = { ...(data as object), [field]: tenantId };
                }
              } else {
                a.data = { ...((a.data as object) ?? {}), [field]: tenantId };
              }
            }
          }

          // Run the query inside a transaction that sets app.tenant_id so RLS
          // enforces, regardless of the app-layer predicates above.
          const [, result] = await prisma.$transaction([
            prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
            query(args),
          ]);
          return result;
        },
      },
    },
  });
}

export type TenantClient = ReturnType<typeof forTenant>;

/** Convenience wrapper: run `fn` with a tenant-scoped client. */
export function withTenant<T>(
  tenantId: string,
  fn: (db: TenantClient) => Promise<T>,
): Promise<T> {
  return fn(forTenant(tenantId));
}
