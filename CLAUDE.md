# CLAUDE.md — StratIQ 3.0

> **This file is the authoritative build contract for the StratIQ application.**
> Claude Code: read this top to bottom before writing code. When a decision is
> ambiguous, this document wins. When this document is silent, prefer the
> simplest choice consistent with the stack, the Adaptivity Engine, and the
> "evidence before elegance" principle. Update this file as decisions are made;
> never let the code drift from it silently.

---

## 0. TL;DR for the build agent

StratIQ is a **multi-tenant SaaS category sourcing strategy platform**. It takes a
procurement team from scattered files to an **evidence-backed, approved, executed,
and continuously refreshed** category strategy.

The product is **not a document generator**. It is a *category operating system*.

The defining technical idea is the **Adaptivity Engine**: every screen, field,
framework, role, and workflow step is gated by a **Context Profile** so the same
codebase serves a 50-person company buying one indirect service *and* a global
enterprise running thousands of direct-material categories. Build the engine first;
build features as consumers of it.

**Stack:** Next.js (App Router) + TypeScript · Tailwind + shadcn/ui · Postgres +
Prisma · Supabase (auth/storage) · Postgres RLS for tenant isolation. **AI is
real from day one, behind a provider interface: build on the free Google Gemini
tier, then flip one env var to real Anthropic Claude when ready.** Evidence-grounded
(see §10). One repo.

**Build order:** Foundation → Adaptivity Engine → Spine (workspace → data →
positioning → options → export) → Execution → Value loop. See §13.

---

## 1. Mission & positioning

StratIQ is the system where category strategies are **created, evidenced, debated,
approved, executed, monitored, refreshed, and linked to realized value.**

It wins on five things competitors treat as afterthoughts:

1. **Evidence & trust layer** — every material claim carries source, date,
   freshness, owner, and confidence. No naked assertions.
2. **Decisioning layer** — every strategy produces *multiple options + a
   do-nothing baseline + risk-adjusted economics*, never a single answer.
3. **Execution layer** — sourcing events, negotiation, award, contract control,
   and transition are first-class, not exports.
4. **Value realization & refresh** — savings, leakage, risk, and ESG tie back to
   the approved strategy; triggers reopen the cycle automatically.
5. **Adaptivity** — the product reshapes itself to the customer. This is the
   moat that the original PDR asserted but never engineered. It is now central.

### Non-goals for v1
- Not an ERP / P2P / generic CLM replacement.
- Not a fully autonomous award engine — final commercial calls stay human-owned.
- Not a universal supplier marketplace.
- Not a general-purpose BI warehouse.

---

## 2. THE ADAPTIVITY ENGINE (read this twice)

This is the heart of StratIQ and the answer to "compatible with any organisation
and any category." It is a **pure, deterministic capability resolver** that the
entire UI and API consult.

### 2.1 The Context Profile

Captured at **tenant onboarding** (org-level defaults) and refinable per
**workspace** (category-level overrides). Four dimensions:

| Dimension | Values | What it controls |
|---|---|---|
| `orgTier` | `SMALL` (<200 ppl) · `MID` (200–5k) · `ENTERPRISE` (5k+) | Role set, governance depth, integration mode, terminology, default density |
| `categoryArchetype` | `DIRECT_MATERIAL` · `INDIRECT_GOODS` · `INDIRECT_SERVICE` · `CAPEX_PROJECT` | Requirement fields, intelligence sources, strategy levers, scorecard KPIs, templates |
| `maturity` | `FOUNDATIONAL` · `DEVELOPING` · `ADVANCED` | Which analytical frameworks and how much rigor (options count, scenario depth) |
| `dataReadiness` | `MANUAL` · `FILES` · `CONNECTED` | Ingestion paths shown, evidence expectations, automation level |

A profile is created from **as few as 3 tapped selections** (the onboarding wizard
infers sensible defaults for the rest). This is the literal "with small option
selections the app adapts itself" requirement.

### 2.2 The resolver

A single pure function is the contract. Everything downstream reads its output.

