import type { KraljicQuadrant } from "@prisma/client";

import { KRALJIC_LABEL, KRALJIC_POSTURE } from "@/lib/domain/kraljic";

import { KraljicGrid } from "./KraljicGrid";

export function PositioningView({
  supplyRisk,
  businessImpact,
  quadrant,
  rationale,
  frameworks,
  evidenceClaims,
}: {
  supplyRisk: number;
  businessImpact: number;
  quadrant: KraljicQuadrant;
  rationale: string | null;
  frameworks: { label: string; notes: string }[];
  evidenceClaims: string[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <KraljicGrid supplyRisk={supplyRisk} businessImpact={businessImpact} quadrant={quadrant} />
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <p className="font-medium">{KRALJIC_LABEL[quadrant]}</p>
          <p className="text-muted-foreground">{KRALJIC_POSTURE[quadrant]}</p>
        </div>
      </div>
      {rationale && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Rationale</p>
          <p className="text-sm">{rationale}</p>
        </div>
      )}
      {frameworks.map((fw) => (
        <div key={fw.label}>
          <p className="text-xs font-medium text-muted-foreground">{fw.label}</p>
          <p className="text-sm">{fw.notes || "—"}</p>
        </div>
      ))}
      {evidenceClaims.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Supporting evidence</p>
          <ul className="list-disc pl-5 text-sm">
            {evidenceClaims.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
