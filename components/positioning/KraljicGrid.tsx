import type { KraljicQuadrant } from "@prisma/client";

import { cn } from "@/lib/utils";

function Cell({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start justify-center border p-1.5 text-center text-[11px]",
        active ? "bg-primary/10 font-medium text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
    </div>
  );
}

/** Presentational 2×2 Kraljic grid with the category dot. */
export function KraljicGrid({
  supplyRisk,
  businessImpact,
  quadrant,
}: {
  supplyRisk: number;
  businessImpact: number;
  quadrant: KraljicQuadrant;
}) {
  return (
    <div className="flex gap-2">
      <div className="flex items-center">
        <span className="rotate-180 text-xs text-muted-foreground [writing-mode:vertical-rl]">
          Supply risk →
        </span>
      </div>
      <div className="flex-1">
        <div className="relative aspect-square w-full max-w-xs">
          <div className="grid h-full w-full grid-cols-2 grid-rows-2 overflow-hidden rounded-lg">
            {/* Top row = high supply risk */}
            <Cell label="Bottleneck" active={quadrant === "BOTTLENECK"} />
            <Cell label="Strategic" active={quadrant === "STRATEGIC"} />
            {/* Bottom row = low supply risk */}
            <Cell label="Non-critical" active={quadrant === "NON_CRITICAL"} />
            <Cell label="Leverage" active={quadrant === "LEVERAGE"} />
          </div>
          <span
            aria-hidden
            className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background"
            style={{ left: `${businessImpact}%`, top: `${100 - supplyRisk}%` }}
          />
        </div>
        <p className="mt-1 text-center text-xs text-muted-foreground">Business impact →</p>
      </div>
    </div>
  );
}