```ts
// lib/adaptivity/resolveCapabilities.ts
export interface Capabilities {
  enabledModules: ModuleId[];          // which of M1..M12 are visible
  roleSet: Role[];                     // collapsed for SMALL, full for ENTERPRISE
  approvalChain: ApprovalStep[];       // 1 step (SMALL) → council (ENTERPRISE)
  frameworks: FrameworkId[];           // KRALJIC only (FOUNDATIONAL) → +PORTER,+TIERING...
  requirementFields: FieldSpec[];      // archetype-specific intake fields
  intelligenceSources: SourceId[];     // commodity feeds vs labor-rate benchmarks etc.
  strategyLevers: LeverId[];           // should-cost teardown vs scope rationalization etc.
  scorecardDimensions: KpiId[];        // archetype-tuned supplier KPIs
  optionPolicy: { minOptions: number; baseline: true; scenarios: 'POINT'|'RANGE'|'PROBABILISTIC' };
  evidencePolicy: { requiredCards: EvidenceRequirement[]; recencyDays: number; triangulationMin: number };
  integrationMode: 'MANUAL'|'FILES'|'CONNECTED';
  terminology: TerminologyPack;        // "supplier" vs "vendor", "SKU" vs "line item", simplified labels
  uiDensity: 'GUIDED'|'STANDARD'|'EXPERT';
}

export function resolveCapabilities(profile: ContextProfile): Capabilities;
```

**Hard rules for the agent:**
- `resolveCapabilities` is **pure and unit-tested** — given a profile, output is
  deterministic. No DB calls, no I/O.
- **No screen reads the raw profile directly.** Screens consume `Capabilities`.
- A field/module/framework that is not in `Capabilities` **is not rendered and its
  API endpoints reject writes** (defense in depth).
- Adding a new archetype or tier = adding a config object, never editing screens.

### 2.3 Config-driven, not code-driven

The dimension behavior lives in **declarative config** under
`lib/adaptivity/config/`, e.g.:

```ts
// config/archetypes.ts  (illustrative — fill out all four)
export const ARCHETYPES: Record<CategoryArchetype, ArchetypeConfig> = {
  DIRECT_MATERIAL: {
    requirementFields: ['bom','specGrade','tolerance','avl','demandQty','demandVariability','makeVsBuy'],
    intelligenceSources: ['COMMODITY_INDEX','FREIGHT','FX','SHOULD_COST','SUPPLIER_FINANCIAL'],
    strategyLevers: ['SHOULD_COST_TEARDOWN','INDEX_PRICING','DUAL_SOURCE','VMI','HEDGING','SPEC_HARMONIZATION'],
    scorecardDimensions: ['QUALITY_PPM','OTIF','COST','CAPACITY','ESG','INNOVATION'],
    templatePack: 'direct-material-v1',
  },
  INDIRECT_SERVICE: {
    requirementFields: ['scopeOfWork','slaTargets','fteOrEffort','rateCard','deliverables','kpis'],
    intelligenceSources: ['LABOR_RATE_BENCHMARK','MARKET_RATE_CARD','CAPACITY','SUPPLIER_FINANCIAL','ESG'],
    strategyLevers: ['DEMAND_MANAGEMENT','SCOPE_RATIONALIZATION','RATE_RENEGOTIATION','CONSOLIDATION','OUTCOME_BASED_PRICING'],
    scorecardDimensions: ['SLA_ADHERENCE','QUALITY','RESPONSIVENESS','COST','ESG','RELATIONSHIP'],
    templatePack: 'indirect-service-v1',
  },
  INDIRECT_GOODS: {
    // Physical goods bought indirectly: MRO, IT hardware, packaging, lab/office consumables.
    // Characterized by catalogs, tail spend, substitutability, and policy-driven demand.
    requirementFields: ['catalogSku','commercialSpec','substitutability','consumptionRate','demandPredictability','preferredVendorList','complianceStandards','warrantyTerms'],
    intelligenceSources: ['CATALOG_PRICE_BENCHMARK','DISTRIBUTOR_LANDSCAPE','COMPONENT_INDEX','FX','SUPPLIER_FINANCIAL','TAIL_SPEND_ANALYTICS'],
    strategyLevers: ['CATALOG_CONSOLIDATION','TAIL_SPEND_AGGREGATION','SPEC_STANDARDIZATION','PUNCHOUT_PREFERRED_CATALOG','VOLUME_BUNDLING','DEMAND_POLICY_CONTROL','GENERIC_SUBSTITUTION'],
    scorecardDimensions: ['FILL_RATE','OTIF','PRICE_COMPETITIVENESS','CATALOG_ACCURACY','SERVICE_RETURNS','ESG'],
    templatePack: 'indirect-goods-v1',
  },
  CAPEX_PROJECT: {
    // Capital / project spend: machinery, plant, construction, large engineered equipment.
    // Low-frequency, high-value, milestone-driven, lifecycle-cost (TCO) dominated, high execution risk.
    requirementFields: ['projectScope','engineeringSpec','capacityRequirement','tcoBasis','installCommissioning','milestoneSchedule','performanceGuarantees','capexBudget','permitsRegulatory','decommissioningEol'],
    intelligenceSources: ['OEM_LANDSCAPE','EPC_CONTRACTOR_MARKET','RAW_INPUT_INDEX','LEADTIME_CAPACITY','PROJECT_LABOR_RATE','FINANCING_RATE','SUPPLIER_FINANCIAL'],
    strategyLevers: ['TCO_OPTIMIZATION','MILESTONE_PAYMENT_STRUCTURING','PERFORMANCE_LD_CLAUSES','CAPEX_PLUS_LIFECYCLE_BUNDLING','TURNKEY_VS_MULTIPACKAGE','SITE_STANDARDIZATION','LEASE_VS_BUY_FINANCING','RISK_TRANSFER_BONDS'],
    scorecardDimensions: ['MILESTONE_ON_TIME','TECHNICAL_PERFORMANCE','TOTAL_COST_OF_OWNERSHIP','HSE_SAFETY','UPTIME_SUPPORT','FINANCIAL_STABILITY','ESG'],
    templatePack: 'capex-project-v1',
  },
};
```

