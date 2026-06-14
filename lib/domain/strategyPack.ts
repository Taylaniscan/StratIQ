import { resolveCapabilities, FRAMEWORK_LABELS, MODULE_LABELS } from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";
import { forTenant } from "@/lib/db/tenant";

import { listEvidenceCards } from "./evidence";
import { weightedScore } from "./finance";
import { KRALJIC_LABEL, KRALJIC_POSTURE } from "./kraljic";
import { formatMinor } from "./money";
import { getSimulation } from "./options";
import { getPositioning } from "./positioning";
import { spendCube } from "./spend/cube";
import { getWorkspace } from "./workspace";

const CURRENCY = "USD";

export interface StrategyPack {
  title: string;
  tenantName: string;
  generatedAt: string;
  orgTier: string;
  archetype: string;
  maturity: string;
  status: string;
  taxonomy: string;
  objective: string | null;
  modules: string[];
  frameworks: string[];
  positioning: {
    quadrant: string;
    posture: string;
    supplyRisk: number;
    businessImpact: number;
    rationale: string | null;
  } | null;
  options: {
    label: string;
    isBaseline: boolean;
    isSelected: boolean;
    npv: string;
    score: number;
  }[];
  evidence: {
    claim: string;
    sourceType: string;
    confidence: string;
    collectedAt: string;
  }[];
  aiSummary: { output: string; model: string; createdAt: string } | null;
  spend: { total: string; topSuppliers: { name: string; amount: string }[] } | null;
}

function formatMajor(amount: number) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: CURRENCY,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toFixed(0)} ${CURRENCY}`;
  }
}

export async function buildStrategyPack(
  tenantId: string,
  workspaceId: string,
  tenantName: string,
): Promise<StrategyPack | null> {
  const workspace = await getWorkspace(tenantId, workspaceId);
  if (!workspace) return null;

  const profile = contextProfileSchema.parse(workspace.profile);
  const caps = resolveCapabilities(profile);

  const [positioning, sim, cards, approved, cube] = await Promise.all([
    getPositioning(tenantId, workspaceId),
    getSimulation(tenantId, workspaceId),
    listEvidenceCards(tenantId, workspaceId),
    forTenant(tenantId).aiArtifact.findFirst({
      where: { workspaceId, kind: "EXEC_SUMMARY", status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    }),
    spendCube(tenantId, workspaceId),
  ]);

  return {
    title: workspace.name,
    tenantName,
    generatedAt: new Date().toISOString(),
    orgTier: profile.orgTier,
    archetype: profile.categoryArchetype,
    maturity: profile.maturity,
    status: workspace.status,
    taxonomy: [workspace.taxonomyL1, workspace.taxonomyL2, workspace.taxonomyL3]
      .filter(Boolean)
      .join(" › "),
    objective: workspace.objective,
    modules: caps.enabledModules.map((m) => MODULE_LABELS[m]),
    frameworks: caps.frameworks.map((f) => FRAMEWORK_LABELS[f]),
    positioning: positioning
      ? {
          quadrant: KRALJIC_LABEL[positioning.kraljicQuadrant],
          posture: KRALJIC_POSTURE[positioning.kraljicQuadrant],
          supplyRisk: positioning.kraljicSupplyRisk,
          businessImpact: positioning.kraljicBusinessImpact,
          rationale: positioning.rationale,
        }
      : null,
    options: sim.options.map((o) => ({
      label: o.label,
      isBaseline: o.isBaseline,
      isSelected: o.isSelected,
      npv: o.npvMinor != null ? formatMinor(o.npvMinor, CURRENCY) : "—",
      score: weightedScore(
        o.scores.map((s) => ({ criterionId: s.criterionId, score: s.score })),
        sim.criteria.map((c) => ({ id: c.id, weight: c.weight })),
      ),
    })),
    evidence: cards.map((c) => ({
      claim: c.claim,
      sourceType: c.sourceType,
      confidence: c.confidence,
      collectedAt: c.collectedAt.toISOString().slice(0, 10),
    })),
    aiSummary: approved
      ? { output: approved.output, model: approved.model, createdAt: approved.createdAt.toISOString() }
      : null,
    spend:
      cube.lineCount > 0
        ? {
            total: formatMinor(cube.totalMinor, cube.currency),
            topSuppliers: cube.bySupplier.map((b) => ({ name: b.key, amount: formatMajor(b.amount) })),
          }
        : null,
  };
}
