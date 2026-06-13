import type { KraljicQuadrant } from "@prisma/client";

/**
 * Pure Kraljic helpers — no server imports, safe in client components.
 * Axes are 0–100; threshold 50 splits low/high.
 */
const THRESHOLD = 50;

export function kraljicQuadrant(
  supplyRisk: number,
  businessImpact: number,
): KraljicQuadrant {
  const highRisk = supplyRisk >= THRESHOLD;
  const highImpact = businessImpact >= THRESHOLD;
  if (highImpact && highRisk) return "STRATEGIC";
  if (highImpact && !highRisk) return "LEVERAGE";
  if (!highImpact && highRisk) return "BOTTLENECK";
  return "NON_CRITICAL";
}

export const KRALJIC_LABEL: Record<KraljicQuadrant, string> = {
  STRATEGIC: "Strategic",
  LEVERAGE: "Leverage",
  BOTTLENECK: "Bottleneck",
  NON_CRITICAL: "Non-critical",
};

export const KRALJIC_POSTURE: Record<KraljicQuadrant, string> = {
  STRATEGIC: "Partner — collaborate, secure supply, joint value creation",
  LEVERAGE: "Exploit buying power — competitive tendering, consolidation",
  BOTTLENECK: "Secure supply — dual-source, buffer stock, risk mitigation",
  NON_CRITICAL: "Simplify — automate, standardize, reduce transaction cost",
};
