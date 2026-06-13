/**
 * Pure finance + scoring helpers — no server imports, safe in client components.
 * Money stays in minor units (bigint); NPV discounting is done in number major
 * units (floats acceptable for projections) and converted back to bigint.
 */

/**
 * NPV of an option: implementation cost at year 0 (outflow) plus level annual
 * savings for `horizonYears`, discounted at `ratePct` (default 10%).
 */
export function computeNpvMinor(
  annualSavingsMinor: bigint,
  horizonYears: number,
  implCostMinor: bigint,
  ratePct = 10,
): bigint {
  const rate = ratePct / 100;
  const annual = Number(annualSavingsMinor);
  let npv = -Number(implCostMinor);
  for (let year = 1; year <= horizonYears; year++) {
    npv += annual / Math.pow(1 + rate, year);
  }
  return BigInt(Math.round(npv));
}

/** Probability-weighted expected annual savings (fixed 60/20/20 base/up/down). */
export function expectedSavingsMinor(
  base: bigint,
  upside: bigint,
  downside: bigint,
): bigint {
  const expected =
    Number(base) * 0.6 + Number(upside) * 0.2 + Number(downside) * 0.2;
  return BigInt(Math.round(expected));
}

export interface ScoreInput {
  criterionId: string;
  score: number; // 0–100
}
export interface CriterionWeight {
  id: string;
  weight: number;
}

/**
 * Weighted score 0–100: sum(score * weight) / sum(weight) over criteria that have
 * a score. Returns 0 when there are no weighted criteria.
 */
export function weightedScore(
  scores: ScoreInput[],
  criteria: CriterionWeight[],
): number {
  const byId = new Map(scores.map((s) => [s.criterionId, s.score]));
  let weightSum = 0;
  let acc = 0;
  for (const c of criteria) {
    const w = c.weight > 0 ? c.weight : 0;
    if (w === 0) continue;
    weightSum += w;
    acc += (byId.get(c.id) ?? 0) * w;
  }
  return weightSum === 0 ? 0 : Math.round((acc / weightSum) * 10) / 10;
}
