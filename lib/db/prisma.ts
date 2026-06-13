import { PrismaClient } from "@prisma/client";

// Single PrismaClient instance, reused across hot reloads in dev so we don't
// exhaust the connection pool. Runtime uses the pooled (pgbouncer) DATABASE_URL
// from the schema datasource; migrations use DIRECT_URL via the CLI.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
