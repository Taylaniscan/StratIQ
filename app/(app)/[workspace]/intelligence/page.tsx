import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveCapabilities, SOURCE_LABELS } from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";
import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import {
  computeFreshness,
  evidenceReadiness,
  listEvidenceCards,
} from "@/lib/domain/evidence";
import { listSuppliers } from "@/lib/domain/suppliers";
import { getWorkspace } from "@/lib/domain/workspace";
import { AddEvidenceForm } from "@/components/intelligence/AddEvidenceForm";
import { EvidenceList } from "@/components/intelligence/EvidenceList";
import { EvidenceReadiness } from "@/components/intelligence/EvidenceReadiness";
import { IntelligenceSources } from "@/components/intelligence/IntelligenceSources";
import { SupplierUniverse } from "@/components/intelligence/SupplierUniverse";

export default async function IntelligencePage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceId } = await params;
  const { tenant, membership } = await requireActiveMembership();

  const workspace = await getWorkspace(tenant.id, workspaceId);
  if (!workspace) notFound();

  const caps = resolveCapabilities(contextProfileSchema.parse(workspace.profile));
  if (!caps.enabledModules.includes("M4")) notFound();

  const canEdit = can(membership.role, "workspace:write");
  const recencyDays = caps.evidencePolicy.recencyDays;

  const [suppliers, cards] = await Promise.all([
    listSuppliers(tenant.id),
    listEvidenceCards(tenant.id, workspaceId),
  ]);

  const readiness = evidenceReadiness(cards, caps.evidencePolicy);
  const sourceLabels = caps.intelligenceSources.map((s) => SOURCE_LABELS[s]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evidence readiness</CardTitle>
          <CardDescription>
            Required to leave Draft (within {recencyDays}-day recency).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EvidenceReadiness rows={readiness} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supplier universe</CardTitle>
            <CardDescription>Incumbent and alternative suppliers.</CardDescription>
          </CardHeader>
          <CardContent>
            <SupplierUniverse
              workspaceId={workspaceId}
              canEdit={canEdit}
              suppliers={suppliers.map((s) => ({
                id: s.id,
                name: s.name,
                isIncumbent: s.isIncumbent,
                tier: s.tier,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Intelligence sources</CardTitle>
            <CardDescription>Tuned to this category archetype.</CardDescription>
          </CardHeader>
          <CardContent>
            <IntelligenceSources labels={sourceLabels} />
          </CardContent>
        </Card>
      </div>

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add evidence</CardTitle>
            <CardDescription>
              Every claim is sourced, dated, and confidence-rated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddEvidenceForm workspaceId={workspaceId} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evidence ({cards.length})</CardTitle>
          <CardDescription>The trust spine for this category.</CardDescription>
        </CardHeader>
        <CardContent>
          <EvidenceList
            cards={cards.map((c) => ({
              id: c.id,
              claim: c.claim,
              category: c.category,
              sourceType: c.sourceType,
              sourceRef: c.sourceRef,
              sourceUrl: c.sourceUrl,
              collectedAt: c.collectedAt,
              confidence: c.confidence,
              freshness: computeFreshness(c.collectedAt, recencyDays),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
