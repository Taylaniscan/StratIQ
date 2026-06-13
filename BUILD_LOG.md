# BUILD_LOG.md — StratIQ build tracker

> **Purpose:** This is the memory between Claude Code sessions. Claude Code starts
> fresh every session, so this file is how the project remembers what's done, what's
> next, and why decisions were made.
>
> **How to use it (do this every session):**
> 1. At the **start** of a session, tell Claude Code: *"Read CLAUDE.md and BUILD_LOG.md, then tell me the current status and propose the next task in Plan Mode."*
> 2. At the **end** of a session, tell it: *"Update BUILD_LOG.md — mark completed tasks, add a session entry, and set the Next Up pointer."*
> 3. Keep secrets OUT of this file. Track *that* a key exists, never the key itself.

---

## 🔭 Current status

- **Phase:** `Phase 1 — The Spine` (in progress)
- **Next up:** **M6 Strategy Option Simulator** — ≥2 options + do-nothing baseline,
  weighted scorecard, NPV, scenarios; enforce the FR-05 evidence publish gate.
- **Last working commit:** `5ad382c` — M5 Positioning & Segmentation Studio.
- **Live URL (Vercel):** _not deployed yet_
- **Blockers:** _none_

---

## ✅ Pre-flight checklist (Stage 1 — accounts & tools)

Track readiness. Tick when done; note where the credential lives (e.g. `.env.local`).

- [ ] Claude Code installed (`claude --version` works; `claude doctor` clean)
- [ ] Claude Code authenticated (subscription or Console)
- [ ] GitHub repo created + cloned locally
- [ ] `.gitignore` added (`.env*`, `node_modules`, `.next`, build artifacts)
- [ ] Supabase project created (project ref noted, NOT the keys)
- [ ] Vercel account linked to the GitHub repo
- [ ] **App's own** Anthropic API key created in Console (separate from Claude Code login)
- [ ] Monthly spend limit set on the app's API key
- [ ] `.env.local` created with: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
- [ ] Node.js 18+ installed (only if using the npm install method)
- [ ] Editor ready (VS Code + Claude Code extension, or the desktop app)

---

## 🧱 Build tasks by phase

> Order matters. Do not start a phase until the previous one's tasks are green and
> committed. Each task = one Plan-Mode-then-build cycle, then a git commit.

### Phase 0 — Foundation (do fully before any feature)
- [x] Scaffold Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- [x] App runs locally and is pushed to GitHub
- [x] Prisma + Postgres connected; first migration runs (`init`: tenants/users/memberships)
- [x] Supabase auth wired (sign-in, session) — email/password + proxy session refresh
- [x] Tenant + Membership models + **Postgres RLS** policies (enforced via dedicated `stratiq_app` role)
- [x] Tenant-scoped DB helper + RBAC guard at the API boundary (`forTenant`/`withTenant`, `lib/auth/rbac.ts`)
- [x] **Adaptivity Engine:** types + all config objects (archetypes, tiers, maturity, data-readiness) in `lib/adaptivity/`
- [x] `resolveCapabilities()` implemented + **unit tests passing** (pure, deterministic; gates feature work)
- [x] Onboarding wizard → produces a Context Profile from ≤5 selections (provisions tenant + first workspace; live capability preview)
- [x] **Checkpoint:** two contrasting profiles resolve to visibly different capabilities (`tests/adaptivity/resolveCapabilities.test.ts`)

