import type { FrameworkId, KpiId, LeverId, ModuleId, SourceId } from "../types";

/**
 * UI labels for every capability id (CLAUDE.md §2.3 requires every enum value to
 * have a label). These are `Record<Id, string>`, so a missing label is a
 * compile-time error — completeness is enforced by the type system.
 */

export const MODULE_LABELS: Record<ModuleId, string> = {
  M1: "Category Workspace & Governance",
  M2: "Spend & Contract Data Fabric",
  M3: "Requirements & Demand Intelligence",
  M4: "Market & Supplier Intelligence Hub",
  M5: "Positioning & Segmentation Studio",
  M6: "Strategy Option Simulator",
  M7: "Sourcing Event & Negotiation Cockpit",
  M8: "Contract & Compliance Control",
  M9: "Transition & Onboarding PMO",
  M10: "Supplier Performance & SRM",
  M11: "Value Realization & Refresh Engine",
  M12: "Executive Command Center",
};

export const FRAMEWORK_LABELS: Record<FrameworkId, string> = {
  KRALJIC: "Kraljic matrix",
  PORTER_FIVE_FORCES: "Porter's five forces",
  SUPPLIER_TIERING: "Supplier tiering",
  SUPPLIER_HEALTH: "Supplier health",
  PESTLE: "PESTLE analysis",
  SUPPLY_RISK_EXPOSURE: "Supply risk exposure",
};

export const SOURCE_LABELS: Record<SourceId, string> = {
  COMMODITY_INDEX: "Commodity index",
  FREIGHT: "Freight rates",
  FX: "FX rates",
  SHOULD_COST: "Should-cost models",
  SUPPLIER_FINANCIAL: "Supplier financials",
  LABOR_RATE_BENCHMARK: "Labor rate benchmark",
  MARKET_RATE_CARD: "Market rate card",
  CAPACITY: "Capacity signals",
  ESG: "ESG ratings",
  CATALOG_PRICE_BENCHMARK: "Catalog price benchmark",
  DISTRIBUTOR_LANDSCAPE: "Distributor landscape",
  COMPONENT_INDEX: "Component index",
  TAIL_SPEND_ANALYTICS: "Tail-spend analytics",
  OEM_LANDSCAPE: "OEM landscape",
  EPC_CONTRACTOR_MARKET: "EPC contractor market",
  RAW_INPUT_INDEX: "Raw input index",
  LEADTIME_CAPACITY: "Lead-time & capacity",
  PROJECT_LABOR_RATE: "Project labor rate",
  FINANCING_RATE: "Financing rate",
};

export const LEVER_LABELS: Record<LeverId, string> = {
  SHOULD_COST_TEARDOWN: "Should-cost teardown",
  INDEX_PRICING: "Index-based pricing",
  DUAL_SOURCE: "Dual sourcing",
  VMI: "Vendor-managed inventory",
  HEDGING: "Hedging",
  SPEC_HARMONIZATION: "Spec harmonization",
  DEMAND_MANAGEMENT: "Demand management",
  SCOPE_RATIONALIZATION: "Scope rationalization",
  RATE_RENEGOTIATION: "Rate renegotiation",
  CONSOLIDATION: "Supplier consolidation",
  OUTCOME_BASED_PRICING: "Outcome-based pricing",
  CATALOG_CONSOLIDATION: "Catalog consolidation",
  TAIL_SPEND_AGGREGATION: "Tail-spend aggregation",
  SPEC_STANDARDIZATION: "Spec standardization",
  PUNCHOUT_PREFERRED_CATALOG: "Punch-out preferred catalog",
  VOLUME_BUNDLING: "Volume bundling",
  DEMAND_POLICY_CONTROL: "Demand policy control",
  GENERIC_SUBSTITUTION: "Generic substitution",
  TCO_OPTIMIZATION: "TCO optimization",
  MILESTONE_PAYMENT_STRUCTURING: "Milestone payment structuring",
  PERFORMANCE_LD_CLAUSES: "Performance & LD clauses",
  CAPEX_PLUS_LIFECYCLE_BUNDLING: "CapEx + lifecycle bundling",
  TURNKEY_VS_MULTIPACKAGE: "Turnkey vs multi-package",
  SITE_STANDARDIZATION: "Site standardization",
  LEASE_VS_BUY_FINANCING: "Lease vs buy financing",
  RISK_TRANSFER_BONDS: "Risk-transfer bonds",
};

export const KPI_LABELS: Record<KpiId, string> = {
  QUALITY_PPM: "Quality (PPM)",
  OTIF: "On-time in-full",
  COST: "Cost",
  CAPACITY: "Capacity",
  ESG: "ESG",
  INNOVATION: "Innovation",
  SLA_ADHERENCE: "SLA adherence",
  QUALITY: "Quality",
  RESPONSIVENESS: "Responsiveness",
  RELATIONSHIP: "Relationship",
  FILL_RATE: "Fill rate",
  PRICE_COMPETITIVENESS: "Price competitiveness",
  CATALOG_ACCURACY: "Catalog accuracy",
  SERVICE_RETURNS: "Service & returns",
  MILESTONE_ON_TIME: "Milestone on-time",
  TECHNICAL_PERFORMANCE: "Technical performance",
  TOTAL_COST_OF_OWNERSHIP: "Total cost of ownership",
  HSE_SAFETY: "HSE / safety",
  UPTIME_SUPPORT: "Uptime & support",
  FINANCIAL_STABILITY: "Financial stability",
};
