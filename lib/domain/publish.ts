import type { Capabilities } from "@/lib/adaptivity";

import { evidenceReadiness } from "./evidence";

/**
 * Publish gate (FR-05): a strategy can't go to review/approval until evidence is
 * ready AND the option policy is met. Pure — reused by the server action and UI.
 */
export interface PublishReadiness {
  ready: boolean;
  blockers: string[];
}

export function publishReadiness(
  caps: Capabilities,
  cards: Parameters<typeof evidenceReadiness>[0],
  options: { isBaseline: boolean; isSelected: boolean }[],
  selectedId: string | null,
): PublishReadiness {
  const blockers: string[] = [];

  // Evidence readiness (M4).
  const readiness = evidenceReadiness(cards, caps.evidencePolicy);
  for (const r of readiness) {
    if (!r.satisfied) blockers.push(`Evidence missing: ${r.label} (≥${r.minConfidence.toLowerCase()})`);
  }

  // Option policy.
  const { minOptions } = caps.optionPolicy;
  if (options.length < minOptions) {
    blockers.push(`Need at least ${minOptions} options (have ${options.length})`);
  }
  if (!options.some((o) => o.isBaseline)) {
    blockers.push("Add a do-nothing baseline option");
  }
  if (!selectedId && !options.some((o) => o.isSelected)) {
    blockers.push("Select a recommended option");
  }

  return { ready: blockers.length === 0, blockers };
}
