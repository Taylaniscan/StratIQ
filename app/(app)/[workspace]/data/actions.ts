"use server";

import { revalidatePath } from "next/cache";

import { resolveCapabilities } from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";
import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { recordAudit } from "@/lib/domain/audit";
import { getWorkspace } from "@/lib/domain/workspace";
import { ingestSpend } from "@/lib/domain/spend/ingest";
import { parseSpendFile } from "@/lib/domain/spend/parse";
import { buildSampleSpendRows } from "@/lib/domain/spend/sample";

export type UploadResult =
  | { ok: true; lineCount: number; errorCount: number }
  | { ok: false; error: string };

async function authorize(
  workspaceId: string,
): Promise<{ ok: true; tenantId: string; actorId: string } | { ok: false; error: string }> {
  const { membership, tenant } = await requireActiveMembership();
  if (!can(membership.role, "workspace:write")) {
    return { ok: false, error: "You don't have permission to import data." };
  }
  const ws = await getWorkspace(tenant.id, workspaceId);
  if (!ws) return { ok: false, error: "Workspace not found." };
  const caps = resolveCapabilities(contextProfileSchema.parse(ws.profile));
  if (!caps.enabledModules.includes("M2")) {
    return { ok: false, error: "This workspace doesn't include spend data." };
  }
  return { ok: true, tenantId: tenant.id, actorId: membership.userId };
}

export async function uploadSpend(
  workspaceId: string,
  formData: FormData,
): Promise<UploadResult> {
  const auth = await authorize(workspaceId);
  if (!auth.ok) return auth;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a CSV or Excel file to upload." };
  }
  if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
    return { ok: false, error: "Unsupported file type. Use .csv, .xlsx, or .xls." };
  }

  const { rows, errors } = parseSpendFile(await file.arrayBuffer(), file.name);
  if (rows.length === 0) {
    return { ok: false, error: errors[0]?.message ?? "No valid rows found." };
  }

  const result = await ingestSpend({
    tenantId: auth.tenantId,
    workspaceId,
    uploadedById: auth.actorId,
    filename: file.name,
    rows,
    errors,
  });

  await recordAudit({
    tenantId: auth.tenantId,
    actorId: auth.actorId,
    action: "spend.upload",
    entity: "SpendDataset",
    entityId: result.dataset.id,
    payload: { filename: file.name, lineCount: result.lineCount, errorCount: errors.length },
  });

  revalidatePath(`/${workspaceId}/data`);
  return { ok: true, lineCount: result.lineCount, errorCount: errors.length };
}

export async function loadSampleSpend(workspaceId: string): Promise<UploadResult> {
  const auth = await authorize(workspaceId);
  if (!auth.ok) return auth;

  const rows = buildSampleSpendRows();
  const result = await ingestSpend({
    tenantId: auth.tenantId,
    workspaceId,
    uploadedById: auth.actorId,
    filename: "sample-spend.csv",
    rows,
    errors: [],
  });

  await recordAudit({
    tenantId: auth.tenantId,
    actorId: auth.actorId,
    action: "spend.sample",
    entity: "SpendDataset",
    entityId: result.dataset.id,
    payload: { lineCount: result.lineCount },
  });

  revalidatePath(`/${workspaceId}/data`);
  return { ok: true, lineCount: result.lineCount, errorCount: 0 };
}
