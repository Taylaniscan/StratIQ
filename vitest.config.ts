import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

// Tests (e.g. the tenant-isolation integration test) need the real DB
// connection strings, which live in .env.local.
loadEnv({ path: ".env.local" });

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Prisma + a single shared DB: run files sequentially to avoid cross-test
    // interference on shared rows.
    fileParallelism: false,
  },
});
