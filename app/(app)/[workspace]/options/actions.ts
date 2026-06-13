"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { resolveCapabilities, type Capabilities } from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";
import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { listEvidenceCards } from "@/lib/domain/evidence";
import { parseAmountToMinor } from "@/lib/domain/money";
import { getSimulation, saveSimulation, setWorkspaceStatus } from "@/lib/domain/options";
import { publishReadiness } from "@/lib/domain/publish";
import { getWorkspace } from "@/lib/domain/workspace";

export type SaveResult = { ok: true } | { ok: false; error: string };
export type ReviewResult =
  | { ok: true; overridden: boolean }
  | { ok: false; error?: string; blockers?: string[] };

async function authorize(
  workspaceId: string,
): Promise<
  | { ok: true; tenantId: string; actorId: string; caps: Capabilities }
  | { ok: false; error: string }
> {
  const { membership, tenant } = await requireActiveMembership();
  if (!can(membership.role, "workspace:write")) {
    return { ok: false, error: "You don't have permission to edit the strategy." };
  }
  const ws = await getWorkspace(tenant.id, workspaceId);
  if (!ws) return { ok: false, error: "Workspace not found." };
  const caps = resolveCapabilities(contextProfileSchema.parse(ws.profile));
  if (!caps.enabledModules.includes("M6")) {
    return { ok: false, error: "This workspace doesn't include the option simulator." };
  }
  return { ok: true, tenantId: tenant.id, actorId: membership.userId, caps };
}

const simSchema = z.object({
  criteria: z
    .array(z.object({ name: z.string().trim().min(1).max(80), weight: z.coerce.number().min(0).max(100) }))
    .default([]),
  options: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(120),
        isBaseline: z.boolean().optional(),
        isSelected: z.boolean().optional(),
        leversApplied: z.array(z.string()).default([]),
        narrative: z.string().optional(),
        implCost: z.string().default("0"),
        savingsBase: z.string().default("0"),
        savingsUpside: z.string().default("0"),
        savingsDownside: z.string().default("0"),
        horizonYears: z.coerce.number().int().min(1).max(20).default(3),
        riskScore: z.coerce.number().min(0).max(100).optional(),
        scores: z
          .array(
            z.object({
              criterionIndex: z.coerce.number().int(),
              score: z.coerce.number().min(0).max(100),
              rationale: z.string().optional(),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
});

function toMinor(v: string): bigint {
  try {
    return parseAmountToMinor(v || "0");
  } catch {
    return 0n;
  }
}

export async function saveSimulationAction(
  workspaceId: string,
  raw: unknown,
): Promise<SaveResult> {
  const auth = await authorize(workspaceId);
  if (!auth.ok) return auth;

  const parsed = simSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please check the simulation inputs." };

  try {
    await saveSimulation(
      auth.tenantId,
      workspaceId,
      auth.actorId,
      {
        criteria: parsed.data.criteria,
        options: parsed.data.options.map((o) => ({
          label: o.label,
          isBaseline: o.isBaseline ?? false,
          isSelected: o.isSelected ?? false,
          leversApplied: o.leversApplied,
          narrative: o.narrative ?? null,
          implCostMinor: toMinor(o.implCost),
          savingsBaseMinor: toMinor(o.savingsBase),
          savingsUpsideMinor: toMinor(o.savingsUpside),
          savingsDownsideMinor: toMinor(o.savingsDownside),
          horizonYears: o.horizonYears,
          riskScore: o.riskScore ?? null,
          scores: o.scores,
        })),
      },
      auth.caps.strategyLevers,
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed." };
  }

  revalidatePath(`/${workspaceId}/options`);
  return { ok: true };
}

export async function requestReviewAction(
  workspaceId: string,
  overrideReason?: string,
): Promise<ReviewResult> {
  const auth = await authorize(workspaceId);
  if (!auth.ok) return { ok: false, error: auth.error };

  const [cards, sim] = await Promise.all([
    listEvidenceCards(auth.tenantId, workspaceId),
    getSimulation(auth.tenantId, workspaceId),
  ]);
  const selectedId = sim.options.find((o) => o.isSelected)?.id ?? null;
  const readiness = publishReadiness(
    auth.caps,
    cards,
    sim.options.map((o) => ({ isBaseline: o.isBaseline, isSelected: o.isSelected })),
    selectedId,
  );

  const override = overrideReason?.trim() || null;
  if (!readiness.ready && !override) {
    return { ok: false, blockers: readiness.blockers };
  }

  await setWorkspaceStatus(auth.tenantId, workspaceId, auth.actorId, "REVIEW", override);

  revalidatePath(`/${workspaceId}/options`);
  revalidatePath(`/${workspaceId}/overview`);
  revalidatePath(`/${workspaceId}/governance`);
  return { ok: true, overridden: !readiness.ready };
}