```ts
// config/orgTiers.ts  (illustrative)
export const ORG_TIERS: Record<OrgTier, OrgTierConfig> = {
  SMALL: { roles:['OWNER','MEMBER','VIEWER'], approval:'SINGLE', sso:false,
           integrationMode:'FILES', defaultDensity:'GUIDED', enabledModules:['M1','M3','M4','M5','M6','M11'] },
  MID:   { roles:['ADMIN','CATEGORY_MGR','FINANCE','STAKEHOLDER','VIEWER'], approval:'TWO_STEP', sso:'optional',
           integrationMode:'FILES', defaultDensity:'STANDARD', enabledModules:['M1'..'M8','M10','M11'] },
  ENTERPRISE: { roles:'FULL_8', approval:'COUNCIL', sso:true, scim:true,
           integrationMode:'CONNECTED', defaultDensity:'STANDARD', enabledModules:'ALL' },
};
```

> All four archetypes above are complete reference configs. The agent must now
> complete the remaining dimension configs to the same shape: three org tiers,
> three maturity levels, and three data-readiness modes. Every enum value used in
> a config (e.g. `SHOULD_COST_TEARDOWN`, `FILL_RATE`) must have a corresponding
> type definition and a UI label in the relevant terminology pack.

### 2.4 Adaptivity acceptance criteria
- Switching a workspace from `SMALL/INDIRECT_SERVICE/FOUNDATIONAL` to
  `ENTERPRISE/DIRECT_MATERIAL/ADVANCED` changes visible modules, intake fields,
  frameworks, option rigor, and approval chain **without a code change**.
- A `SMALL` tenant never sees SSO config, supplier portals, or the 8-role matrix.
- A `FOUNDATIONAL` workspace sees a guided wizard and Kraljic only; `ADVANCED`
  sees full scenario simulation with probabilistic NPV.

---

## 3. Tech stack & architecture (locked)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Full-stack single repo, strong Claude Code support, RSC for fast dashboards |
| UI | **Tailwind CSS + shadcn/ui + Radix + lucide-react** | Accessible, polished, fast; "very user-friendly" mandate |
| Data fetching | **TanStack Query** + Server Actions | Predictable cache, optimistic UI |
| Forms | **React Hook Form + Zod** | Typed, validated, friendly errors |
| Charts | **Tremor** (dashboards) + **Recharts** (custom) | Clean, low-effort, executive-grade visuals |
| DB | **Postgres** | Relational integrity for a graph-of-entities domain |
| ORM | **Prisma** | Typed schema, migrations, great agent support |
| Auth + storage | **Supabase** (Auth, Storage, Postgres) | Auth/SSO/file storage out of the box; reduces build surface |
| Tenant isolation | **`tenant_id` on every row + Postgres RLS** | Hard multi-tenant guarantee |
| AI | **Provider interface with two real backends: Gemini (build) + Anthropic (launch)** | Free Google Gemini tier during the build; switch to real Claude via one env flag; both server-side, evidence-grounded (see §10) |
| Background jobs | **Inngest** (or Vercel Cron for MVP) | Monitoring & refresh agents |
| File parsing | **SheetJS (xlsx)** + **papaparse** server-side | Spend/CSV ingestion |
| Validation | **Zod** everywhere (API boundary + forms) | One schema, reused |
| Hosting | **Vercel + Supabase/Neon** | Zero-ops for v1 |
| Testing | **Vitest** (unit, esp. resolver) + **Playwright** (e2e spine) | Adaptivity & spine must be tested |

