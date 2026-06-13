"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { resolveCapabilities } from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";
import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { listEvidenceCards } from "@/lib/domain/evidence";
import { savePositioning } from "@/lib/domain/positioning";
import { getWorkspace } from "@/lib/domain/workspace";

export type ActionResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  supplyRisk: z.coerce.number().min(0).max(100),
  businessImpact: z.coerce.number().min(0).max(100),
  rationale: z.string().trim().max(2000).optional(),
  frameworks: z.record(z.string(), z.string()).default({}),
  evidenceIds: z.array(z.string()).default([]),
});

export async function savePositioningAction(
  workspaceId: string,
  raw: unknown,
): Promise<ActionResult> {
  const { membership, tenant } = await requireActiveMembership();
  if (!can(membership.role, "workspace:write")) {
    return { ok: false, error: "You don't have permission to edit positioning." };
  }

  const ws = await getWorkspace(tenant.id, workspaceId);
  if (!ws) return { ok: false, error: "Workspace not found." };

  const caps = resolveCapabilities(contextProfileSchema.parse(ws.profile));
  if (!caps.enabledModules.includes("M5")) {
    return { ok: false, error: "This workspace doesn't include positioning." };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please check the positioning inputs." };

  // Allowed frameworks = enabled frameworks minus KRALJIC (the grid, not a note).
  const allowedFrameworkIds = caps.frameworks.filter((f) => f !== "KRALJIC");
  const cards = await listEvidenceCards(tenant.id, workspaceId);

  try {
    await savePositioning(
      tenant.id,
      workspaceId,
      membership.userId,
      {
        supplyRisk: parsed.data.supplyRisk,
        businessImpact: parsed.data.businessImpact,
        rationale: parsed.data.rationale ?? null,
        frameworks: parsed.data.frameworks,
        evidenceIds: parsed.data.evidenceIds,
      },
      allowedFrameworkIds,
      cards.map((c) => c.id),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed." };
  }

  revalidatePath(`/${workspaceId}/positioning`);
  return { ok: true };
}
