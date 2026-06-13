import type { Role } from "@prisma/client";

/**
 * Minimal role-based access control. This is intentionally small: rich,
 * profile-aware gating is the job of the Adaptivity Engine's `Capabilities`
 * (CLAUDE.md §2/§5). This layer answers the coarse question "may this role take
 * this action at all?" and is consumed by API-boundary guards.
 */
export type Action =
  | "tenant:manage" // org settings, members, roles
  | "workspace:read"
  | "workspace:write"
  | "strategy:approve"; // finance / executive sign-off

const ALL: Action[] = [
  "tenant:manage",
  "workspace:read",
  "workspace:write",
  "strategy:approve",
];

const ROLE_ACTIONS: Record<Role, Action[]> = {
  // SMALL tier collapsed roles
  OWNER: ALL,
  MEMBER: ["workspace:read", "workspace:write"],
  VIEWER: ["workspace:read"],
  // Enterprise role matrix
  TENANT_ADMIN: ALL,
  CPO: ["workspace:read", "workspace:write", "strategy:approve"],
  CATEGORY_MANAGER: ["workspace:read", "workspace:write"],
  ANALYST: ["workspace:read", "workspace:write"],
  FINANCE_APPROVER: ["workspace:read", "strategy:approve"],
  STAKEHOLDER: ["workspace:read"],
  LEGAL_COMPLIANCE: ["workspace:read"],
  // External supplier users have no internal actions.
  SUPPLIER_USER: [],
};

/** True if `role` is permitted to take `action`. */
export function can(role: Role, action: Action): boolean {
  return ROLE_ACTIONS[role]?.includes(action) ?? false;
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Assert the membership's role may take `action`; throws ForbiddenError otherwise.
 * Pass the membership resolved for the active tenant (see lib/auth/session.ts).
 */
export function requireAction(
  membership: { role: Role } | null | undefined,
  action: Action,
): void {
  if (!membership || !can(membership.role, action)) {
    throw new ForbiddenError(`Missing permission: ${action}`);
  }
}

/** Assert the membership's role is one of `roles`; throws ForbiddenError otherwise. */
export function requireRole(
  membership: { role: Role } | null | undefined,
  roles: Role[],
): void {
  if (!membership || !roles.includes(membership.role)) {
    throw new ForbiddenError(`Requires one of: ${roles.join(", ")}`);
  }
}
