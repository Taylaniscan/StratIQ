import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveCapabilities } from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";
import { requireActiveMembership } from "@/lib/auth/session";
import {
  getWorkspace,
  listTenantMembers,
  listWorkspaceAudit,
} from "@/lib/domain/workspace";
import { AuditFeed } from "@/components/workspace/AuditFeed";
import { RaciTable } from "@/components/workspace/RaciTable";

export default async function GovernancePage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceId } = await params;
  const { tenant } = await requireActiveMembership();

  const workspace = await getWorkspace(tenant.id, workspaceId);
  if (!workspace) {
    notFound();
  }

  const caps = resolveCapabilities(contextProfileSchema.parse(workspace.profile));
  const members = await listTenantMembers(tenant.id);
  const audit = await listWorkspaceAudit(tenant.id, workspaceId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team</CardTitle>
          <CardDescription>Members and their roles for this tenant.</CardDescription>
        </CardHeader>
        <CardContent>
          <RaciTable
            members={members.map((m) => ({
              id: m.id,
              name: m.user.name,
              email: m.user.email,
              role: m.role,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Approval chain</CardTitle>
          <CardDescription>
            {caps.approvalChain.length}-step sign-off for this profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            {caps.approvalChain.map((step) => (
              <li key={step.order} className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {step.order}
                </span>
                <span>{step.label}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity log</CardTitle>
          <CardDescription>Append-only audit trail for this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditFeed
            entries={audit.map((a) => ({
              id: a.id,
              action: a.action,
              at: a.at,
              actorId: a.actorId,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
