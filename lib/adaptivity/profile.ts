import { z } from "zod";

import type { ContextProfile } from "./types";

/**
 * Zod schemas for Context Profile dimensions and the onboarding payload. Kept
 * out of the pure engine barrel (index.ts) so adaptivity consumers don't pull in
 * zod; the server boundary imports these directly (CLAUDE.md §3).
 */

export const orgTierSchema = z.enum(["SMALL", "MID", "ENTERPRISE"]);
export const categoryArchetypeSchema = z.enum([
  "DIRECT_MATERIAL",
  "INDIRECT_GOODS",
  "INDIRECT_SERVICE",
  "CAPEX_PROJECT",
]);
export const maturitySchema = z.enum(["FOUNDATIONAL", "DEVELOPING", "ADVANCED"]);
export const dataReadinessSchema = z.enum(["MANUAL", "FILES", "CONNECTED"]);

export const contextProfileSchema = z.object({
  orgTier: orgTierSchema,
  categoryArchetype: categoryArchetypeSchema,
  maturity: maturitySchema,
  dataReadiness: dataReadinessSchema,
});

// Compile-time guarantee that the schema's output matches the engine's type.
type _ProfileMatches = ContextProfile extends z.infer<typeof contextProfileSchema>
  ? z.infer<typeof contextProfileSchema> extends ContextProfile
    ? true
    : never
  : never;
const _profileCheck: _ProfileMatches = true;
void _profileCheck;

const name = (label: string) =>
  z.string().trim().min(2, `${label} must be at least 2 characters`).max(120);

export const onboardingInputSchema = z.object({
  orgName: name("Organization name"),
  workspaceName: name("Category name"),
  taxonomyL1: name("Top-level category"),
  orgTier: orgTierSchema,
  categoryArchetype: categoryArchetypeSchema,
  maturity: maturitySchema,
  dataReadiness: dataReadinessSchema,
});

export type OnboardingInput = z.infer<typeof onboardingInputSchema>;
