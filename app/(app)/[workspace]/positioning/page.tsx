import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FRAMEWORK_LABELS, resolveCapabilities } from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";
import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { listEvidenceCards } from "@/lib/domain/evidence";
import { getPositioning } from "@/lib/domain/positioning";
import { getWorkspace } from "@/lib/domain/workspace";
import { PositioningStudio } from "@/components/positioning/PositioningStudio";
import { PositioningView } from "@/components/positioning/PositioningView";

export default async function PositioningPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceId } = await params;
  const { tenant, membership } = await requireActiveMembership();

  const workspace = await getWorkspace(tenant.id, workspaceId);
  if (!workspace) notFound();

  const caps = resolveCapabilities(contextProfileSchema.parse(workspace.profile));
  if (!caps.enabledModules.includes("M5")) notFound();

  const canEdit = can(membership.role, "workspace:write");
  const [positioning, cards] = await Promise.all([
    getPositioning(tenant.id, workspaceId),
    listEvidenceCards(tenant.id, workspaceId),
  ]);

  const otherFrameworks = caps.frameworks
    .filter((f) => f !== "KRALJIC")
    .map((f) => ({ id: f, label: FRAMEWORK_LABELS[f] }));

  const savedFrameworks =
    (positioning?.frameworks as Record<string, string> | null) ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Positioning</CardTitle>
        <CardDescription>
          Kraljic segmentation
          {otherFrameworks.length > 0
            ? ` + ${otherFrameworks.map((f) => f.label).join(", ")}`
            : ""}
          , backed by evidence.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {canEdit ? (
          <PositioningStudio
            workspaceId={workspaceId}
            otherFrameworks={otherFrameworks}
            evidenceOptions={cards.map((c) => ({ id: c.id, claim: c.claim }))}
            initial={{
              supplyRisk: positioning?.kraljicSupplyRisk ?? 50,
              businessImpact: positioning?.kraljicBusinessImpact ?? 50,
              rationale: positioning?.rationale ?? "",
              frameworks: savedFrameworks,
              evidenceIds: positioning?.evidenceIds ?? [],
            }}
          />
        ) : positioning ? (
          <PositioningView
            supplyRisk={positioning.kraljicSupplyRisk}
            businessImpact={positioning.kraljicBusinessImpact}
            quadrant={positioning.kraljicQuadrant}
            rationale={positioning.rationale}
            frameworks={otherFrameworks.map((f) => ({
              label: f.label,
              notes: savedFrameworks[f.id] ?? "",
            }))}
            evidenceClaims={cards
              .filter((c) => positioning.evidenceIds.includes(c.id))
              .map((c) => c.claim)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Not positioned yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
