import type { ReadinessRow } from "@/lib/domain/evidence";

export function EvidenceReadiness({ rows }: { rows: ReadinessRow[] }) {
  const allSatisfied = rows.every((r) => r.satisfied);

  return (
    <div className="space-y-3">
      <p className="text-sm">
        {allSatisfied
          ? "All required evidence is in place to leave Draft."
          : "Some required evidence is missing or below the confidence/recency bar."}
      </p>
      <ul className="space-y-1.5 text-sm">
        {rows.map((r) => (
          <li key={r.kind} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className={`inline-flex size-4 items-center justify-center rounded-full text-[10px] text-white ${
                  r.satisfied ? "bg-green-600" : "bg-muted-foreground/40"
                }`}
              >
                {r.satisfied ? "✓" : "·"}
              </span>
              {r.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {r.count} card{r.count === 1 ? "" : "s"} · ≥{r.minConfidence.toLowerCase()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
