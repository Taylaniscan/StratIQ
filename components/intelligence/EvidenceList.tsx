import type { Confidence, Freshness } from "@prisma/client";

const CONFIDENCE_CLASS: Record<Confidence, string> = {
  HIGH: "bg-green-500/15 text-green-700 dark:text-green-400",
  MEDIUM: "bg-amber-500/15 text-amber-700 dark:text-amber-500",
  LOW: "bg-muted text-muted-foreground",
};

const FRESHNESS_LABEL: Record<Freshness, string> = {
  FRESH: "Fresh",
  AGING: "Aging",
  STALE: "Stale",
};

const CATEGORY_LABEL: Record<string, string> = {
  POSITIONING_INPUT: "Positioning",
  DEMAND_BASIS: "Demand",
  SUPPLIER_UNIVERSE: "Suppliers",
  MARKET: "Market",
  SUPPLIER_RISK: "Risk",
  PRICING: "Pricing",
  OTHER: "Other",
};

export interface EvidenceRow {
  id: string;
  claim: string;
  category: string | null;
  sourceType: string;
  sourceRef: string | null;
  sourceUrl: string | null;
  collectedAt: Date;
  confidence: Confidence;
  freshness: Freshness;
}

export function EvidenceList({ cards }: { cards: EvidenceRow[] }) {
  if (cards.length === 0) {
    return <p className="text-sm text-muted-foreground">No evidence captured yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {cards.map((c) => (
        <li key={c.id} className="rounded-lg border p-3">
          <p className="text-sm">{c.claim}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${CONFIDENCE_CLASS[c.confidence]}`}
            >
              {c.confidence.toLowerCase()} confidence
            </span>
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
              {FRESHNESS_LABEL[c.freshness]}
            </span>
            {c.category && (
              <span className="text-muted-foreground">
                {CATEGORY_LABEL[c.category] ?? c.category}
              </span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {c.sourceType}
              {c.sourceRef ? ` — ${c.sourceRef}` : ""}
            </span>
            <span className="text-muted-foreground">·</span>
            <time dateTime={c.collectedAt.toISOString()} className="text-muted-foreground">
              {c.collectedAt.toLocaleDateString()}
            </time>
            {c.sourceUrl && (
              <a
                href={c.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground underline-offset-2 hover:underline"
              >
                source ↗
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
