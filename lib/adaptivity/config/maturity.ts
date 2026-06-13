import type { EvidenceRequirement, Maturity, MaturityConfig } from "../types";

/**
 * The minimum evidence every strategy needs to leave Draft (CLAUDE.md §16):
 * positioning inputs, demand basis, and supplier universe each need ≥1 card at
 * ≥MEDIUM confidence within the recency policy.
 */
const BASE_REQUIRED_CARDS: EvidenceRequirement[] = [
  { kind: "POSITIONING_INPUT", label: "Category positioning inputs", minConfidence: "MEDIUM" },
  { kind: "DEMAND_BASIS", label: "Demand basis", minConfidence: "MEDIUM" },
  { kind: "SUPPLIER_UNIVERSE", label: "Supplier universe", minConfidence: "MEDIUM" },
];

/**
 * Maturity configs (CLAUDE.md §2.1, §2.4). Maturity controls which analytical
 * frameworks appear and how much rigor: option count, scenario depth, and
 * evidence triangulation. recencyDays defaults to 180 (configurable per tenant).
 */
export const MATURITY: Record<Maturity, MaturityConfig> = {
  FOUNDATIONAL: {
    frameworks: ["KRALJIC"],
    optionPolicy: { minOptions: 2, baseline: true, scenarios: "POINT" },
    evidencePolicy: {
      requiredCards: BASE_REQUIRED_CARDS,
      recencyDays: 180,
      triangulationMin: 1,
    },
  },

  DEVELOPING: {
    frameworks: ["KRALJIC", "PORTER_FIVE_FORCES", "SUPPLIER_TIERING"],
    optionPolicy: { minOptions: 3, baseline: true, scenarios: "RANGE" },
    evidencePolicy: {
      requiredCards: BASE_REQUIRED_CARDS,
      recencyDays: 180,
      triangulationMin: 2,
    },
  },

  ADVANCED: {
    frameworks: [
      "KRALJIC",
      "PORTER_FIVE_FORCES",
      "SUPPLIER_TIERING",
      "SUPPLIER_HEALTH",
      "PESTLE",
      "SUPPLY_RISK_EXPOSURE",
    ],
    optionPolicy: { minOptions: 3, baseline: true, scenarios: "PROBABILISTIC" },
    evidencePolicy: {
      requiredCards: BASE_REQUIRED_CARDS,
      recencyDays: 180,
      triangulationMin: 2,
    },
  },
};
