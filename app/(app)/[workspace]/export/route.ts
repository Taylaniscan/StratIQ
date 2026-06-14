import { type NextRequest } from "next/server";

import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { recordAudit } from "@/lib/domain/audit";
import { buildStrategyPack } from "@/lib/domain/strategyPack";
import { getWorkspace } from "@/lib/domain/workspace";
import { toPdfBuffer } from "@/lib/export/pdf";
import { toPptxBuffer } from "@/lib/export/pptx";
import { toXlsxBuffer } from "@/lib/export/xlsx";

export const runtime = "nodejs";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "strategy";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspace: string }> },
) {
  const { workspace: workspaceId } = await params;
  const format = new URL(req.url).searchParams.get("format") ?? "pdf";
  if (!["pdf", "pptx", "xlsx"].includes(format)) {
    return new Response("Unsupported format", { status: 400 });
  }

  const { membership, tenant } = await requireActiveMembership();
  if (!can(membership.role, "workspace:read")) {
    return new Response("Forbidden", { status: 403 });
  }
  const ws = await getWorkspace(tenant.id, workspaceId);
  if (!ws) return new Response("Not found", { status: 404 });

  const pack = await buildStrategyPack(tenant.id, workspaceId, tenant.name);
  if (!pack) return new Response("Not found", { status: 404 });

  let body: Uint8Array;
  let contentType: string;
  let ext: string;
  if (format === "xlsx") {
    body = new Uint8Array(toXlsxBuffer(pack));
    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    ext = "xlsx";
  } else if (format === "pptx") {
    body = new Uint8Array(await toPptxBuffer(pack));
    contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    ext = "pptx";
  } else {
    body = new Uint8Array(await toPdfBuffer(pack));
    contentType = "application/pdf";
    ext = "pdf";
  }

  await recordAudit({
    tenantId: tenant.id,
    actorId: membership.userId,
    action: "export.generate",
    entity: "Workspace",
    entityId: workspaceId,
    payload: { format },
  });

  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${slugify(pack.title)}.${ext}"`,
      "Cache-Control": "no-store",
    },
  });
}
