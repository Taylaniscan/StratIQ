import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { listEvidenceCards } from "@/lib/domain/evidence";
import { getLatestSynthesis } from "@/lib/domain/synthesis";
import { getWorkspace } from "@/lib/domain/workspace";
import { SynthesisPanel } from "@/components/ai/SynthesisPanel";

export default async function SynthesisPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceId } = await params;
  const { tenant, membership } = await requireActiveMembership();

  const workspace = await getWorkspace(tenant.id, workspaceId);
  if (!workspace) notFound();

  const [latest, cards] = await Promise.all([
    getLatestSynthesis(tenant.id, workspaceId),
    listEvidenceCards(tenant.id, workspaceId),
  ]);

  const claimById = new Map(cards.map((c) => [c.id, c.claim]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI synthesis</CardTitle>
        <CardDescription>
          Evidence-grounded executive summary — cites only stored evidence; needs
          human approval to be used.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SynthesisPanel
          workspaceId={workspaceId}
          canGenerate={can(membership.role, "workspace:write")}
          canApprove={
            can(membership.role, "strategy:approve") || can(membership.role, "workspace:write")
          }
          latest={
            latest
              ? {
                  id: latest.id,
                  output: latest.output,
                  model: latest.model,
                  status: latest.status,
                  createdAt: latest.createdAt.toISOString(),
                  citedClaims: latest.evidenceIds
                    .map((id) => claimById.get(id))
                    .filter((c): c is string => !!c),
                }
              : null
          }
        />
      </CardContent>
    </Card>
  );
}
