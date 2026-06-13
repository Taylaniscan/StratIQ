import type { ArchetypeConfig, CategoryArchetype } from "../types";

/**
 * Archetype configs — verbatim from CLAUDE.md §2.3. The archetype dimension
 * reshapes requirement fields, intelligence sources, strategy levers, and
 * scorecard KPIs. Adding an archetype = adding an entry here, never editing a
 * screen.
 */
export const ARCHETYPES: Record<CategoryArchetype, ArchetypeConfig> = {
  DIRECT_MATERIAL: {
    requirementFields: [
      "bom",
      "specGrade",
      "tolerance",
      "avl",
      "demandQty",
      "demandVariability",
      "makeVsBuy",
    ],
    intelligenceSources: [
      "COMMODITY_INDEX",
      "FREIGHT",
      "FX",
      "SHOULD_COST",
      "SUPPLIER_FINANCIAL",
    ],
    strategyLevers: [
      "SHOULD_COST_TEARDOWN",
      "INDEX_PRICING",
      "DUAL_SOURCE",
      "VMI",
      "HEDGING",
      "SPEC_HARMONIZATION",
    ],
    scorecardDimensions: [
      "QUALITY_PPM",
      "OTIF",
      "COST",
      "CAPACITY",
      "ESG",
      "INNOVATION",
    ],
    templatePack: "direct-material-v1",
  },

  INDIRECT_SERVICE: {
    requirementFields: [
      "scopeOfWork",
      "slaTargets",
      "fteOrEffort",
      "rateCard",
      "deliverables",
      "kpis",
    ],
    intelligenceSources: [
      "LABOR_RATE_BENCHMARK",
      "MARKET_RATE_CARD",
      "CAPACITY",
      "SUPPLIER_FINANCIAL",
      "ESG",
    ],
    strategyLevers: [
      "DEMAND_MANAGEMENT",
      "SCOPE_RATIONALIZATION",
      "RATE_RENEGOTIATION",
      "CONSOLIDATION",
      "OUTCOME_BASED_PRICING",
    ],
    scorecardDimensions: [
      "SLA_ADHERENCE",
      "QUALITY",
      "RESPONSIVENESS",
      "COST",
      "ESG",
      "RELATIONSHIP",
    ],
    templatePack: "indirect-service-v1",
  },

  INDIRECT_GOODS: {
    // Physical goods bought indirectly: MRO, IT hardware, packaging, consumables.
    requirementFields: [
      "catalogSku",
      "commercialSpec",
      "substitutability",
      "consumptionRate",
      "demandPredictability",
      "preferredVendorList",
      "complianceStandards",
      "warrantyTerms",
    ],
    intelligenceSources: [
      "CATALOG_PRICE_BENCHMARK",
      "DISTRIBUTOR_LANDSCAPE",
      "COMPONENT_INDEX",
      "FX",
      "SUPPLIER_FINANCIAL",
      "TAIL_SPEND_ANALYTICS",
    ],
    strategyLevers: [
      "CATALOG_CONSOLIDATION",
      "TAIL_SPEND_AGGREGATION",
      "SPEC_STANDARDIZATION",
      "PUNCHOUT_PREFERRED_CATALOG",
      "VOLUME_BUNDLING",
      "DEMAND_POLICY_CONTROL",
      "GENERIC_SUBSTITUTION",
    ],
    scorecardDimensions: [
      "FILL_RATE",
      "OTIF",
      "PRICE_COMPETITIVENESS",
      "CATALOG_ACCURACY",
      "SERVICE_RETURNS",
      "ESG",
    ],
    templatePack: "indirect-goods-v1",
  },

  CAPEX_PROJECT: {
    // Capital / project spend: machinery, plant, construction, large equipment.
    requirementFields: [
      "projectScope",
      "engineeringSpec",
      "capacityRequirement",
      "tcoBasis",
      "installCommissioning",
      "milestoneSchedule",
      "performanceGuarantees",
      "capexBudget",
      "permitsRegulatory",
      "decommissioningEol",
    ],
    intelligenceSources: [
      "OEM_LANDSCAPE",
      "EPC_CONTRACTOR_MARKET",
      "RAW_INPUT_INDEX",
      "LEADTIME_CAPACITY",
      "PROJECT_LABOR_RATE",
      "FINANCING_RATE",
      "SUPPLIER_FINANCIAL",
    ],
    strategyLevers: [
      "TCO_OPTIMIZATION",
      "MILESTONE_PAYMENT_STRUCTURING",
      "PERFORMANCE_LD_CLAUSES",
      "CAPEX_PLUS_LIFECYCLE_BUNDLING",
      "TURNKEY_VS_MULTIPACKAGE",
      "SITE_STANDARDIZATION",
      "LEASE_VS_BUY_FINANCING",
      "RISK_TRANSFER_BONDS",
    ],
    scorecardDimensions: [
      "MILESTONE_ON_TIME",
      "TECHNICAL_PERFORMANCE",
      "TOTAL_COST_OF_OWNERSHIP",
      "HSE_SAFETY",
      "UPTIME_SUPPORT",
      "FINANCIAL_STABILITY",
      "ESG",
    ],
    templatePack: "capex-project-v1",
  },
};