**Architectural rules:**
- **Server-side AI only.** No Anthropic key in the browser, ever.
- **API boundary validates with Zod and re-checks `Capabilities`** before any write.
- **Multi-tenancy is non-negotiable:** every table has `tenant_id`; every query is
  tenant-scoped; RLS is the backstop, not the only line of defense.
- Prefer **Server Components** for read views, **Server Actions / route handlers**
  for mutations.

---

## 4. Repo structure & conventions

```
/app
  /(auth)/...                 # sign-in, onboarding wizard
  /(app)/[workspace]/         # the product, scoped to a category workspace
    /overview /data /intelligence /positioning /options /business-case
    /sourcing /contract /transition /performance /value /command-center
  /api/...                    # route handlers (AI, ingestion, webhooks)
/components/ui                # shadcn primitives
/components/<domain>          # EvidenceCard, OptionMatrix, KraljicGrid, ...
/lib
  /adaptivity                 # resolveCapabilities + config (THE engine)
  /ai                         # Anthropic client, agents, evidence-grounding
  /db                         # prisma client, tenant-scoped helpers
  /auth                       # supabase/session, RBAC guards
  /domain                     # pure business logic (NPV, savings taxonomy, scoring)
/prisma/schema.prisma
/tests
```

**Conventions:**
- Every entity carries lineage fields (§6.3). No exceptions for AI-generated rows.
- Naming: tables `snake_case`, TS types `PascalCase`, enums `SCREAMING_SNAKE`.
- All money is `{ amountMinor: bigint, currency: string }` — never floats.
- All dates UTC ISO. All user-facing dates localized in the UI layer.
- Feature gates read `Capabilities`, never inline `if (orgTier === ...)`.
- Components are dumb about adaptivity; they receive resolved props.

---

## 5. Multi-tenancy, roles & security

- **Tenant model:** shared schema, `tenant_id` FK on every business table, RLS
  policy `tenant_id = current_setting('app.tenant_id')` set per request from the
  authenticated session.
- **RBAC** is resolved through `Capabilities.roleSet` (adaptive). The full
  enterprise set: Tenant Admin · CPO/Executive · Category Manager · Procurement
  Analyst/COE · Finance Approver · Business Stakeholder · Legal/Compliance/ESG ·
  Supplier User (external portal). `SMALL` collapses to Owner/Member/Viewer.
- **Supplier users** are external, scoped to a single sourcing event, never see
  internal data. Separate route group, separate guard.
- **Audit log** is append-only (no updates/deletes) for: approvals, publications,
  AI-published content, evidence changes, award decisions, profile changes.
- Secrets in env only. Never log PII or full spend rows.

---

## 6. Data model

### 6.1 Core entities (Prisma sketch — extend, don't shrink)

```prisma
model Tenant        { id String @id; name String; orgTier OrgTier; createdAt DateTime @default(now()) }
model User          { id String @id; tenantId String; email String; name String }
model Membership    { id String @id; tenantId String; userId String; role Role }

model Workspace {                         // == a Category strategy workspace
  id String @id; tenantId String;
  name String; taxonomyL1 String; taxonomyL2 String?; taxonomyL3 String?;
  profile Json;                           // ContextProfile (drives adaptivity)
  status WorkspaceStatus;                 // DRAFT, REVIEW, APPROVED, IN_EXECUTION, MONITORING, REFRESH
  // lineage fields (see 6.3) applied to every model
}

model EvidenceCard {                       // the trust spine — referenced everywhere
  id String @id; tenantId String; workspaceId String;
  claim String; sourceType String; sourceRef String?; sourceUrl String?;
  collectedAt DateTime; refreshedAt DateTime?; freshness Freshness;
  confidence Confidence; triangulationCount Int; ownerId String;
}

model SpendLine     { id String @id; tenantId String; workspaceId String; supplierId String?;
                      buUnit String?; site String?; glDate DateTime; amountMinor BigInt; currency String;
                      classification String?; classificationConfidence Confidence?;
                      contractId String?; isMaverick Boolean @default(false) }

model Supplier      { id String @id; tenantId String; name String; isIncumbent Boolean;
                      tier String?; riskProfile Json?; esgProfile Json? }

model RequirementArtifact { id String @id; tenantId String; workspaceId String;
                      kind String;       // BOM, SPEC, SLA, SOW, FORECAST...
                      data Json }         // archetype-shaped per Capabilities.requirementFields

model StrategyOption { id String @id; tenantId String; workspaceId String;
                      label String; isBaseline Boolean @default(false);
                      leversApplied String[]; narrative String?;
                      npvMinor BigInt?; savingsPhasing Json?; riskScore Float?;
                      scenario Json }     // base/upside/downside + probability weights

model DecisionCriterion { id String @id; workspaceId String; name String; weight Float }
model OptionScore      { id String @id; optionId String; criterionId String; score Float; rationale String? }

model BusinessCase  { id String @id; tenantId String; workspaceId String; selectedOptionId String;
                      economics Json; assumptions Json; approvals Json }

model SourcingEvent { id String @id; tenantId String; workspaceId String;
                      type SourcingType; status String; scoringModel Json }
model SupplierResponse { id String @id; eventId String; supplierId String; data Json; scores Json }
model AwardDecision { id String @id; eventId String; recommendation Json; auditTrail Json }

model SavingsInitiative { id String @id; tenantId String; workspaceId String;
                      stage SavingsStage;  // IDENTIFIED, VALIDATED, REALIZED, SUSTAINED
                      baselineMinor BigInt; valueMinor BigInt; erosionReason String? }

model AuditLog      { id String @id; tenantId String; actorId String; action String;
                      entity String; entityId String; payload Json; at DateTime @default(now()) }
```

