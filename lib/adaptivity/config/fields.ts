import type { FieldSpec } from "../types";

const LOW_MED_HIGH = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

/**
 * Registry of every requirement field referenced by an archetype (CLAUDE.md §2.3).
 * The resolver expands an archetype's `requirementFields` (ids) into these specs.
 * A field id used in an archetype but missing here is a config error caught by
 * tests/adaptivity/config.test.ts.
 */
export const FIELD_REGISTRY: Record<string, FieldSpec> = {
  // --- DIRECT_MATERIAL ---
  bom: { id: "bom", label: "Bill of materials", type: "textarea", help: "Components and quantities." },
  specGrade: { id: "specGrade", label: "Specification / grade", type: "text" },
  tolerance: { id: "tolerance", label: "Tolerance", type: "text", help: "Acceptable variance on key dimensions." },
  avl: { id: "avl", label: "Approved vendor list", type: "textarea" },
  demandQty: { id: "demandQty", label: "Annual demand quantity", type: "number" },
  demandVariability: {
    id: "demandVariability", label: "Demand variability", type: "select", options: LOW_MED_HIGH,
  },
  makeVsBuy: {
    id: "makeVsBuy", label: "Make vs buy", type: "select",
    options: [
      { value: "MAKE", label: "Make" },
      { value: "BUY", label: "Buy" },
      { value: "HYBRID", label: "Hybrid" },
    ],
  },

  // --- INDIRECT_SERVICE ---
  scopeOfWork: { id: "scopeOfWork", label: "Scope of work", type: "textarea", required: true },
  slaTargets: { id: "slaTargets", label: "SLA targets", type: "textarea" },
  fteOrEffort: { id: "fteOrEffort", label: "FTE / effort", type: "text", help: "Headcount or effort basis." },
  rateCard: { id: "rateCard", label: "Rate card", type: "textarea" },
  deliverables: { id: "deliverables", label: "Deliverables", type: "textarea" },
  kpis: { id: "kpis", label: "KPIs", type: "textarea" },

  // --- INDIRECT_GOODS ---
  catalogSku: { id: "catalogSku", label: "Catalog SKU", type: "text" },
  commercialSpec: { id: "commercialSpec", label: "Commercial specification", type: "textarea" },
  substitutability: {
    id: "substitutability", label: "Substitutability", type: "select", options: LOW_MED_HIGH,
  },
  consumptionRate: { id: "consumptionRate", label: "Consumption rate", type: "text" },
  demandPredictability: {
    id: "demandPredictability", label: "Demand predictability", type: "select", options: LOW_MED_HIGH,
  },
  preferredVendorList: { id: "preferredVendorList", label: "Preferred vendor list", type: "textarea" },
  complianceStandards: { id: "complianceStandards", label: "Compliance standards", type: "textarea" },
  warrantyTerms: { id: "warrantyTerms", label: "Warranty terms", type: "textarea" },

  // --- CAPEX_PROJECT ---
  projectScope: { id: "projectScope", label: "Project scope", type: "textarea", required: true },
  engineeringSpec: { id: "engineeringSpec", label: "Engineering specification", type: "textarea" },
  capacityRequirement: { id: "capacityRequirement", label: "Capacity requirement", type: "text" },
  tcoBasis: { id: "tcoBasis", label: "TCO basis", type: "textarea", help: "Lifecycle cost assumptions." },
  installCommissioning: { id: "installCommissioning", label: "Install & commissioning", type: "textarea" },
  milestoneSchedule: { id: "milestoneSchedule", label: "Milestone schedule", type: "textarea" },
  performanceGuarantees: { id: "performanceGuarantees", label: "Performance guarantees", type: "textarea" },
  capexBudget: { id: "capexBudget", label: "CapEx budget", type: "currency" },
  permitsRegulatory: { id: "permitsRegulatory", label: "Permits & regulatory", type: "textarea" },
  decommissioningEol: { id: "decommissioningEol", label: "Decommissioning / end-of-life", type: "textarea" },
};
