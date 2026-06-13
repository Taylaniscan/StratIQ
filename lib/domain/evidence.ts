import type { Confidence, EvidenceCard, Freshness } from "@prisma/client";

import type { EvidencePolicy } from "@/lib/adaptivity";
import { forTenant } from "@/lib/db/tenant";

import { recordAudit } from "./audit";

/**
 * EvidenceCard — the trust spine (CLAUDE.md §6, FR-04/FR-05). Every card is
 * sourced, dated, and confidence-rated. Freshness is derived from age vs the
 * workspace's recency policy so it stays correct over time.
 */

export const EVIDENCE_CATEGORIES = [
  "POSITIONING_INPUT",
  "DEMAND_BASIS",
  "SUPPLIER_UNIVERSE",
  "MARKET",
  "SUPPLIER_RISK",
  "PRICING",
  "OTHER",
] as const;
export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number];

type Conf = "HIGH" | "MEDIUM" | "LOW";
const CONF_RANK: Record<Conf, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
export function confidenceRank(c: Conf): number {
  return CONF_RANK[c];
}

/** Live freshness from collection age vs the recency policy. */
export function computeFreshness(collectedAt: Date, recencyDays: number): Freshness {
  const ageDays = (Date.now() - collectedAt.getTime()) / 86_400_000;
  if (ageDays <= recencyDays) return "FRESH";
  if (ageDays <= recencyDays * 2) return "AGING";
  return "STALE";
}

export interface CreateEvidenceInput {
  claim: string;
  category: string;
  sourceType: string;
  sourceRef?: string | null;
  sourceUrl?: string | null;
  collectedAt: Date;
  confidence: Confidence;
  triangulationCount: number;
}

export async function createEvidenceCard(
  tenantId: string,
  workspaceId: string,
  ownerId: string,
  input: CreateEvidenceInput,
  recencyDays: number,
) {
  const card = await forTenant(tenantId).evidenceCard.create({
    data: {
      tenantId,
      workspaceId,
      ownerId,
      claim: input.claim,
      category: input.category,
      sourceType: input.sourceType,
      sourceRef: input.sourceRef ?? null,
      sourceUrl: input.sourceUrl ?? null,
      collectedAt: input.collectedAt,
      freshness: computeFreshness(input.collectedAt, recencyDays),
      confidence: input.confidence,
      triangulationCount: input.triangulationCount,
    },
  });

  await recordAudit({
    tenantId,
    actorId: ownerId,
    action: "evidence.create",
    entity: "EvidenceCard",
    entityId: card.id,
    payload: { category: input.category, confidence: input.confidence },
  });

  return card;
}

export function listEvidenceCards(tenantId: string, workspaceId: string) {
  return forTenant(tenantId).evidenceCard.findMany({
    where: { workspaceId },
    orderBy: { collectedAt: "desc" },
  });
}

export interface ReadinessRow {
  kind: string;
  label: string;
  minConfidence: Confidence;
  satisfied: boolean;
  count: number;
}

/**
 * Evidence readiness (pure): for each required card kind, is there ≥1 card at
 * ≥ the minimum confidence that isn't STALE? Basis for the publish gate (FR-05).
 */
export function evidenceReadiness(
  cards: Pick<EvidenceCard, "category" | "confidence" | "collectedAt">[],
  policy: EvidencePolicy,
): ReadinessRow[] {
  return policy.requiredCards.map((req) => {
    const matching = cards.filter(
      (c) =>
        c.category === req.kind &&
        confidenceRank(c.confidence) >= confidenceRank(req.minConfidence) &&
        computeFreshness(c.collectedAt, policy.recencyDays) !== "STALE",
    );
    return {
      kind: req.kind,
      label: req.label,
      minConfidence: req.minConfidence,
      satisfied: matching.length >= 1,
      count: matching.length,
    };
  });
}