### 6.2 Enums
`OrgTier`, `Role`, `WorkspaceStatus`, `CategoryArchetype`, `Maturity`,
`DataReadiness`, `Freshness {FRESH,AGING,STALE}`, `Confidence {HIGH,MEDIUM,LOW}`,
`SourcingType {RFI,RFQ,RFP,EAUCTION}`, `SavingsStage`.

### 6.3 Mandatory lineage fields (every business table)
`source_system · source_reference · collected_at · refreshed_at · owner ·
confidence · review_status · business_criticality · policy_exception_reason`

> **Rule:** No row representing a fact or AI output may be persisted without
> lineage. AI-generated content sets `source_system = 'AI'` and links the
> evidence cards used.

---

## 7. Module catalogue

Each module is gated by `Capabilities.enabledModules`. Release tier = earliest
phase it can appear; visibility still depends on the profile.

| ID | Module | Core capabilities | Tier |
|---|---|---|---|
| M1 | Category Workspace & Governance | scope, 3-level taxonomy, team, RACI, objective tree, council, version control, **Context Profile** | P0 |
| M2 | Spend & Contract Data Fabric | CSV/Excel/connector import, spend cube, contract coverage, invoice-vs-contract variance, maverick spend, data-quality status | P0 |
| M3 | Requirements & Demand Intelligence | archetype-shaped intake, demand forecast & variability, make-vs-buy | P0 |
| M4 | Market & Supplier Intelligence Hub | supplier universe, archetype intelligence sources, risk/ESG/financial, expert notes, source tracking | P0 |
| M5 | Positioning & Segmentation Studio | Kraljic (always) + Porter/tiering/health (maturity-gated) | P0 |
| M6 | Strategy Option Simulator | ≥2 options + baseline, weighted scorecard, NPV, scenarios, rationale capture | P0 |
| M7 | Sourcing Event & Negotiation Cockpit | RFx/eAuction, supplier portal, scoring, should-cost, negotiation log, award packet | P1 |
| M8 | Contract & Compliance Control | clause checklist, price logic, obligations, expiry alerts, leakage monitoring | P1 |
| M9 | Transition & Onboarding PMO | milestones, go/no-go gates, incumbent exit, parallel run, issue log | P1 |
| M10 | Supplier Performance & SRM | tiered scorecards, QBR, CI tracker, innovation funnel | P1 |
| M11 | Value Realization & Refresh Engine | savings taxonomy, erosion, refresh triggers, annual cycle | P1 |
| M12 | Executive Command Center | portfolio heat maps, coverage, leakage, risk, pipeline, AI briefings | P2 |

For each module, the agent implements: **purpose → screens → entities used →
adaptivity behavior (what changes per profile) → acceptance criteria.** Use the
Functional Requirements in §8 as the per-module checklist.

---

## 8. Functional requirements (acceptance checklist)

> These are the original FR-01…FR-13, preserved as the per-module DoD. Each "shall"
> is a test. Where a requirement is profile-dependent, it is gated by `Capabilities`.

- **FR-01 Workspace/governance:** 3-level taxonomy; archetype templates with
  different intake fields; RACI, council, approver mapping, version control;
  full activity log.
- **FR-02 Internal data:** ingest line-item spend (CSV/Excel/SFTP/connectors);
  classify lines with confidence; spend cube by supplier/BU/geo/time/contract/site;
  detect maverick + expired-contract + invoice-vs-contract variance; per-dataset
  quality status (complete/partial/stale/estimated/blocked).
- **FR-03 Requirements/demand:** archetype-shaped requirement store; 3–5yr demand
  by SKU/service line/site/geo; demand variability; explicit make-vs-buy.
