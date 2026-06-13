import type { DataReadiness, DataReadinessConfig, IntegrationMode } from "../types";

/**
 * Data-readiness configs (CLAUDE.md §2.1). This dimension controls the ingestion
 * paths shown and the automation level via the integration mode. The resolver
 * clamps this to the org tier's `integrationCap` (a SMALL tenant never reaches
 * CONNECTED).
 */
export const DATA_READINESS: Record<DataReadiness, DataReadinessConfig> = {
  MANUAL: { integrationMode: "MANUAL" },
  FILES: { integrationMode: "FILES" },
  CONNECTED: { integrationMode: "CONNECTED" },
};

/** Ordering used to clamp integration mode (lower = less connected). */
export const INTEGRATION_ORDER: Record<IntegrationMode, number> = {
  MANUAL: 0,
  FILES: 1,
  CONNECTED: 2,
};
