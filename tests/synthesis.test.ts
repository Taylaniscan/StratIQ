import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AIProviderError, getAIProvider, type AIProvider, type SynthInput, type SynthResult } from "@/lib/ai/provider";
import { adminPrisma } from "@/lib/db/admin";
import { prisma } from "@/lib/db/prisma";
import { createEvidenceCard } from "@/lib/domain/evidence";
import { provisionTenantWorkspace } from "@/lib/domain/onboarding";
import {
  generateSynthesis,
  getLatestSynthesis,
  setSynthesisStatus,
} from "@/lib/domain/synthesis";
import type { OnboardingInput } from "@/lib/adaptivity/profile";

const RUN = randomUUID().slice(0, 8);
const tenantIds: string[] = [];

function onboarding(orgName: string): OnboardingInput {
  return {
    orgName,
    workspaceName: `Synth WS ${RUN}`,
    taxonomyL1: "Steel",
    orgTier: "ENTERPRISE",
    categoryArchetype: "DIRECT_MATERIAL",
    maturity: "ADVANCED",
    dataReadiness: "CONNECTED",
  };
}

// Fake provider: cites the first real evidence id plus a bogus one (no network).
class FakeProvider implements AIProvider {
  readonly name = "fake";
  async synthesize(input: SynthInput): Promise<SynthResult> {
    const realId = input.evidence[0]?.id ?? "none";
    return {
      summary: `Key finding [${realId}] with an invented citation [bogus].`,
      citedEvidenceIds: [realId, "bogus"],
      model: "fake:test",
    };
  }
}

describe("getAIProvider", () => {
  const prev = process.env.AI_PROVIDER;
  afterAll(() => {
    process.env.AI_PROVIDER = prev;
  });

  it("defaults to Gemini", () => {
    delete process.env.AI_PROVIDER;
    expect(getAIProvider().name).toBe("gemini");
  });

  it("selects the dormant Anthropic provider which fails loudly", async () => {
    process.env.AI_PROVIDER = "anthropic";
    const p = getAIProvider();
    expect(p.name).toBe("anthropic");
    await expect(
      p.synthesize({ task: "x", context: "y", evidence: [] }),
    ).rejects.toBeInstanceOf(AIProviderError);
  });
});

describe("generateSynthesis (injected provider, no network)", () => {
  let tenantAId: string;
  let tenantBId: string;
  let workspaceAId: string;
  let actorAId: string;

  beforeAll(async () => {
    const a = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `synth_a_${RUN}@example.com`,
      input: onboarding(`Synth A ${RUN}`),
    });
    const b = await provisionTenantWorkspace({
      authUserId: randomUUID(),
      email: `synth_b_${RUN}@example.com`,
      input: onboarding(`Synth B ${RUN}`),
    });
    tenantAId = a.tenant.id;
    tenantBId = b.tenant.id;
    workspaceAId = a.workspace!.id;
    tenantIds.push(tenantAId, tenantBId);
    const m = await adminPrisma.membership.findFirst({ where: { tenantId: tenantAId } });
    actorAId = m!.userId;
    await createEvidenceCard(
      tenantAId,
      workspaceAId,
      actorAId,
      { claim: "Index up 6% QoQ", category: "PRICING", sourceType: "Report", collectedAt: new Date(), confidence: "HIGH", triangulationCount: 1 },
      180,
    );
  });

  afterAll(async () => {
    await adminPrisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await adminPrisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    await Promise.all([adminPrisma.$disconnect(), prisma.$disconnect()]);
  });

  it("persists a DRAFT with only valid citations + provenance", async () => {
    const { artifact, strippedCount } = await generateSynthesis(
      tenantAId,
      workspaceAId,
      actorAId,
      new FakeProvider(),
    );
    expect(artifact.status).toBe("DRAFT");
    expect(artifact.model).toBe("fake:test");
    expect(artifact.evidenceIds).toHaveLength(1); // bogus stripped
    expect(artifact.output).toContain("[unsupported]");
    expect(strippedCount).toBeGreaterThanOrEqual(2);
  });

  it("approves a draft and is tenant-isolated", async () => {
    const latest = await getLatestSynthesis(tenantAId, workspaceAId);
    const updated = await setSynthesisStatus(tenantAId, workspaceAId, actorAId, latest!.id, "APPROVED");
    expect(updated.status).toBe("APPROVED");

    expect(await getLatestSynthesis(tenantBId, workspaceAId)).toBeNull();
  });
});
