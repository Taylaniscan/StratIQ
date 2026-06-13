import type { Role } from "@prisma/client";

/**
 * Adaptivity Engine types (CLAUDE.md §2).
 *
 * The four-dimension Context Profile resolves — deterministically, with no I/O —
 * to a Capabilities object that the entire UI and API consult. Every id used in
 * config has a type here and a UI label in config/labels.ts.
 */

// --- The four Context Profile dimensions ----------------------------------

export type OrgTier = "SMALL" | "MID" | "ENTERPRISE";
export type CategoryArchetype =
  | "DIRECT_MATERIAL"
  | "INDIRECT_GOODS"
  | "INDIRECT_SERVICE"
  | "CAPEX_PROJECT";
export type Maturity = "FOUNDATIONAL" | "DEVELOPING" | "ADVANCED";
export type DataReadiness = "MANUAL" | "FILES" | "CONNECTED";

export interface ContextProfile {
  orgTier: OrgTier;
  categoryArchetype: CategoryArchetype;
  maturity: Maturity;
  dataReadiness: DataReadiness;
}

// --- Capability vocabulary -------------------------------------------------

export type ModuleId =
  | "M1" | "M2" | "M3" | "M4" | "M5" | "M6"
  | "M7" | "M8" | "M9" | "M10" | "M11" | "M12";

export type FrameworkId =
  | "KRALJIC"
  | "PORTER_FIVE_FORCES"
  | "SUPPLIER_TIERING"
  | "SUPPLIER_HEALTH"
  | "PESTLE"
  | "SUPPLY_RISK_EXPOSURE";

// Union of every intelligence source used across the archetype configs (§2.3).
export type SourceId =
  | "COMMODITY_INDEX" | "FREIGHT" | "FX" | "SHOULD_COST" | "SUPPLIER_FINANCIAL"
  | "LABOR_RATE_BENCHMARK" | "MARKET_RATE_CARD" | "CAPACITY" | "ESG"
  | "CATALOG_PRICE_BENCHMARK" | "DISTRIBUTOR_LANDSCAPE" | "COMPONENT_INDEX"
  | "TAIL_SPEND_ANALYTICS" | "OEM_LANDSCAPE" | "EPC_CONTRACTOR_MARKET"
  | "RAW_INPUT_INDEX" | "LEADTIME_CAPACITY" | "PROJECT_LABOR_RATE"
  | "FINANCING_RATE";

// Union of every strategy lever used across the archetype configs (§2.3).
export type LeverId =
  | "SHOULD_COST_TEARDOWN" | "INDEX_PRICING" | "DUAL_SOURCE" | "VMI" | "HEDGING"
  | "SPEC_HARMONIZATION" | "DEMAND_MANAGEMENT" | "SCOPE_RATIONALIZATION"
  | "RATE_RENEGOTIATION" | "CONSOLIDATION" | "OUTCOME_BASED_PRICING"
  | "CATALOG_CONSOLIDATION" | "TAIL_SPEND_AGGREGATION" | "SPEC_STANDARDIZATION"
  | "PUNCHOUT_PREFERRED_CATALOG" | "VOLUME_BUNDLING" | "DEMAND_POLICY_CONTROL"
  | "GENERIC_SUBSTITUTION" | "TCO_OPTIMIZATION" | "MILESTONE_PAYMENT_STRUCTURING"
  | "PERFORMANCE_LD_CLAUSES" | "CAPEX_PLUS_LIFECYCLE_BUNDLING"
  | "TURNKEY_VS_MULTIPACKAGE" | "SITE_STANDARDIZATION" | "LEASE_VS_BUY_FINANCING"
  | "RISK_TRANSFER_BONDS";

// Union of every scorecard dimension used across the archetype configs (§2.3).
export type KpiId =
  | "QUALITY_PPM" | "OTIF" | "COST" | "CAPACITY" | "ESG" | "INNOVATION"
  | "SLA_ADHERENCE" | "QUALITY" | "RESPONSIVENESS" | "RELATIONSHIP"
  | "FILL_RATE" | "PRICE_COMPETITIVENESS" | "CATALOG_ACCURACY" | "SERVICE_RETURNS"
  | "MILESTONE_ON_TIME" | "TECHNICAL_PERFORMANCE" | "TOTAL_COST_OF_OWNERSHIP"
  | "HSE_SAFETY" | "UPTIME_SUPPORT" | "FINANCIAL_STABILITY";

// --- Field specs (archetype-shaped intake) ---------------------------------

export type FieldType =
  | "text" | "textarea" | "number" | "currency"
  | "select" | "multiselect" | "boolean" | "date";

export interface FieldSpec {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  options?: { value: string; label: string }[];
}

// --- Policies, governance, terminology -------------------------------------

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export type EvidenceKind =
  | "POSITIONING_INPUT"
  | "DEMAND_BASIS"
  | "SUPPLIER_UNIVERSE";

export interface EvidenceRequirement {
  kind: EvidenceKind;
  label: string;
  minConfidence: Confidence;
}

export interface ApprovalStep {
  order: number;
  role: Role;
  label: string;
  optional?: boolean;
}

export type IntegrationMode = "MANUAL" | "FILES" | "CONNECTED";
export type UiDensity = "GUIDED" | "STANDARD" | "EXPERT";
export type ScenarioMode = "POINT" | "RANGE" | "PROBABILISTIC";

export interface OptionPolicy {
  minOptions: number;
  baseline: true; // a do-nothing baseline is always required
  scenarios: ScenarioMode;
}

export interface EvidencePolicy {
  requiredCards: EvidenceRequirement[];
  recencyDays: number;
  triangulationMin: number;
}

export interface TerminologyPack {
  supplierSingular: string;
  supplierPlural: string;
  itemNoun: string;
  workspaceNoun: string;
  spendNoun: string;
}

// --- The resolved contract -------------------------------------------------

export interface Capabilities {
  enabledModules: ModuleId[];
  roleSet: Role[];
  approvalChain: ApprovalStep[];
  frameworks: FrameworkId[];
  requirementFields: FieldSpec[];
  intelligenceSources: SourceId[];
  strategyLevers: LeverId[];
  scorecardDimensions: KpiId[];
  optionPolicy: OptionPolicy;
  evidencePolicy: EvidencePolicy;
  integrationMode: IntegrationMode;
  terminology: TerminologyPack;
  uiDensity: UiDensity;
  sso: boolean;
  scim: boolean;
}

// --- Config object shapes --------------------------------------------------

export interface ArchetypeConfig {
  requirementFields: string[]; // ids resolved via FIELD_REGISTRY
  intelligenceSources: SourceId[];
  strategyLevers: LeverId[];
  scorecardDimensions: KpiId[];
  templatePack: string;
}

export interface OrgTierConfig {
  enabledModules: ModuleId[];
  roleSet: Role[];
  approvalChain: ApprovalStep[];
  sso: boolean;
  scim: boolean;
  defaultDensity: UiDensity;
  integrationCap: IntegrationMode; // the most connected mode this tier allows
}

export interface MaturityConfig {
  frameworks: FrameworkId[];
  optionPolicy: OptionPolicy;
  evidencePolicy: EvidencePolicy;
}

export interface DataReadinessConfig {
  integrationMode: IntegrationMode;
}
