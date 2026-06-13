import type { WorkspaceStatus } from "@prisma/client";

import { forTenant } from "@/lib/db/tenant";

import { recordAudit } from "./audit";
import { computeNpvMinor } from "./finance";

/**
 * Strategy Option Simulator persistence (M6). The whole simulation (criteria +
 * options + scores) is saved as one replace operation so the client edits it as a
 * unit. Tenant-scoped via forTenant; not a single DB transaction (each op carries
 * its own set_config) — acceptable at v1 scale.
 */

export interface CriterionInput {
  name: string;
  weight: number;
}

export interface OptionInput {
  label: string;
  isBaseline: boolean;
  isSelected: boolean;
  leversApplied: string[];
  narrative?: string | null;
  implCostMinor: bigint;
  savingsBaseMinor: bigint;
  savingsUpsideMinor: bigint;
  savingsDownsideMinor: bigint;
  horizonYears: number;
  riskScore?: number | null;
  scores: { criterionIndex: number; score: number; rationale?: string | null }[];
}

export interface SimulationInput {
  criteria: CriterionInput[];
  options: OptionInput[];
}

export async function getSimulation(tenantId: string, workspaceId: string) {
  const db = forTenant(tenantId);
  const [criteria, options] = await Promise.all([
    db.decisionCriterion.findMany({ where: { workspaceId }, orderBy: { position: "asc" } }),
    db.strategyOption.findMany({
      where: { workspaceId },
      orderBy: { position: "asc" },
      include: { scores: true },
    }),
  ]);
  return { criteria, options };
}

export async function saveSimulation(
  tenantId: string,
  workspaceId: string,
  actorId: string,
  input: SimulationInput,
  allowedLevers: string[],
) {
  const allowed = new Set(allowedLevers);
  for (const o of input.options) {
    const bad = o.leversApplied.filter((l) => !allowed.has(l));
    if (bad.length > 0) throw new Error(`Ungated levers: ${bad.join(", ")}`);
  }
  if (input.options.filter((o) => o.isBaseline).length > 1) {
    throw new Error("Only one option can be the baseline");
  }
  if (input.options.filter((o) => o.isSelected).length > 1) {
    throw new Error("Only one option can be selected");
  }

  const db = forTenant(tenantId);

  // Replace: deleting options cascades their scores.
  await db.strategyOption.deleteMany({ where: { workspaceId } });
  await db.decisionCriterion.deleteMany({ where: { workspaceId } });

  const criterionIds: string[] = [];
  for (let i = 0; i < input.criteria.length; i++) {
    const c = input.criteria[i];
    const created = await db.decisionCriterion.create({
      data: { tenantId, workspaceId, name: c.name, weight: c.weight, position: i },
    });
    criterionIds.push(created.id);
  }

  for (let i = 0; i < input.options.length; i++) {
    const o = input.options[i];
    const npvMinor = computeNpvMinor(o.savingsBaseMinor, o.horizonYears, o.implCostMinor);
    const option = await db.strategyOption.create({
      data: {
        tenantId,
        workspaceId,
        label: o.label,
        isBaseline: o.isBaseline,
        isSelected: o.isSelected,
        leversApplied: o.leversApplied,
        narrative: o.narrative ?? null,
        implCostMinor: o.implCostMinor,
        savingsBaseMinor: o.savingsBaseMinor,
        savingsUpsideMinor: o.savingsUpsideMinor,
        savingsDownsideMinor: o.savingsDownsideMinor,
        horizonYears: o.horizonYears,
        riskScore: o.riskScore ?? null,
        npvMinor,
        position: i,
      },
    });
    const validScores = o.scores.filter(
      (s) => s.criterionIndex >= 0 && s.criterionIndex < criterionIds.length,
    );
    if (validScores.length > 0) {
      await db.optionScore.createMany({
        data: validScores.map((s) => ({
          tenantId,
          optionId: option.id,
          criterionId: criterionIds[s.criterionIndex],
          score: s.score,
          rationale: s.rationale ?? null,
        })),
      });
    }
  }

  await recordAudit({
    tenantId,
    actorId,
    action: "options.save",
    entity: "Workspace",
    entityId: workspaceId,
    payload: { criteria: input.criteria.length, options: input.options.length },
  });
}

export async function setWorkspaceStatus(
  tenantId: string,
  workspaceId: string,
  actorId: string,
  status: WorkspaceStatus,
  overrideReason: string | null,
) {
  await forTenant(tenantId).workspace.update({
    where: { id: workspaceId },
    data: { status },
  });
  await recordAudit({
    tenantId,
    actorId,
    action: "workspace.request_review",
    entity: "Workspace",
    entityId: workspaceId,
    payload: { status, override: overrideReason },
  });
}
