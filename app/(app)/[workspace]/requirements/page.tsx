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
import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { getRequirement } from "@/lib/domain/requirements";
import { getWorkspace } from "@/lib/domain/workspace";
import { RequirementForm } from "@/components/requirements/RequirementForm";
import { RequirementSummary } from "@/components/requirements/RequirementSummary";

export default async function RequirementsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceId } = await params;
  const { tenant, membership } = await requireActiveMembership();

  const workspace = await getWorkspace(tenant.id, workspaceId);
  if (!workspace) notFound();

  const profile = contextProfileSchema.parse(workspace.profile);
  const caps = resolveCapabilities(profile);
  if (!caps.enabledModules.includes("M3")) notFound();

  const canEdit = can(membership.role, "workspace:write");
  const artifact = await getRequirement(tenant.id, workspaceId);
  const values =
    (artifact?.data as Record<string, string | string[]> | undefined) ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Requirements</CardTitle>
        <CardDescription>
          Intake fields shaped for{" "}
          {profile.categoryArchetype.replace(/_/g, " ").toLowerCase()} categories.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {canEdit ? (
          <RequirementForm
            workspaceId={workspaceId}
            fields={caps.requirementFields}
            initial={values}
          />
        ) : (
          <RequirementSummary fields={caps.requirementFields} values={values} />
        )}
      </CardContent>
    </Card>
  );
}
