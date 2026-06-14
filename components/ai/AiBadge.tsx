import { Badge } from "@/components/ui/badge";

/** Marks content as AI-generated (FR-13 — AI is always a visible collaborator). */
export function AiBadge({ model }: { model?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant="secondary">AI-generated</Badge>
      {model && <span className="text-xs text-muted-foreground">{model}</span>}
    </span>
  );
}
