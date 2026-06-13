import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LEVER_LABELS, resolveCapabilities } from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";
import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { listEvidenceCards } from "@/lib/domain/evidence";
import { weightedScore } from "@/lib/domain/finance";
import { formatMinor, minorToNumber } from "@/lib/domain/money";
import { getSimulation } from "@/lib/domain/options";
import { publishReadiness } from "@/lib/domain/publish";
import { getWorkspace } from "@/lib/domain/workspace";
import { OptionSimulator } from "@/components/options/OptionSimulator";
import { OptionsView } from "@/components/options/OptionsView";
import { PublishPanel } from "@/components/options/PublishPanel";

const CURRENCY = "USD";

export default async function OptionsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceId } = await params;
  const { tenant, membership } = await requireActiveMembership();

  const workspace = await getWorkspace(tenant.id, workspaceId);
  if (!workspace) notFound();

  const caps = resolveCapabilities(contextProfileSchema.parse(workspace.profile));
  if (!caps.enabledModules.includes("M6")) notFound();

  const canEdit = can(membership.role, "workspace:write");
  const [sim, cards] = await Promise.all([
    getSimulation(tenant.id, workspaceId),
    listEvidenceCards(tenant.id, workspaceId),
  ]);

  const selectedId = sim.options.find((o) => o.isSelected)?.id ?? null;
  const readiness = publishReadiness(
    caps,
    cards,
    sim.options.map((o) => ({ isBaseline: o.isBaseline, isSelected: o.isSelected })),
    selectedId,
  );

  // Helper to compute a weighted score for an option from its stored scores.
  const scoreOf = (o: (typeof sim.options)[number]) =>
    weightedScore(
      o.scores.map((s) => ({ criterionId: s.criterionId, score: s.score })),
      sim.criteria.map((c) => ({ id: c.id, weight: c.weight })),
    );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strategy options</CardTitle>
          <CardDescription>
            ≥{caps.optionPolicy.minOptions} options + a do-nothing baseline ·{" "}
            {caps.optionPolicy.scenarios.toLowerCase()} scenarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <OptionSimulator
              workspaceId={workspaceId}
              scenarios={caps.optionPolicy.scenarios}
              currency={CURRENCY}
              leverOptions={caps.strategyLevers.map((l) => ({ id: l, label: LEVER_LABELS[l] }))}
              initial={{
                criteria: sim.criteria.map((c) => ({ name: c.name, weight: c.weight })),
                options: sim.options.map((o) => {
                  const scoreMap = new Map(o.scores.map((s) => [s.criterionId, s.score]));
                  return {
                    label: o.label,
                    isBaseline: o.isBaseline,
                    isSelected: o.isSelected,
                    levers: o.leversApplied,
                    narrative: o.narrative ?? "",
                    implCost: String(minorToNumber(o.implCostMinor)),
                    savingsBase: String(minorToNumber(o.savingsBaseMinor)),
                    savingsUpside: String(minorToNumber(o.savingsUpsideMinor)),
                    savingsDownside: String(minorToNumber(o.savingsDownsideMinor)),
                    horizonYears: o.horizonYears,
                    scoresByIndex: sim.criteria.map((c) => scoreMap.get(c.id) ?? 0),
                  };
                }),
              }}
            />
          ) : (
            <OptionsView
              options={sim.options.map((o) => ({
                id: o.id,
                label: o.label,
                isBaseline: o.isBaseline,
                isSelected: o.isSelected,
                npv: o.npvMinor != null ? formatMinor(o.npvMinor, CURRENCY) : "—",
                score: scoreOf(o),
              }))}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Publish gate</CardTitle>
          <CardDescription>Evidence + option policy must pass to request review.</CardDescription>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <PublishPanel
              workspaceId={workspaceId}
              blockers={readiness.blockers}
              ready={readiness.ready}
              status={workspace.status}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {readiness.ready
                ? "Ready for review."
                : `Blocked: ${readiness.blockers.join("; ")}`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