### Phase 1 — The Spine (the demo-able MVP)
- [x] M1 Category Workspace & Governance — shell (Capabilities-gated nav), overview (taxonomy/objective/status edit), governance (members, approval chain, append-only audit). _Deferred: version snapshots, objective tree, RACI/council editing, invites._
- [x] M2 Spend & Contract Data Fabric — CSV/Excel import + spend cube (by supplier/BU/site/month) + per-dataset quality + sample loader. _Deferred: AI classification, maverick/contract variance (needs M8), connectors, column-mapping UI._
- [x] M3 Requirements & Demand Intelligence — dynamic intake form generated from `Capabilities.requirementFields`; persisted as `RequirementArtifact`; server rejects ungated fields. _Deferred: 3–5yr demand time-series, AI extraction._
- [x] M4 Market & Supplier Intelligence Hub + **EvidenceCard** system — supplier universe, archetype intelligence sources, evidence cards (confidence + derived freshness), evidence-readiness panel. _Deferred: external feeds, AI research agent, publish-blocking enforcement (M6)._
- [x] M5 Positioning & Segmentation Studio — interactive Kraljic grid (quadrant + posture), maturity-gated frameworks (notes), evidence linking. _Deferred: structured Porter/tiering/health UIs, portfolio segmentation, AI-suggested positioning._
- [ ] M6 Strategy Option Simulator (≥2 options + baseline + scorecard + NPV)
- [ ] AI synthesis agent — **evidence-grounded** (cite-by-ID, server-validated)
- [ ] Export to PDF / PPTX / xlsx
- [ ] Seed data: "Northwind Foods" (SMALL/INDIRECT_SERVICE) + "Atlas Industrial" (ENTERPRISE/DIRECT_MATERIAL)
- [ ] Deploy spine to Vercel
- [ ] **Checkpoint:** full loop works end-to-end for both seed tenants; multi-tenant isolation verified

### Phase 2 — Execution & control
- [ ] M7 Sourcing Event & Negotiation Cockpit + external supplier portal
- [ ] M8 Contract & Compliance Control (clauses, expiry alerts, leakage)
- [ ] M9 Transition & Onboarding PMO (milestones, go/no-go gates)
- [ ] M10 Supplier Performance & SRM (tiered scorecards, QBR)
- [ ] Connector adapter interface (stubbed; ENTERPRISE wiring later)

### Phase 3 — Closed-loop value
- [ ] M11 Value Realization & Refresh Engine (savings taxonomy, erosion, triggers)
- [ ] Background jobs (Inngest / Vercel Cron) for monitoring + refresh agents
- [ ] M12 Executive Command Center (portfolio heat maps, AI briefings)

---

## 🧠 Decision log

Record every meaningful choice so it never gets re-litigated mid-build.

