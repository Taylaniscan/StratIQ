import type { CategoryArchetype, OrgTier, TerminologyPack } from "../types";

/**
 * Terminology packs (CLAUDE.md §2.2, §9). The tier sets the base vocabulary
 * (SMALL uses plainer "vendor"; larger tiers use "supplier"); the archetype
 * overlays the item noun ("SKU" for goods/materials, "line item" otherwise,
 * "engagement" for services).
 */
const TIER_BASE: Record<OrgTier, TerminologyPack> = {
  SMALL: {
    supplierSingular: "Vendor",
    supplierPlural: "Vendors",
    itemNoun: "Item",
    workspaceNoun: "Category",
    spendNoun: "Spend",
  },
  MID: {
    supplierSingular: "Supplier",
    supplierPlural: "Suppliers",
    itemNoun: "Line item",
    workspaceNoun: "Category",
    spendNoun: "Spend",
  },
  ENTERPRISE: {
    supplierSingular: "Supplier",
    supplierPlural: "Suppliers",
    itemNoun: "Line item",
    workspaceNoun: "Category",
    spendNoun: "Spend",
  },
};

const ARCHETYPE_ITEM_NOUN: Record<CategoryArchetype, string> = {
  DIRECT_MATERIAL: "SKU",
  INDIRECT_GOODS: "SKU",
  INDIRECT_SERVICE: "Engagement",
  CAPEX_PROJECT: "Work package",
};

export function resolveTerminology(
  orgTier: OrgTier,
  archetype: CategoryArchetype,
): TerminologyPack {
  return {
    ...TIER_BASE[orgTier],
    itemNoun: ARCHETYPE_ITEM_NOUN[archetype],
  };
}
