import { Prisma } from "@prisma/client";

import { forTenant } from "@/lib/db/tenant";

import { recordAudit } from "./audit";
import { kraljicQuadrant } from "./kraljic";

/**
 * Positioning & Segmentation (M5). Kraljic is always available; other frameworks
 * appear per `Capabilities.frameworks`. Positions cite EvidenceCards (M4).
 * Pure Kraljic helpers live in ./kraljic (client-safe).
 */

export function getPositioning(tenantId: string, workspaceId: string) {
  return forTenant(tenantId).positioning.findFirst({ where: { workspaceId } });
}

export interface PositioningInput {
  supplyRisk: number;
  businessImpact: number;
  rationale?: string | null;
  frameworks: Record<string, string>; // frameworkId -> notes (non-Kraljic)
  evidenceIds: string[];
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function savePositioning(
  tenantId: string,
  workspaceId: string,
  actorId: string,
  input: PositioningInput,
  allowedFrameworkIds: string[],
  workspaceEvidenceIds: string[],
) {
  const allowedFw = new Set(allowedFrameworkIds);
  const ungated = Object.keys(input.frameworks).filter((f) => !allowedFw.has(f));
  if (ungated.length > 0) {
    throw new Error(`Ungated frameworks: ${ungated.join(", ")}`);
  }

  const allowedEvidence = new Set(workspaceEvidenceIds);
  const badEvidence = input.evidenceIds.filter((id) => !allowedEvidence.has(id));
  if (badEvidence.length > 0) {
    throw new Error(`Unknown evidence: ${badEvidence.join(", ")}`);
  }

  const supplyRisk = clamp(input.supplyRisk);
  const businessImpact = clamp(input.businessImpact);
  const quadrant = kraljicQuadrant(supplyRisk, businessImpact);

  const db = forTenant(tenantId);
  const existing = await db.positioning.findFirst({ where: { workspaceId } });

  const data = {
    kraljicSupplyRisk: supplyRisk,
    kraljicBusinessImpact: businessImpact,
    kraljicQuadrant: quadrant,
    rationale: input.rationale ? input.rationale : null,
    frameworks: input.frameworks as Prisma.InputJsonObject,
    evidenceIds: input.evidenceIds,
  };

  const saved = existing
    ? await db.positioning.update({ where: { id: existing.id }, data })
    : await db.positioning.create({ data: { tenantId, workspaceId, ...data } });

  await recordAudit({
    tenantId,
    actorId,
    action: "positioning.save",
    entity: "Workspace",
    entityId: workspaceId,
    payload: { quadrant, supplyRisk, businessImpact },
  });

  return saved;
}