- **FR-04 External intelligence:** supplier universe (incumbent + non); commodity/
  freight/FX/macro/ESG/sanctions/financial signals from configured sources;
  structured expert notes & interviews; every insight carries source/date/
  freshness/confidence.
- **FR-05 Provenance/freshness/confidence:** evidence-card-level provenance; H/M/L
  confidence; warn on recency/triangulation violations; **block publishing** an
  exec-ready strategy when mandatory evidence is missing/stale unless a documented
  human override exists.
- **FR-06 Option simulator:** ≥2 options + 1 do-nothing baseline; weighted compare
  across savings/working-capital/impl-cost/risk/resilience/ESG/stakeholder-fit;
  base/upside/downside + probability-weighted value; store rationale for selected
  AND rejected options.
- **FR-07 Sourcing/negotiation:** manage RFI/RFQ/RFP + supplier responses; eAuction
  where applicable; scoring models (mandatory/optional criteria, multi-stakeholder);
  should-cost/benchmark views; award recommendation packet with audit trail.
- **FR-08 Contract/compliance:** price logic/escalation/rebates/SLAs/obligations/
  expiry/notice; alerts on renewal risk, missing obligations, leakage; contracted
  vs invoiced comparison when invoice data exists.
- **FR-09 Transition:** milestone plans + owners + cutover status + issue logs;
  go/no-go + parallel-run validation; incumbent exit + contingency.
- **FR-10 Supplier performance:** tiered scorecards (quality/delivery/commercial/
  innovation/ESG/relationship); review cadences + prep packs; CI actions + savings
  + supplier-led innovation.
- **FR-11 Value/refresh:** distinguish identified/validated/realized/sustained
  savings; track erosion (non-compliance/market/demand/slippage); reopen strategy
  on configured triggers.
- **FR-12 Collaboration/approvals:** comments, @mentions, approval workflows,
  digital sign-off, evidence requests; Teams/Slack/email notifications; full audit
  trail for regulated/finance decisions.
- **FR-13 AI control plane:** label AI content + preserve prompt/model/timestamp/
  evidence refs; approve/edit/reject/compare/regenerate; anonymization before
  external calls where policy requires; **no hallucinated citations** — evidence
  cards link only to stored sources.

---

## 9. UX principles (the "very user-friendly" mandate)

The PDR's biggest risk is feeling like enterprise software. Counter it:

- **Progressive disclosure by default.** The Adaptivity Engine is also a
  *simplicity engine* — a `SMALL/FOUNDATIONAL` user sees a guided, wizard-like flow
  with at most a handful of choices per screen. Complexity appears only when the
  profile earns it.
- **One primary action per screen.** Always show the obvious next step.
- **Evidence is ambient, not a chore.** Inline `EvidenceCard` chips with a
  confidence color (green/amber/grey); adding evidence is one click, never a modal
  maze.
- **AI is a visible collaborator, not a black box.** Every AI block shows: sources
  used · assumptions made · what's missing · "human judgment needed here" — with
  Approve / Edit / Reject / Compare / Regenerate.
- **Friendly empty states** that teach (seed-data "try it" buttons).
- **Plain language**, swapped by `terminology` pack (e.g. "vendor" vs "supplier",
  simplified labels for `SMALL`).
- **Accessible** (WCAG-conscious): keyboard nav, focus states, color is never the
  only signal, real labels. shadcn/Radix gives most of this for free — don't undo it.
- Calm, confident visual tone. Dense tables get sticky headers, sane defaults,
  filtering. Dashboards use Tremor cards, not walls of numbers.

> Before building any screen, consult the `frontend-design` skill for design
> tokens, typography, and styling constraints in this environment.

---

## 10. AI implementation (provider-abstracted: Gemini now, Anthropic later)

### 10.0 Provider abstraction — BUILD THIS FIRST, before any agent

**AI is real from day one.** During the build it runs on the **free Google Gemini
tier**; switching to **real Anthropic Claude** later is a one-line env change with
no feature code touched. Both are real models behind a single interface.

```ts
// lib/ai/provider.ts
export interface AIProvider {
  research(input: ResearchInput): Promise<ResearchResult>;
  extract(input: ExtractInput): Promise<ExtractResult>;
  synthesize(input: SynthInput): Promise<SynthResult>;
  monitor(input: MonitorInput): Promise<MonitorResult>;
  negotiate(input: NegotiateInput): Promise<NegotiateResult>;
}

// Chosen ONCE from env; the rest of the app only ever sees `AIProvider`.
export function getAIProvider(): AIProvider {
  switch (process.env.AI_PROVIDER) {
    case 'anthropic': return new AnthropicProvider(); // real Claude; launch target
    case 'gemini':
    default:          return new GeminiProvider();    // free tier; the build default
  }
}
```

