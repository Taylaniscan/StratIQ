/**
 * Demo seed (CLAUDE.md §15). Creates two fully-populated, review-ready tenants so
 * the app is never empty and adaptivity is visible side by side:
 *   - Northwind Foods   — SMALL / INDIRECT_SERVICE / FOUNDATIONAL
 *   - Atlas Industrial  — ENTERPRISE / DIRECT_MATERIAL / ADVANCED
 *
 * Each demo tenant gets its own Supabase auth login (User.authUserId is globally
 * unique, so one person can't be in both). Idempotent: skips a tenant that already
 * exists; reuses an existing auth user. Run: `npm run db:seed`.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });

// Call the Supabase Auth Admin REST API directly (the JS SDK pulls in a realtime
// client that doesn't construct under Node).
const ADMIN_USERS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AUTH_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

const PASSWORD = process.env.SEED_PASSWORD || "StratIQ-demo-2026";
const minor = (major) => BigInt(Math.round(major * 100));

function quadrant(sr, bi) {
  const hr = sr >= 50;
  const hi = bi >= 50;
  if (hi && hr) return "STRATEGIC";
  if (hi && !hr) return "LEVERAGE";
  if (!hi && hr) return "BOTTLENECK";
  return "NON_CRITICAL";
}

function npvMinor(annualMinor, horizon, costMinor, rate = 0.1) {
  let npv = -costMinor;
  for (let y = 1; y <= horizon; y++) npv += annualMinor / Math.pow(1 + rate, y);
  return BigInt(Math.round(npv));
}

async function ensureAuthUser(email) {
  const listRes = await fetch(`${ADMIN_USERS_URL}?per_page=1000`, { headers: AUTH_HEADERS });
  if (listRes.ok) {
    const data = await listRes.json();
    const found = (data.users ?? []).find((u) => u.email === email);
    if (found) return found.id;
  }
  const res = await fetch(ADMIN_USERS_URL, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true }),
  });
  const created = await res.json();
  if (!res.ok) {
    throw new Error(`createUser(${email}): ${created.msg || created.error_description || res.status}`);
  }
  return created.id;
}

async function seedTenant(def) {
  const existing = await prisma.tenant.findFirst({ where: { name: def.name } });
  if (existing) {
    console.log(`- ${def.name}: already exists, skipping`);
    return;
  }

  const authUserId = await ensureAuthUser(def.email);
  const tenant = await prisma.tenant.create({
    data: { name: def.name, orgTier: def.profile.orgTier },
  });
  const user = await prisma.user.create({
    data: { tenantId: tenant.id, authUserId, email: def.email, name: def.ownerName },
  });
  await prisma.membership.create({
    data: { tenantId: tenant.id, userId: user.id, role: "OWNER" },
  });
  const ws = await prisma.workspace.create({
    data: {
      tenantId: tenant.id,
      name: def.workspace.name,
      objective: def.workspace.objective,
      taxonomyL1: def.workspace.l1,
      taxonomyL2: def.workspace.l2 ?? null,
      taxonomyL3: def.workspace.l3 ?? null,
      profile: def.profile,
      status: "DRAFT",
    },
  });

  const supplierIds = {};
  for (const s of def.suppliers) {
    const sup = await prisma.supplier.create({
      data: { tenantId: tenant.id, name: s.name, isIncumbent: !!s.incumbent, tier: s.tier ?? null },
    });
    supplierIds[s.name] = sup.id;
  }

  if (def.spend) {
    const total = def.spend.lines.reduce((a, l) => a + minor(l.amount), 0n);
    const times = def.spend.lines.map((l) => new Date(l.date).getTime());
    const ds = await prisma.spendDataset.create({
      data: {
        tenantId: tenant.id,
        workspaceId: ws.id,
        filename: def.spend.filename,
        status: "COMPLETE",
        rowCount: def.spend.lines.length,
        errorCount: 0,
        totalMinor: total,
        currency: "USD",
        periodStart: new Date(Math.min(...times)),
        periodEnd: new Date(Math.max(...times)),
        uploadedById: user.id,
      },
    });
    await prisma.spendLine.createMany({
      data: def.spend.lines.map((l) => ({
        tenantId: tenant.id,
        workspaceId: ws.id,
        datasetId: ds.id,
        supplierId: supplierIds[l.supplier] ?? null,
        buUnit: l.bu,
        site: l.site,
        glDate: new Date(l.date),
        amountMinor: minor(l.amount),
        currency: "USD",
        classification: l.category ?? null,
      })),
    });
  }

  for (const e of def.evidence) {
    await prisma.evidenceCard.create({
      data: {
        tenantId: tenant.id,
        workspaceId: ws.id,
        claim: e.claim,
        category: e.category,
        sourceType: e.sourceType,
        collectedAt: new Date(e.collectedAt),
        freshness: "FRESH",
        confidence: e.confidence,
        triangulationCount: e.tri ?? 1,
        ownerId: user.id,
      },
    });
  }

  await prisma.requirementArtifact.create({
    data: { tenantId: tenant.id, workspaceId: ws.id, kind: "INTAKE", data: def.requirements },
  });

  const criterionIds = [];
  for (let i = 0; i < def.criteria.length; i++) {
    const c = await prisma.decisionCriterion.create({
      data: {
        tenantId: tenant.id,
        workspaceId: ws.id,
        name: def.criteria[i].name,
        weight: def.criteria[i].weight,
        position: i,
      },
    });
    criterionIds.push(c.id);
  }

  for (let i = 0; i < def.options.length; i++) {
    const o = def.options[i];
    const opt = await prisma.strategyOption.create({
      data: {
        tenantId: tenant.id,
        workspaceId: ws.id,
        label: o.label,
        isBaseline: !!o.baseline,
        isSelected: !!o.selected,
        leversApplied: o.levers ?? [],
        narrative: o.narrative ?? null,
        implCostMinor: minor(o.implCost ?? 0),
        savingsBaseMinor: minor(o.savingsBase ?? 0),
        savingsUpsideMinor: minor(o.savingsUpside ?? 0),
        savingsDownsideMinor: minor(o.savingsDownside ?? 0),
        horizonYears: o.horizon ?? 3,
        riskScore: o.risk ?? null,
        npvMinor: npvMinor(Number(minor(o.savingsBase ?? 0)), o.horizon ?? 3, Number(minor(o.implCost ?? 0))),
        position: i,
      },
    });
    if (o.scores) {
      await prisma.optionScore.createMany({
        data: o.scores.map((score, ci) => ({
          tenantId: tenant.id,
          optionId: opt.id,
          criterionId: criterionIds[ci],
          score,
        })),
      });
    }
  }

  const p = def.positioning;
  await prisma.positioning.create({
    data: {
      tenantId: tenant.id,
      workspaceId: ws.id,
      kraljicSupplyRisk: p.supplyRisk,
      kraljicBusinessImpact: p.businessImpact,
      kraljicQuadrant: quadrant(p.supplyRisk, p.businessImpact),
      rationale: p.rationale ?? null,
      frameworks: p.frameworks ?? {},
      evidenceIds: [],
    },
  });

  console.log(`✓ ${def.name} seeded — login: ${def.email}`);
}

const NORTHWIND = {
  name: "Northwind Foods",
  email: "northwind@stratiq.demo",
  ownerName: "Nadia Owner",
  profile: { orgTier: "SMALL", categoryArchetype: "INDIRECT_SERVICE", maturity: "FOUNDATIONAL", dataReadiness: "FILES" },
  workspace: { name: "Facilities management", objective: "Cut facilities cost 6% while holding SLAs", l1: "Facilities", l2: "Cleaning & maintenance" },
  suppliers: [
    { name: "Sodexo", incumbent: true, tier: "Strategic" },
    { name: "ISS Facility", tier: "Approved" },
    { name: "Mitie", tier: "Approved" },
  ],
  evidence: [
    { claim: "Single incumbent covers all 3 sites; switching cost is moderate", category: "POSITIONING_INPUT", sourceType: "Internal", confidence: "HIGH", collectedAt: "2026-05-20" },
    { claim: "Cleaning demand is stable year-round across sites", category: "DEMAND_BASIS", sourceType: "Internal", confidence: "MEDIUM", collectedAt: "2026-05-18" },
    { claim: "Three credible national FM providers serve our regions", category: "SUPPLIER_UNIVERSE", sourceType: "Web", confidence: "MEDIUM", collectedAt: "2026-05-22" },
    { claim: "Market FM rates softened ~3% YoY", category: "MARKET", sourceType: "Report", confidence: "MEDIUM", collectedAt: "2026-05-10" },
  ],
  requirements: {
    scopeOfWork: "Daily cleaning, reactive & planned maintenance across 3 sites",
    slaTargets: "Reactive response <4h; 98% planned-task completion",
    fteOrEffort: "~18 FTE equivalent",
    rateCard: "Blended hourly with out-of-hours premium",
    deliverables: "Monthly SLA report, quarterly review",
    kpis: "SLA adherence, complaint rate, cost per sq ft",
  },
  criteria: [
    { name: "Savings", weight: 3 },
    { name: "Service risk", weight: 2 },
  ],
  options: [
    { label: "Do-nothing baseline", baseline: true, levers: [], narrative: "Renew incumbent as-is.", savingsBase: 0, horizon: 3, scores: [10, 70] },
    {
      label: "Renegotiate & consolidate scope", selected: true,
      levers: ["RATE_RENEGOTIATION", "SCOPE_RATIONALIZATION", "CONSOLIDATION"],
      narrative: "Renegotiate rates and rationalize low-value scope with the incumbent.",
      savingsBase: 84000, savingsUpside: 120000, savingsDownside: 50000, implCost: 15000, horizon: 3, risk: 30,
      scores: [80, 60],
    },
  ],
  positioning: { supplyRisk: 35, businessImpact: 45, rationale: "Routine, well-supplied service; manage for efficiency." },
};

const ATLAS = {
  name: "Atlas Industrial",
  email: "atlas@stratiq.demo",
  ownerName: "Arman Owner",
  profile: { orgTier: "ENTERPRISE", categoryArchetype: "DIRECT_MATERIAL", maturity: "ADVANCED", dataReadiness: "CONNECTED" },
  workspace: { name: "Cold-rolled steel", objective: "De-risk supply and reduce landed cost 8%", l1: "Raw materials", l2: "Metals", l3: "Cold-rolled steel" },
  suppliers: [
    { name: "Tata Steel", incumbent: true, tier: "Strategic" },
    { name: "ArcelorMittal", tier: "Strategic" },
    { name: "POSCO", tier: "Approved" },
    { name: "Nucor", tier: "Approved" },
  ],
  spend: {
    filename: "atlas-steel-fy26.csv",
    lines: [
      { supplier: "Tata Steel", bu: "Manufacturing", site: "Pittsburgh", date: "2026-01-15", amount: 420000, category: "Steel" },
      { supplier: "Tata Steel", bu: "Manufacturing", site: "Pittsburgh", date: "2026-02-15", amount: 398000, category: "Steel" },
      { supplier: "ArcelorMittal", bu: "Manufacturing", site: "Detroit", date: "2026-01-20", amount: 510000, category: "Steel" },
      { supplier: "ArcelorMittal", bu: "Manufacturing", site: "Detroit", date: "2026-03-20", amount: 467000, category: "Steel" },
      { supplier: "POSCO", bu: "Manufacturing", site: "Houston", date: "2026-02-10", amount: 285000, category: "Steel" },
      { supplier: "Nucor", bu: "Operations", site: "Pittsburgh", date: "2026-03-05", amount: 190000, category: "Steel" },
    ],
  },
  evidence: [
    { claim: "Two qualified suppliers hold 80% of volume; concentration risk is high", category: "POSITIONING_INPUT", sourceType: "Internal", confidence: "HIGH", collectedAt: "2026-05-28", tri: 2 },
    { claim: "3-year demand forecast +4% CAGR with seasonal Q1 peak", category: "DEMAND_BASIS", sourceType: "Internal", confidence: "HIGH", collectedAt: "2026-05-25", tri: 2 },
    { claim: "Four credible global mills can serve spec within lead time", category: "SUPPLIER_UNIVERSE", sourceType: "Report", confidence: "HIGH", collectedAt: "2026-05-30", tri: 3 },
    { claim: "CRU cold-rolled index up 6% QoQ", category: "PRICING", sourceType: "Feed", confidence: "HIGH", collectedAt: "2026-06-01" },
    { claim: "Two incumbents flagged elevated financial-stress scores", category: "SUPPLIER_RISK", sourceType: "Report", confidence: "MEDIUM", collectedAt: "2026-05-15" },
  ],
  requirements: {
    bom: "Cold-rolled coil, multiple gauges; annexed BOM v4",
    specGrade: "AISI 1018 / DC01",
    tolerance: "±0.05mm thickness, ±2mm width",
    avl: "Tata Steel, ArcelorMittal, POSCO, Nucor",
    demandQty: "28,000 t/year",
    demandVariability: "MEDIUM",
    makeVsBuy: "BUY",
  },
  criteria: [
    { name: "Savings", weight: 3 },
    { name: "Supply resilience", weight: 3 },
    { name: "ESG", weight: 1 },
  ],
  options: [
    { label: "Do-nothing baseline", baseline: true, levers: [], narrative: "Continue current dual-incumbent buy.", savingsBase: 0, horizon: 3, scores: [10, 40, 50] },
    {
      label: "Index pricing + dual source",
      levers: ["INDEX_PRICING", "DUAL_SOURCE", "SHOULD_COST_TEARDOWN"],
      narrative: "Move to index-linked pricing and qualify a third source to cut concentration.",
      savingsBase: 640000, savingsUpside: 900000, savingsDownside: 380000, implCost: 120000, horizon: 3, risk: 35,
      scores: [70, 85, 60],
    },
    {
      label: "Hedged + spec harmonization",
      selected: true,
      levers: ["HEDGING", "SPEC_HARMONIZATION", "INDEX_PRICING", "DUAL_SOURCE"],
      narrative: "Harmonize specs, hedge a portion of volume, and dual-source the balance.",
      savingsBase: 820000, savingsUpside: 1150000, savingsDownside: 500000, implCost: 180000, horizon: 3, risk: 45,
      scores: [85, 80, 65],
    },
  ],
  positioning: {
    supplyRisk: 75,
    businessImpact: 82,
    rationale: "High-value, concentrated supply — manage as strategic with resilience plays.",
    frameworks: { PORTER_FIVE_FORCES: "High supplier power; moderate substitution via spec harmonization." },
  },
};

async function main() {
  console.log("Seeding demo tenants…");
  await seedTenant(NORTHWIND);
  await seedTenant(ATLAS);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