| Date | Decision | Rationale |
|---|---|---|
| _set up_ | Stack: Next.js + TS + shadcn + Postgres/Prisma + Supabase + RLS + Anthropic SDK | Best Claude Code support, friendly UI, fast multi-tenant path |
| _set up_ | First target: multi-tenant SaaS, real Anthropic API calls | Per product owner |
| _set up_ | Savings taxonomy: Identified → Validated → Realized → Sustained (+`avoided` flag) | Finance system-of-record default (confirm with finance) |
| 2026-06-13 | Package manager: **npm**; no `src/` dir (app/lib/components at repo root per §4) | Node 20/npm present; matches CLAUDE.md §4 structure |
| 2026-06-13 | shadcn/ui installed via the **Base UI** registry (Tailwind v4); `Button` uses `render` prop, not `asChild` | Current shadcn default; note for all future components |
| 2026-06-13 | Renamed `env.local` → `.env.local`; added committed `.env.example` | `.env.local` now gitignored + auto-loaded by Next; secrets never tracked |
| 2026-06-13 | **Prisma 6** (not 7) | Prisma 7's config-based datasource drops `directUrl`; Supabase needs pooled `url` (6543) + `directUrl` (5432). v6 supports both via `env()` in schema + standard `@prisma/client` import. Revisit v7 later. |
| 2026-06-13 | Prisma CLI loads env via `dotenv-cli` (`db:*` scripts use `-e .env.local`) | Prisma reads `.env`, not `.env.local`; runtime (Next) loads `.env.local` itself |
| 2026-06-13 | DB password percent-encoded in `.env.local` | Raw password contained `?`/`!`, breaking URL parsing (P1013); encoded so Prisma parses host/port |
| 2026-06-13 | Auth = Supabase email/password via `@supabase/ssr`; session refresh in `proxy.ts` | Next 16 renamed `middleware`→`proxy`; SSR cookie pattern guards routes server-side |
| 2026-06-13 | **Dedicated `stratiq_app` DB role** (NOBYPASSRLS) for runtime; `postgres` only for migrations/admin | Supabase `postgres` has BYPASSRLS + owns tables → RLS never bites for it. Runtime `DATABASE_URL` now uses `stratiq_app` (pooled :6543); RLS verified enforced (0 rows w/o `set_config`). |
| 2026-06-13 | RLS via idempotent `npm run db:setup-rls` (role+grants+policies), not a Prisma migration | Prisma doesn't manage roles/grants/policies; script auto-discovers `public` tables with `tenant_id` so new tables get RLS on re-run |
| 2026-06-13 | Tenant scoping = Prisma `$extends` (`forTenant`): injects tenant into where/data **and** wraps each op in a `set_config('app.tenant_id')` tx | Two enforced layers (app + RLS). `create` overwrites any foreign tenantId — can't write cross-tenant |
| 2026-06-13 | Test runner = **Vitest** (loads `.env.local`); admin client (`lib/db/admin.ts`, `postgres`) for seeds/system lookups | Needed now + for the Adaptivity Engine; admin client bypasses RLS for cross-tenant resolution only |
| 2026-06-13 | Adaptivity dimension→capability mapping: tier→modules/roles/approval/SSO; archetype→fields/sources/levers/KPIs; maturity→frameworks/options/evidence; dataReadiness→integrationMode | Directly from CLAUDE.md §2.1 control table |
| 2026-06-13 | Blends: `integrationMode` clamped to tier cap (SMALL/MID=FILES, ENT=CONNECTED); `uiDensity` FOUNDATIONAL→GUIDED/ADVANCED→EXPERT else tier default; terminology = tier base + archetype item-noun overlay | Resolve overlaps between dimensions deterministically |
| 2026-06-13 | `Capabilities` adds `sso`/`scim` beyond §2.2 sketch; label maps are `Record<Id,string>` (compile-time completeness); engine imports only Prisma `Role` **type** | Clean SMALL-no-SSO gate; TS enforces every enum value has a label; keeps engine pure |
| 2026-06-13 | Onboarding creates Tenant + first Workspace; `ContextProfile` stored as `Workspace.profile` JSON (only `OrgTier` is a Prisma enum) | §2.1/§6.1: profile at tenant onboarding; archetype/maturity/dataReadiness stay JSON until a reason to enum them |
| 2026-06-13 | Tenant provisioning runs via the **admin client** in one transaction (idempotent on `authUserId`) | Bootstrap must create a Tenant before any tenant context exists — RLS app role can't; only place that creates a Tenant |
| 2026-06-13 | `db:setup-rls` no longer ALTERs an existing role (CREATE-only) | Supabase `postgres` can CREATE roles but not ALTER their attributes/password; keeps the script idempotent. Rotate password by drop+recreate |
| 2026-06-13 | DB-based redirects in page server components, not `proxy.ts`; added `zod` for the server-boundary schema | Proxy runs on the edge (no Prisma); wizard uses tap-cards + live `resolveCapabilities` preview, RHF deferred |
| 2026-06-13 | Workspace routes keyed by Workspace **id** (`app/(app)/[workspace]/…`); loaded via `forTenant` → `notFound()` cross-tenant | Tenant isolation enforced at the route by RLS; no slug uniqueness needed |
| 2026-06-13 | Workspace shell nav is **Capabilities-gated**; unbuilt modules show disabled "Soon" | Spine lights up by adding routes; no code change to gate visibility (§2.2) |
| 2026-06-13 | `audit_logs` append-only via `REVOKE UPDATE,DELETE` from app role in `db:setup-rls` | §5 immutable audit; enforced at DB, not just app code |
| 2026-06-13 | Charts = **Recharts** (not Tremor) | Tremor npm lags Tailwind v4; Recharts is CSS-agnostic and in the stack |
| 2026-06-13 | Spend cube aggregated **in JS** from a tenant-scoped `findMany`, not raw SQL | `$queryRaw` via `forTenant` bypasses the `set_config` wrapper → RLS would return nothing; model methods are RLS-safe. Fine at v1 scale |
| 2026-06-13 | tsconfig `target` ES2017 → **ES2020** | Needed for `bigint` literals (money in minor units) |