**Hard rules:**
- **No file calls a model SDK directly.** Everything goes through `getAIProvider()`.
  One import surface, one swap point.
- **Identical output shape** from both providers (same TypeScript types, same
  Zod-validated JSON). The UI, loading states, error handling, and the
  approve/edit/reject flow must be impossible to tell apart across providers.
- **Both providers obey the evidence-grounding contract** (§10.2): cite only
  evidence card IDs that exist; the server validates and strips unknown IDs.
- **Default is `gemini`.** If `AI_PROVIDER` is unset, use Gemini. If the selected
  provider's key is missing, fail with a clear, friendly error — never crash.
- **Gemini integration:** use Google's SDK (`@google/genai`) or its
  OpenAI-compatible endpoint; model from `GEMINI_MODEL` (default
  `gemini-2.5-flash`). **Anthropic integration:** use `@anthropic-ai/sdk`; model
  from `ANTHROPIC_MODEL`. Tool-use / structured output on both.

**Switching to Claude later = three steps, no code change:** set
`AI_PROVIDER=anthropic`, add `ANTHROPIC_API_KEY`, load credits (auto-reload OFF +
a monthly spend limit). Because Gemini and Claude differ in tone, length, and
edge-case behavior, **budget one prompt-tuning pass on Claude before launch** —
prompts tuned on Gemini will not behave identically on Claude.

> **Privacy note:** free Gemini-tier prompts may be used by Google to improve
> models. Only ever send the fake **seed/demo data** through it. Real tenant data
> must wait until you're on a paid, data-protected provider (Anthropic at launch,
> or Gemini paid tier).

### 10.1 Agents
| Agent | Job | Guardrail |
|---|---|---|
| Research | structured brief + external evidence + draft market/supplier views | every claim saved as an EvidenceCard before it can be cited; shows source list + date + confidence |
| Data extraction | parse spend/responses/contracts into structured fields | shows extraction confidence; bulk human correction UI |
| Strategy synthesis | draft positioning, option narratives, business case, exec summary | **cannot publish** without human approval |
| Monitoring | scan market/risk/contract/performance for refresh triggers | configurable thresholds + suppression rules; background job |
| Negotiation | walk-away/concession/counterproposal logic from should-cost & benchmarks | recommendations only; no autonomous commitment |

### 10.2 Evidence-grounded generation (the anti-hallucination contract)
1. Retrieve the workspace's stored `EvidenceCard`s relevant to the task.
2. Pass them to the model **with stable IDs**, instruct: *cite only by evidence
   card ID; if evidence is missing, say so explicitly — do not invent.*
3. On return, **server validates every cited ID exists** for this tenant/workspace.
   Unknown ID → strip + flag, never render.
4. Persist the AI output with `source_system='AI'`, the prompt, model string,
   timestamp, and the list of evidence card IDs actually used.
5. Web research results are **not citable until saved as evidence cards** with
   provenance.

### 10.3 Mechanics
- All AI flows through `getAIProvider()` (§10.0); server-side only; key in env.
  Stream responses where UX benefits (synthesis).
- Use tool-use / structured output (JSON via Zod-validated schema) for anything
  that becomes structured data (options, extractions, scorecards). Both providers
  return the same validated shapes.
- Anonymization step before external calls where `policy_exception_reason`/tenant
  policy requires.
- Log the provider + model version used for governance (NFR model governance).

---

## 11. Integrations (gated by `integrationMode`)
- `MANUAL` / `FILES` (default for SMALL/MID): CSV/Excel upload, manual entry.
- `CONNECTED` (ENTERPRISE): ERP/P2P (SAP S/4HANA, Oracle Fusion, Coupa, Ariba,
  Jaggaer) · CLM/SharePoint/DocuSign · Microsoft 365/Entra/Okta/Teams/Slack ·
  EcoVadis/D&B/Refinitiv/Prewave · Bloomberg/FRED · Power BI/Tableau/PDF export.
- **v1 build:** ship robust **file ingestion + export (PDF/PPTX/xlsx)** for all
  tiers; stub connectors behind an adapter interface so ENTERPRISE wiring is later
  config, not a rewrite.

---

## 12. Non-functional requirements
Availability 99.9% · P95 dashboard load <1.5s, P95 read API <250ms · first AI token
<2s when streaming · multi-tenant scale · SAML/OIDC SSO, MFA, RBAC, RLS, encryption
in transit & at rest · GDPR day 1 → ISO 27001 / SOC 2 Type II roadmap · immutable
audit log · regional data residency by tenant policy · observability (jobs, model
monitoring, connector health) · graceful degradation when feeds are down · model
governance (version log, labeling, opt-out) · WCAG-conscious patterns.

