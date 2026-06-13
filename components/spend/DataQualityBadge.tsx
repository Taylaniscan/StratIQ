import type { DataQuality } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const MAP: Record<
  DataQuality,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  COMPLETE: { label: "Complete", variant: "default" },
  PARTIAL: { label: "Partial", variant: "secondary" },
  STALE: { label: "Stale", variant: "outline" },
  ESTIMATED: { label: "Estimated", variant: "outline" },
  BLOCKED: { label: "Blocked", variant: "destructive" },
};

export function DataQualityBadge({ status }: { status: DataQuality }) {
  const m = MAP[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