---

## ⚠️ Known issues / risks to watch

- [x] Multi-tenant data isolation — cross-tenant access test passing (`tests/tenant-isolation.test.ts`: app-layer + RLS enforcement)
- [ ] AI cost — confirm spend limit is active before turning on real synthesis
- [ ] Adaptivity drift — no screen may read the raw profile; only `Capabilities`
- [ ] Evidence grounding — confirm unknown citation IDs are stripped, never rendered

---

## 🗒️ Session log

Newest at the top. One short entry per working session.

### Session 10 — 2026-06-13
- **Goal:** M5 Positioning & Segmentation Studio.
- **Done:** Schema: `KraljicQuadrant` enum + `Positioning` model (one per
  workspace; migration `m5_positioning`); RLS applied. Pure `lib/domain/kraljic.ts`
  (quadrant + posture/label maps, client-safe) and `lib/domain/positioning.ts`
  (get/save; computes quadrant, rejects ungated frameworks + foreign evidence ids;
  audited). Route `app/(app)/[workspace]/positioning/` (M5-gated) + action.
  Components: `KraljicGrid` (2×2 + dot), `PositioningStudio` (client: sliders →
  live quadrant/posture, rationale, per-framework notes, evidence checklist),
  `PositioningView` (read-only). Nav M5 → built. Tests: quadrant boundaries,
  save/compute/reload, ungated-framework + foreign-evidence rejection, isolation —
  **66 passing**. build + lint + tsc clean. Commit `5ad382c`.
- **Next up:** M6 Strategy Option Simulator (+ enforce the evidence publish gate).
- **Notes:** Pure Kraljic helpers extracted to `lib/domain/kraljic.ts` so the
  client grid can import them without pulling Prisma. Frameworks beyond Kraljic are
  notes-only for now; structured UIs deferred.

### Session 9 — 2026-06-13
- **Goal:** M4 Market & Supplier Intelligence Hub + the EvidenceCard trust spine.
- **Done:** Schema: `Freshness` enum + `EvidenceCard` (migration `m4_evidence`);
  RLS applied. `lib/domain/evidence.ts` (`computeFreshness` derived from recency,
  `confidenceRank`, `createEvidenceCard` (audited), `listEvidenceCards`, pure
  `evidenceReadiness` vs `evidencePolicy.requiredCards`) and `lib/domain/suppliers.ts`
  (list/add, audited). Route `app/(app)/[workspace]/intelligence/` (M4-gated) +
  actions (`addEvidence`, `addSupplierAction`, Zod-validated, RBAC). Components in
  `components/intelligence/` (EvidenceList with confidence colors + freshness,
  AddEvidenceForm, SupplierUniverse, IntelligenceSources, EvidenceReadiness). Nav
  M4 → built. Tests: freshness boundaries, readiness logic, evidence + supplier
  tenant isolation — **61 passing**. build + lint + tsc clean. Commit `d006249`.
- **Next up:** M5 Positioning & Segmentation Studio.
- **Notes:** Freshness is derived on read (snapshot column also set at write).
  `evidenceReadiness` is the basis for the FR-05 publish-block gate, enforced when
  M6 lands. Intelligence sources are shown from the engine; real feeds deferred.

