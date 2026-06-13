import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  resolveCapabilities,
  FRAMEWORK_LABELS,
  MODULE_LABELS,
} from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";
import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { getWorkspace } from "@/lib/domain/workspace";
import { GovernanceEditForm } from "@/components/workspace/GovernanceEditForm";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceId } = await params;
  const { tenant, membership } = await requireActiveMembership();

  const workspace = await getWorkspace(tenant.id, workspaceId);
  if (!workspace) {
    notFound();
  }

  const profile = contextProfileSchema.parse(workspace.profile);
  const caps = resolveCapabilities(profile);
  const canEdit = can(membership.role, "workspace:write");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strategy setup</CardTitle>
          <CardDescription>
            {canEdit
              ? "Scope, taxonomy, and status for this category."
              : "You have read-only access to this workspace."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <GovernanceEditForm
              workspaceId={workspaceId}
              initial={{
                name: workspace.name,
                objective: workspace.objective ?? "",
                taxonomyL1: workspace.taxonomyL1,
                taxonomyL2: workspace.taxonomyL2 ?? "",
                taxonomyL3: workspace.taxonomyL3 ?? "",
                status: workspace.status,
              }}
            />
          ) : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Objective</dt>
              <dd>{workspace.objective || "—"}</dd>
              <dt className="text-muted-foreground">Taxonomy</dt>
              <dd>
                {[workspace.taxonomyL1, workspace.taxonomyL2, workspace.taxonomyL3]
                  .filter(Boolean)
                  .join(" › ")}
              </dd>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Capabilities</CardTitle>
          <CardDescription>
            Resolved from {profile.orgTier.toLowerCase()} ·{" "}
            {profile.categoryArchetype.replace(/_/g, " ").toLowerCase()} ·{" "}
            {profile.maturity.toLowerCase()} · {caps.uiDensity.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Modules ({caps.enabledModules.length})
            </p>
            <ul className="mt-1 space-y-0.5">
              {caps.enabledModules.map((m) => (
                <li key={m}>{MODULE_LABELS[m]}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Frameworks</p>
              <p className="mt-1">
                {caps.frameworks.map((f) => FRAMEWORK_LABELS[f]).join(", ")}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-y-1">
              <dt className="text-xs text-muted-foreground">Options</dt>
              <dd className="text-right">
                ≥{caps.optionPolicy.minOptions} · {caps.optionPolicy.scenarios.toLowerCase()}
              </dd>
              <dt className="text-xs text-muted-foreground">Evidence recency</dt>
              <dd className="text-right">{caps.evidencePolicy.recencyDays}d</dd>
              <dt className="text-xs text-muted-foreground">Integration</dt>
              <dd className="text-right">{caps.integrationMode.toLowerCase()}</dd>
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
