import { describe, it, expect } from "vitest";

import {
  can,
  requireAction,
  requireRole,
  ForbiddenError,
} from "@/lib/auth/rbac";

describe("rbac.can", () => {
  it("grants full access to OWNER and TENANT_ADMIN", () => {
    expect(can("OWNER", "tenant:manage")).toBe(true);
    expect(can("OWNER", "strategy:approve")).toBe(true);
    expect(can("TENANT_ADMIN", "tenant:manage")).toBe(true);
  });

  it("lets FINANCE_APPROVER approve but not write", () => {
    expect(can("FINANCE_APPROVER", "strategy:approve")).toBe(true);
    expect(can("FINANCE_APPROVER", "workspace:write")).toBe(false);
  });

  it("limits VIEWER to read", () => {
    expect(can("VIEWER", "workspace:read")).toBe(true);
    expect(can("VIEWER", "workspace:write")).toBe(false);
    expect(can("VIEWER", "tenant:manage")).toBe(false);
  });

  it("gives external SUPPLIER_USER no internal actions", () => {
    expect(can("SUPPLIER_USER", "workspace:read")).toBe(false);
  });
});

describe("rbac.requireAction", () => {
  it("passes when permitted", () => {
    expect(() => requireAction({ role: "CATEGORY_MANAGER" }, "workspace:write")).not.toThrow();
  });

  it("throws ForbiddenError when not permitted or missing", () => {
    expect(() => requireAction({ role: "VIEWER" }, "workspace:write")).toThrow(ForbiddenError);
    expect(() => requireAction(null, "workspace:read")).toThrow(ForbiddenError);
  });
});

describe("rbac.requireRole", () => {
  it("passes when role is allowed", () => {
    expect(() => requireRole({ role: "CPO" }, ["CPO", "OWNER"])).not.toThrow();
  });

  it("throws when role is not allowed or missing", () => {
    expect(() => requireRole({ role: "ANALYST" }, ["OWNER"])).toThrow(ForbiddenError);
    expect(() => requireRole(undefined, ["OWNER"])).toThrow(ForbiddenError);
  });
});
