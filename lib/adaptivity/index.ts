/**
 * The Adaptivity Engine (CLAUDE.md §2). Import the resolver + types from here;
 * screens consume `Capabilities`, never the raw profile or config maps.
 */
export * from "./types";
export { resolveCapabilities, withProfileDefaults } from "./resolveCapabilities";

export { ARCHETYPES } from "./config/archetypes";
export { ORG_TIERS } from "./config/orgTiers";
export { MATURITY } from "./config/maturity";
export { DATA_READINESS } from "./config/dataReadiness";
export { FIELD_REGISTRY } from "./config/fields";
export { resolveTerminology } from "./config/terminology";
export {
  MODULE_LABELS,
  FRAMEWORK_LABELS,
  SOURCE_LABELS,
  LEVER_LABELS,
  KPI_LABELS,
} from "./config/labels";
