import type { Role } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
  TENANT_ADMIN: "Tenant admin",
  CPO: "CPO / executive",
  CATEGORY_MANAGER: "Category manager",
  ANALYST: "Analyst",
  FINANCE_APPROVER: "Finance approver",
  STAKEHOLDER: "Stakeholder",
  LEGAL_COMPLIANCE: "Legal / compliance",
  SUPPLIER_USER: "Supplier (external)",
};

export interface MemberRow {
  id: string;
  name: string | null;
  email: string;
  role: Role;
}

export function RaciTable({ members }: { members: MemberRow[] }) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No team members yet.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-2 font-medium">Member</th>
          <th className="py-2 font-medium">Role</th>
        </tr>
      </thead>
      <tbody>
        {members.map((m) => (
          <tr key={m.id} className="border-b last:border-0">
            <td className="py-2">
              <div className="font-medium">{m.name ?? m.email}</div>
              <div className="text-xs text-muted-foreground">{m.email}</div>
            </td>
            <td className="py-2">
              <Badge variant="secondary">{ROLE_LABELS[m.role]}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
