"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { resolveCapabilities, type Capabilities } from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";
import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { createEvidenceCard, EVIDENCE_CATEGORIES } from "@/lib/domain/evidence";
import { addSupplier } from "@/lib/domain/suppliers";
import { getWorkspace } from "@/lib/domain/workspace";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function authorize(
  workspaceId: string,
): Promise<
  | { ok: true; tenantId: string; actorId: string; caps: Capabilities }
  | { ok: false; error: string }
> {
  const { membership, tenant } = await requireActiveMembership();
  if (!can(membership.role, "workspace:write")) {
    return { ok: false, error: "You don't have permission to add intelligence." };
  }
  const ws = await getWorkspace(tenant.id, workspaceId);
  if (!ws) return { ok: false, error: "Workspace not found." };
  const caps = resolveCapabilities(contextProfileSchema.parse(ws.profile));
  if (!caps.enabledModules.includes("M4")) {
    return { ok: false, error: "This workspace doesn't include intelligence." };
  }
  return { ok: true, tenantId: tenant.id, actorId: membership.userId, caps };
}

const evidenceSchema = z.object({
  claim: z.string().trim().min(3).max(500),
  category: z.enum(EVIDENCE_CATEGORIES),
  sourceType: z.string().trim().min(2).max(60),
  sourceRef: z.string().trim().max(300).optional(),
  sourceUrl: z.string().trim().max(500).optional(),
  collectedAt: z.string().min(4),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  triangulationCount: z.coerce.number().int().min(1).max(99),
});

export async function addEvidence(
  workspaceId: string,
  raw: unknown,
): Promise<ActionResult> {
  const auth = await authorize(workspaceId);
  if (!auth.ok) return auth;

  const parsed = evidenceSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please complete the evidence fields." };

  const collectedAt = new Date(parsed.data.collectedAt);
  if (Number.isNaN(collectedAt.getTime())) {
    return { ok: false, error: "Invalid collection date." };
  }

  await createEvidenceCard(
    auth.tenantId,
    workspaceId,
    auth.actorId,
    {
      claim: parsed.data.claim,
      category: parsed.data.category,
      sourceType: parsed.data.sourceType,
      sourceRef: parsed.data.sourceRef || null,
      sourceUrl: parsed.data.sourceUrl || null,
      collectedAt,
      confidence: parsed.data.confidence,
      triangulationCount: parsed.data.triangulationCount,
    },
    auth.caps.evidencePolicy.recencyDays,
  );

  revalidatePath(`/${workspaceId}/intelligence`);
  return { ok: true };
}

const supplierSchema = z.object({
  name: z.string().trim().min(2).max(160),
  isIncumbent: z.boolean().optional(),
  tier: z.string().trim().max(40).optional(),
});

export async function addSupplierAction(
  workspaceId: string,
  raw: unknown,
): Promise<ActionResult> {
  const auth = await authorize(workspaceId);
  if (!auth.ok) return auth;

  const parsed = supplierSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Enter a supplier name." };

  await addSupplier(auth.tenantId, auth.actorId, {
    name: parsed.data.name,
    isIncumbent: parsed.data.isIncumbent ?? false,
    tier: parsed.data.tier || null,
  });

  revalidatePath(`/${workspaceId}/intelligence`);
  return { ok: true };
}
