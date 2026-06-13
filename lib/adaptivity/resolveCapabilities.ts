import { ARCHETYPES } from "./config/archetypes";
import { DATA_READINESS, INTEGRATION_ORDER } from "./config/dataReadiness";
import { FIELD_REGISTRY } from "./config/fields";
import { MATURITY } from "./config/maturity";
import { ORG_TIERS } from "./config/orgTiers";
import { resolveTerminology } from "./config/terminology";
import type {
  Capabilities,
  ContextProfile,
  FieldSpec,
  IntegrationMode,
  Maturity,
  UiDensity,
} from "./types";

/** Clamp the requested integration mode to the tier's maximum. */
function clampIntegration(
  requested: IntegrationMode,
  cap: IntegrationMode,
): IntegrationMode {
  return INTEGRATION_ORDER[requested] <= INTEGRATION_ORDER[cap] ? requested : cap;
}

/** Maturity dominates the extremes of density; the tier default fills the middle. */
function resolveDensity(maturity: Maturity, tierDefault: UiDensity): UiDensity {
  if (maturity === "FOUNDATIONAL") return "GUIDED";
  if (maturity === "ADVANCED") return "EXPERT";
  return tierDefault;
}

/**
 * The Adaptivity Engine contract (CLAUDE.md §2.2): pure and deterministic — no
 * DB, no I/O, no clock, no randomness. Given a profile, the output is always the
 * same. Returns fresh (deep-copied) objects so consumers can't mutate the shared
 * config maps.
 */
export function resolveCapabilities(profile: ContextProfile): Capabilities {
  const tier = ORG_TIERS[profile.orgTier];
  const archetype = ARCHETYPES[profile.categoryArchetype];
  const maturity = MATURITY[profile.maturity];
  const dataReadiness = DATA_READINESS[profile.dataReadiness];

  const requirementFields: FieldSpec[] = archetype.requirementFields.map((id) => {
    const spec = FIELD_REGISTRY[id];
    if (!spec) {
      throw new Error(`No FieldSpec registered for requirement field "${id}"`);
    }
    return { ...spec };
  });

  return {
    enabledModules: [...tier.enabledModules],
    roleSet: [...tier.roleSet],
    approvalChain: tier.approvalChain.map((step) => ({ ...step })),
    frameworks: [...maturity.frameworks],
    requirementFields,
    intelligenceSources: [...archetype.intelligenceSources],
    strategyLevers: [...archetype.strategyLevers],
    scorecardDimensions: [...archetype.scorecardDimensions],
    optionPolicy: { ...maturity.optionPolicy },
    evidencePolicy: {
      ...maturity.evidencePolicy,
      requiredCards: maturity.evidencePolicy.requiredCards.map((c) => ({ ...c })),
    },
    integrationMode: clampIntegration(
      dataReadiness.integrationMode,
      tier.integrationCap,
    ),
    terminology: resolveTerminology(profile.orgTier, profile.categoryArchetype),
    uiDensity: resolveDensity(profile.maturity, tier.defaultDensity),
    sso: tier.sso,
    scim: tier.scim,
  };
}

const DEFAULT_PROFILE: ContextProfile = {
  orgTier: "SMALL",
  categoryArchetype: "INDIRECT_SERVICE",
  maturity: "FOUNDATIONAL",
  dataReadiness: "FILES",
};

/**
 * Fill a partial profile (as few as the 3 tapped onboarding selections, §2.1)
 * with sensible defaults to produce a complete ContextProfile.
 */
export function withProfileDefaults(
  partial: Partial<ContextProfile>,
): ContextProfile {
  return { ...DEFAULT_PROFILE, ...partial };
}
