import type { ModuleId, OrgTier, OrgTierConfig } from "../types";

const ALL_MODULES: ModuleId[] = [
  "M1", "M2", "M3", "M4", "M5", "M6",
  "M7", "M8", "M9", "M10", "M11", "M12",
];

/**
 * Org-tier configs (CLAUDE.md §2.3, §5). The tier controls role set, governance
 * depth (approval chain, SSO/SCIM), which modules are visible, default density,
 * and the most-connected integration mode allowed.
 */
export const ORG_TIERS: Record<OrgTier, OrgTierConfig> = {
  SMALL: {
    enabledModules: ["M1", "M3", "M4", "M5", "M6", "M11"],
    roleSet: ["OWNER", "MEMBER", "VIEWER"],
    approvalChain: [{ order: 1, role: "OWNER", label: "Owner sign-off" }],
    sso: false,
    scim: false,
    defaultDensity: "GUIDED",
    integrationCap: "FILES",
  },

  MID: {
    enabledModules: ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M10", "M11"],
    roleSet: ["TENANT_ADMIN", "CATEGORY_MANAGER", "FINANCE_APPROVER", "STAKEHOLDER", "VIEWER"],
    approvalChain: [
      { order: 1, role: "CATEGORY_MANAGER", label: "Category manager review" },
      { order: 2, role: "FINANCE_APPROVER", label: "Finance approval" },
    ],
    sso: true,
    scim: false,
    defaultDensity: "STANDARD",
    integrationCap: "FILES",
  },

  ENTERPRISE: {
    enabledModules: ALL_MODULES,
    roleSet: [
      "TENANT_ADMIN",
      "CPO",
      "CATEGORY_MANAGER",
      "ANALYST",
      "FINANCE_APPROVER",
      "STAKEHOLDER",
      "LEGAL_COMPLIANCE",
      "SUPPLIER_USER",
    ],
    approvalChain: [
      { order: 1, role: "CATEGORY_MANAGER", label: "Category manager review" },
      { order: 2, role: "FINANCE_APPROVER", label: "Finance approval" },
      { order: 3, role: "CPO", label: "Executive council sign-off" },
    ],
    sso: true,
    scim: true,
    defaultDensity: "STANDARD",
    integrationCap: "CONNECTED",
  },
};