---

## 13. Build order (the sequence Claude Code follows)

**Phase 0 — Foundation (do first, fully):**
1. Repo, Next.js + TS + Tailwind + shadcn, Prisma + Postgres, Supabase auth.
2. Tenant + Membership + RLS; tenant-scoped DB helper; RBAC guard.
3. **Adaptivity Engine**: types, all config objects, `resolveCapabilities`,
   unit tests. *No feature work until this is green.*
4. **AI provider abstraction** (§10.0): `AIProvider` interface, a working
   evidence-grounded `GeminiProvider` (the active default, free tier), and a
   dormant `AnthropicProvider`. Build everything against Gemini — no cost.
5. Onboarding wizard that produces a Context Profile from ≤5 selections.

**Phase 1 — The Spine (demonstrable end-to-end loop):**
M1 Workspace → M3 requirements (archetype-shaped) → M4 intelligence + EvidenceCards
→ M5 Positioning (Kraljic, +frameworks by maturity) → M6 Option Simulator (options +
baseline + scorecard + NPV) → AI synthesis (evidence-grounded) → export to PDF/PPTX.
Plus M2 file-based spend import. **This is the MVP that must work and demo well.**

**Phase 2 — Execution & control:** M7 sourcing cockpit + supplier portal, M8 contract
control, M9 transition PMO, M10 SRM; connector adapters.

**Phase 3 — Closed-loop value:** M11 value realization + refresh triggers (background
jobs), M12 executive command center, predictive monitoring.

> Each phase ends with: passing tests, seeded demo data, and a profile-switch demo
> proving adaptivity.

---

## 14. Definition of Done (every ticket)
- Tenant-scoped + RLS-safe; no cross-tenant leakage (test it).
- Gated by `Capabilities`; renders nothing it shouldn't; API rejects ungated writes.
- Lineage fields populated; AI output carries provenance.
- Zod-validated at the API boundary; friendly form errors.
- Accessible (keyboard + labels + non-color signals).
- Unit tests for domain logic; Playwright covers the spine path.
- Works for at least two contrasting profiles (e.g. SMALL/INDIRECT_SERVICE and
  ENTERPRISE/DIRECT_MATERIAL).

---

## 15. Seed & demo data
Ship two seed tenants so the app is never empty and adaptivity is instantly visible:
- **"Northwind Foods" — SMALL / INDIRECT_SERVICE / FOUNDATIONAL** (one facilities-
  management category, file-based spend, guided flow).
- **"Atlas Industrial" — ENTERPRISE / DIRECT_MATERIAL / ADVANCED** (a steel/resin
  category, full frameworks, scenario simulation, multi-step approval).
Each seed includes spend lines, suppliers, evidence cards, requirements, and one
draft strategy with options + baseline.

---

## 16. Resolved defaults for prior open questions
- **Min evidence to leave Draft:** category positioning inputs + demand basis +
  supplier universe each have ≥1 evidence card at ≥MEDIUM confidence within recency
  policy. Configurable per tenant; default `recencyDays = 180`.
- **Savings taxonomy (finance system of record):** Identified → Validated → Realized
  → Sustained, with `avoided` as a flag, not a stage.
- **Supplier portal:** built natively in v1 (Phase 2), event-scoped external users.
- **First release category coverage:** **both** direct and indirect, differentiated
  by archetype template packs — this is the whole point of the Adaptivity Engine.
- **Pricing/market feeds:** start with FRED (free) + manual/CSV; premium feeds are
  `CONNECTED`-tier adapters added later.
- **Private deployment / stronger AI isolation:** ENTERPRISE-tier flag; anonymization
  layer is built in v1, dedicated deployment is a later option.

---

## 17. Glossary
**Archetype** — category type that reshapes fields/levers/intelligence.
**Capabilities** — resolved output of the Adaptivity Engine for a profile.
**Context Profile** — the {orgTier, archetype, maturity, dataReadiness} selection.
**Evidence Card** — atomic, sourced, dated, confidence-rated unit of truth.
**Do-nothing baseline** — mandatory comparison option in every strategy.
**Leakage** — gap between contracted and actually-paid price.
**Refresh trigger** — condition that reopens a strategy (expiry, price move, risk,
scorecard drift).

---

*StratIQ 3.0 — adaptivity-first rebuild of the StratIQ 2.0 PDR. Keep this file the
single source of truth.*
