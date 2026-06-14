import type { AiStatus } from "@prisma/client";

import { validateCitations } from "@/lib/ai/grounding";
import { getAIProvider, type AIProvider, type SynthInput } from "@/lib/ai/provider";
import { forTenant } from "@/lib/db/tenant";

import { recordAudit } from "./audit";
import { listEvidenceCards } from "./evidence";
import { formatMinor } from "./money";
import { getSimulation } from "./options";
import { getPositioning } from "./positioning";

const CURRENCY = "USD";

/** Gather workspace facts + evidence into a grounded synthesis input. */
async function buildSynthInput(
  tenantId: string,
  workspaceId: string,
): Promise<{ input: SynthInput; validIds: string[] }> {
  const db = forTenant(tenantId);
  const [workspace, positioning, sim, cards] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId } }),
    getPositioning(tenantId, workspaceId),
    getSimulation(tenantId, workspaceId),
    listEvidenceCards(tenantId, workspaceId),
  ]);

  const profile = (workspace?.profile ?? {}) as { categoryArchetype?: string };
  const taxonomy = [workspace?.taxonomyL1, workspace?.taxonomyL2, workspace?.taxonomyL3]
    .filter(Boolean)
    .join(" › ");

  const lines: string[] = [
    `Category: ${workspace?.name ?? "(unnamed)"} (${profile.categoryArchetype ?? "unknown archetype"})`,
    taxonomy ? `Taxonomy: ${taxonomy}` : "",
    workspace?.objective ? `Objective: ${workspace.objective}` : "",
  ];
  if (positioning) {
    lines.push(
      `Positioning: Kraljic ${positioning.kraljicQuadrant} (supply risk ${positioning.kraljicSupplyRisk}, business impact ${positioning.kraljicBusinessImpact}).${positioning.rationale ? ` Rationale: ${positioning.rationale}` : ""}`,
    );
  }
  if (sim.options.length > 0) {
    lines.push("Options:");
    for (const o of sim.options) {
      const tags = [o.isBaseline ? "baseline" : null, o.isSelected ? "selected" : null]
        .filter(Boolean)
        .join(", ");
      const npv = o.npvMinor != null ? formatMinor(o.npvMinor, CURRENCY) : "n/a";
      lines.push(`- ${o.label}${tags ? ` (${tags})` : ""}: NPV ${npv}`);
    }
  }

  const input: SynthInput = {
    task: "Executive summary",
    context: lines.filter(Boolean).join("\n"),
    evidence: cards.map((c) => ({
      id: c.id,
      claim: c.claim,
      sourceType: c.sourceType,
      confidence: c.confidence,
      collectedAt: c.collectedAt.toISOString().slice(0, 10),
    })),
  };
  return { input, validIds: cards.map((c) => c.id) };
}

export async function generateSynthesis(
  tenantId: string,
  workspaceId: string,
  actorId: string,
  provider: AIProvider = getAIProvider(),
) {
  const { input, validIds } = await buildSynthInput(tenantId, workspaceId);
  const result = await provider.synthesize(input);
  const { cleanSummary, validCited, strippedCount } = validateCitations(
    result.summary,
    result.citedEvidenceIds,
    validIds,
  );

  const artifact = await forTenant(tenantId).aiArtifact.create({
    data: {
      tenantId,
      workspaceId,
      kind: "EXEC_SUMMARY",
      prompt: `${input.task}\n\n${input.context}`,
      model: result.model,
      output: cleanSummary,
      evidenceIds: validCited,
      status: "DRAFT",
      createdById: actorId,
    },
  });

  await recordAudit({
    tenantId,
    actorId,
    action: "ai.synthesis.generate",
    entity: "AiArtifact",
    entityId: artifact.id,
    payload: { model: result.model, cited: validCited.length, stripped: strippedCount },
  });

  return { artifact, strippedCount };
}

export function listSyntheses(tenantId: string, workspaceId: string) {
  return forTenant(tenantId).aiArtifact.findMany({
    where: { workspaceId, kind: "EXEC_SUMMARY" },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLatestSynthesis(tenantId: string, workspaceId: string) {
  return forTenant(tenantId).aiArtifact.findFirst({
    where: { workspaceId, kind: "EXEC_SUMMARY" },
    orderBy: { createdAt: "desc" },
  });
}

export async function setSynthesisStatus(
  tenantId: string,
  workspaceId: string,
  actorId: string,
  artifactId: string,
  status: AiStatus,
) {
  const db = forTenant(tenantId);
  const existing = await db.aiArtifact.findFirst({ where: { id: artifactId, workspaceId } });
  if (!existing) throw new Error("AI artifact not found");

  const updated = await db.aiArtifact.update({ where: { id: artifactId }, data: { status } });
  await recordAudit({
    tenantId,
    actorId,
    action: "ai.synthesis.status",
    entity: "AiArtifact",
    entityId: artifactId,
    payload: { status },
  });
  return updated;
}