### Session 8 — 2026-06-13
- **Goal:** M3 Requirements & Demand Intelligence — archetype-shaped intake.
- **Done:** Schema: `RequirementArtifact` (one per workspace per kind, `data` JSON
  keyed by field id; migration `m3_requirements`); RLS applied.
  `lib/domain/requirements.ts` (get/save; save **rejects ungated field ids** vs the
  workspace's `Capabilities.requirementFields`, find-then-create/update, audited).
  Route `app/(app)/[workspace]/requirements/` (M3-gated; editable for
  `workspace:write`, read-only summary otherwise) + `saveRequirements` action.
  `components/requirements/RequirementForm` is a generic `FieldSpec[]`-driven
  renderer (text/textarea/number/currency/date/select/multiselect/boolean) +
  `RequirementSummary`. Nav M3 → built. Tests: persist/reload, ungated-field
  rejection, single-artifact update, tenant isolation — **57 passing**. build +
  lint + tsc clean. Commit `8a01d5f`, pushed.
- **Next up:** M4 Market & Supplier Intelligence Hub + EvidenceCard system.
- **Notes:** The intake form is generated entirely from the engine — DIRECT_MATERIAL
  shows BOM/spec/tolerance, INDIRECT_SERVICE shows SOW/SLA/rate-card, same code.
  Adding intake fields = editing `lib/adaptivity/config/fields.ts` + an archetype.

### Session 7 — 2026-06-13
- **Goal:** M2 Spend & Contract Data Fabric — file import + spend cube.
- **Done:** Schema: `Confidence` + `DataQuality` enums; `Supplier`, `SpendDataset`,
  `SpendLine` models (migration `m2_spend_fabric`); RLS auto-applied. Deps: xlsx,
  papaparse, recharts. `lib/domain/money.ts` (bigint minor units),
  `lib/domain/spend/{parse,ingest,cube,sample}.ts` (CSV/Excel tolerant parse,
  supplier upsert + dataset quality, JS aggregation by supplier/BU/site/month).
  Route `app/(app)/[workspace]/data/` (page + actions: `uploadSpend`,
  `loadSampleSpend`; M2-gated + RBAC `workspace:write`). Components in
  `components/spend/` (UploadForm, SpendCharts/Recharts, DatasetTable,
  DataQualityBadge); nav M2 → built. tsconfig target → ES2020 (bigint literals).
  Tests: money + parse + ingest/cube isolation — **53 passing**. build + lint +
  tsc clean. Commit `7427bc6`, pushed.
- **Next up:** M3 Requirements & Demand Intelligence (archetype-shaped intake).
- **Notes:** M2 only shows for profiles whose `enabledModules` include M2
  (MID/ENTERPRISE) — SMALL workspaces 404 the `data` route. "Load sample data"
  seeds 40 demo lines so the cube is never empty.

### Session 6 — 2026-06-13
- **Goal:** M1 Category Workspace & Governance — the Spine's workspace shell + governance.
- **Done:** Schema: `objective` on Workspace + `AuditLog` model (migration
  `m1_workspace_governance`); `db:setup-rls` now revokes UPDATE/DELETE on
  `audit_logs` (append-only). Domain: `lib/domain/audit.ts` (`recordAudit`),
  `lib/domain/workspace.ts` (list/get/update + `governancePatchSchema`,
  members + audit queries — all via `forTenant`). `requireActiveMembership` in
  session. Routes: `app/(app)/[workspace]/` shell `layout` (Capabilities-gated
  `WorkspaceNav`), `overview` (governance edit form, RBAC-gated, + capabilities
  card), `governance` (members/RACI, approval chain, activity log), `actions.ts`
  (`updateGovernance`). Dashboard → tenant home listing workspaces. Components in
  `components/workspace/` + shadcn badge/textarea/select/separator. Tests:
  `tests/workspace.test.ts` (tenant isolation, update+audit, append-only reject) —
  **46 passing**. build + lint + tsc clean.
  Commit `e34bd6a`, pushed.
- **Next up:** M2 Spend & Contract Data Fabric (CSV/Excel import + spend cube).
- **Notes:** Workspace addressed by id in the URL; cross-tenant → `notFound` via
  RLS. Other modules (M2–M12) show as disabled "Soon" in the nav until built.

### Session 5 — 2026-06-13
- **Goal:** Onboarding wizard (Context Profile from ≤5 selections) — the Phase 0
  capstone wiring auth + DB/RLS + the Adaptivity Engine.
- **Done:** Added `Workspace` model + `WorkspaceStatus` enum (migration
  `add_workspace`); re-ran `db:setup-rls` (RLS now on `workspaces`; fixed the
  script to not ALTER an existing role). Added `zod`. `lib/adaptivity/profile.ts`
  (Zod schemas, server boundary). `lib/domain/onboarding.ts`
  `provisionTenantWorkspace` (admin-client tx: Tenant→User→Membership(OWNER)→
  Workspace; idempotent). `app/onboarding/` page guard + `OnboardingWizard`
  (tap-card stepper with **live `resolveCapabilities` preview**) + `completeOnboarding`
  server action. Dashboard upgraded to load the workspace via `forTenant` (RLS in a
  real page) and render the resolved capabilities; guards onboarding↔dashboard.
  **42 tests passing** (34 prior + 8 new: provisioning incl. idempotency +
  forTenant isolation, and Zod schema). build + lint + tsc clean; dev smoke shows
  guards redirecting. Commit `9e7a9fc`, pushed. **Phase 0 complete.**
- **Next up:** Phase 1 — M1 Category Workspace & Governance.
- **Notes:** Auth'd happy-path (signup→/onboarding→create→/dashboard) verified by
  integration tests; UI verified manually by the user. Email confirmation is OFF so
  signup lands a session immediately.

### Session 4 — 2026-06-13
- **Goal:** Build the Adaptivity Engine (CLAUDE.md §2) — the pure resolver that
  gates all feature work.
- **Done:** `lib/adaptivity/`: `types.ts` (ContextProfile, Capabilities, all id/
  spec types), `config/` (archetypes verbatim from §2.3; orgTiers; maturity;
  dataReadiness; fields registry; labels as `Record<Id,string>`; terminology),
  `resolveCapabilities.ts` (pure/deterministic; deep-copies output) +
  `withProfileDefaults`, and `index.ts` barrel. Tests in `tests/adaptivity/`:
  `resolveCapabilities.test.ts` (determinism, §2.4 contrast, SMALL invariants,
  integration clamp, density blend, defaults) and `config.test.ts` (integrity).
  **34 tests passing** (15 prior + 19 new). Build + lint + `tsc --noEmit` clean;
  grep confirms no db/next/auth imports (pure). Commit `d66e511`, pushed.
- **Next up:** Onboarding wizard (Context Profile from ≤5 selections), then Phase 1.
- **Notes:** Engine reuses the Prisma `Role` **type** only. `Capabilities` adds
  `sso`/`scim` beyond the §2.2 sketch. The §2.4 acceptance criterion is proven by
  the contrast test. `CategoryArchetype`/`Maturity`/`DataReadiness` are TS unions
  here; add matching Prisma enums when persisting profiles in the wizard task.

### Session 3 — 2026-06-13
- **Goal:** Multi-tenancy security — Postgres RLS + tenant-scoped DB helper + RBAC
  guard, with a cross-tenant isolation test.
- **Done:** Found Prisma connected as `postgres` (BYPASSRLS) → RLS inert. Added a
  dedicated `stratiq_app` role (LOGIN, NOBYPASSRLS) via idempotent
  `scripts/db/setup-rls.mjs` (`npm run db:setup-rls`): role + grants + default
  privileges + RLS enable/FORCE + `tenant_isolation` policy on every `public`
  table with `tenant_id` (and `tenants` by `id`). Switched runtime `DATABASE_URL`
  to `stratiq_app` (pooled :6543); `DIRECT_URL` stays `postgres`. Verified the app
  role connects through the pooler and RLS enforces (0 rows without `set_config`).
  Built `lib/db/admin.ts` (privileged client), `lib/db/tenant.ts`
  (`forTenant`/`withTenant` extension: where/data injection + `set_config` tx),
  `lib/auth/session.ts`, `lib/auth/rbac.ts`. Added Vitest (`vitest.config.ts`,
  `test`/`test:run`). Tests: `tenant-isolation.test.ts` (app-layer + RLS, incl.
  create-overwrite + "no set_config ⇒ 0 rows") and `rbac.test.ts` — **15 passing**.
  Build + lint + `tsc --noEmit` clean. `.env.example` documents the two roles.
  Commit `ec46872`, pushed.
- **Next up:** Adaptivity Engine (types + config + `resolveCapabilities` + unit tests).
- **Notes:** `forTenant().create()` still requires `tenantId` statically (Prisma
  types don't know the extension injects it) — callers pass it; the extension
  overwrites to the active tenant as a safety net. Onboarding (auth-user →
  Tenant/Membership) is still pending, so the live dashboard shows the auth user
  only. Re-run `npm run db:setup-rls` after adding any new tenant-scoped table.

### Session 2 — 2026-06-13
- **Goal:** Wire up Prisma + Postgres and Supabase auth on the scaffold; run
  locally; stop for verification.
- **Done:** Installed Prisma 6 + `@supabase/ssr` + `dotenv-cli`. Wrote
  `prisma/schema.prisma` (datasource: pooled `DATABASE_URL` + `directUrl`
  `DIRECT_URL`; enums `OrgTier`/`Role`; models `Tenant`/`User`/`Membership`).
  First migration `init` applied to Supabase (direct 5432); pooled (6543) runtime
  connection verified via Prisma (`tenant.count() = 0`). Prisma client singleton
  at `lib/db/prisma.ts`. Supabase SSR clients (`lib/auth/supabase/{server,client,middleware}.ts`),
  session refresh + route guard in `proxy.ts`, `/login` (email+password,
  sign-in/sign-up server actions), protected `/dashboard` (shows user, sign out).
  `.env.local` DB password percent-encoded to fix P1013. Build + lint clean; dev
  smoke: `/` 200, `/login` 200, `/dashboard` → 307 → `/login`. Commit
  `32f8ca4`, pushed to `origin/main`.
- **Next up:** Postgres RLS policies + tenant-scoped DB helper + RBAC guard, then
  the Adaptivity Engine.
- **Notes:** Full sign-in round-trip depends on the Supabase project's
  email-confirmation setting (user to verify). Tenant/User/Membership models were
  created now (needed a first migration) but **RLS is NOT yet applied** — do that
  before any real multi-tenant data. Staying on Prisma 6 deliberately (see
  decision log). To run: `npm run dev` → http://localhost:3000.

### Session 1 — 2026-06-13
- **Goal:** Phase 0, Task 1 — project scaffold.
- **Done:** Scaffolded Next.js 16 (App Router) + TypeScript + Tailwind v4 +
  shadcn/ui (Base UI registry; `button`, `card`). Laid down the §4 directory
  skeleton (`lib/{adaptivity,ai,db,auth,domain}`, `components/domain`, `prisma`,
  `tests`, route groups `app/(auth)`/`app/(app)`). Replaced the landing page with
  a branded StratIQ placeholder (shadcn Card + Button) and fixed the `--font-sans`
  wiring in `layout.tsx`. Renamed `env.local` → `.env.local`, added `.env.example`,
  ignored `next-env.d.ts`. `npm run build` clean; dev server serves the page (200).
  Commit `a7a88ec`, pushed to `origin/main`.
- **Next up:** Prisma + Postgres connected; first migration runs.
- **Notes:** `frontend-design` skill referenced by CLAUDE.md §9 is **not installed**
  in this environment — used shadcn design tokens directly. shadcn's Base UI
  `Button` takes a `render` prop instead of Radix `asChild`; remember this for
  future components. Vitest/Playwright configs deferred to the Adaptivity Engine
  task where they are first needed.

### Session 0 — _template_
- **Goal:** _what you set out to do_
- **Done:** _what actually shipped + commit hash_
- **Next up:** _the single next task_
- **Notes:** _anything future-you needs to know_
