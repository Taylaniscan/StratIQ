import type { WorkspaceStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const LABELS: Record<WorkspaceStatus, string> = {
  DRAFT: "Draft",
  REVIEW: "In review",
  APPROVED: "Approved",
  IN_EXECUTION: "In execution",
  MONITORING: "Monitoring",
  REFRESH: "Refresh",
};

const VARIANTS: Record<WorkspaceStatus, "default" | "secondary" | "outline"> = {
  DRAFT: "outline",
  REVIEW: "secondary",
  APPROVED: "default",
  IN_EXECUTION: "default",
  MONITORING: "secondary",
  REFRESH: "secondary",
};

export function StatusBadge({ status }: { status: WorkspaceStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
