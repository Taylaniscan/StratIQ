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

- **Phase:** `Phase 0 — Foundation` (in progress)
- **Next up:** Prisma + Postgres connected; first migration runs.
- **Last working commit:** `__SCAFFOLD_HASH__` — Phase 0 Task 1 scaffold (Next.js + Tailwind + shadcn).
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
- [ ] Prisma + Postgres connected; first migration runs
- [ ] Supabase auth wired (sign-in, session)
- [ ] Tenant + Membership models + **Postgres RLS** policies
- [ ] Tenant-scoped DB helper + RBAC guard at the API boundary
- [ ] **Adaptivity Engine:** types + all config objects (archetypes ✓ in CLAUDE.md, plus tiers/maturity/data-readiness)
- [ ] `resolveCapabilities()` implemented + **unit tests passing** (this gates all feature work)
- [ ] Onboarding wizard → produces a Context Profile from ≤5 selections
- [ ] **Checkpoint:** two contrasting profiles resolve to visibly different capabilities

### Phase 1 — The Spine (the demo-able MVP)
- [ ] M1 Category Workspace & Governance (taxonomy, team, profile, version control)
- [ ] M2 Spend & Contract Data Fabric — file (CSV/Excel) import + spend cube
- [ ] M3 Requirements & Demand Intelligence (archetype-shaped intake fields)
- [ ] M4 Market & Supplier Intelligence Hub + **EvidenceCard** system
- [ ] M5 Positioning & Segmentation Studio (Kraljic always; others maturity-gated)
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

---

## ⚠️ Known issues / risks to watch

- [ ] Multi-tenant data isolation — verify with a cross-tenant access test early
- [ ] AI cost — confirm spend limit is active before turning on real synthesis
- [ ] Adaptivity drift — no screen may read the raw profile; only `Capabilities`
- [ ] Evidence grounding — confirm unknown citation IDs are stripped, never rendered

---

## 🗒️ Session log

Newest at the top. One short entry per working session.

### Session 1 — 2026-06-13
- **Goal:** Phase 0, Task 1 — project scaffold.
- **Done:** Scaffolded Next.js 16 (App Router) + TypeScript + Tailwind v4 +
  shadcn/ui (Base UI registry; `button`, `card`). Laid down the §4 directory
  skeleton (`lib/{adaptivity,ai,db,auth,domain}`, `components/domain`, `prisma`,
  `tests`, route groups `app/(auth)`/`app/(app)`). Replaced the landing page with
  a branded StratIQ placeholder (shadcn Card + Button) and fixed the `--font-sans`
  wiring in `layout.tsx`. Renamed `env.local` → `.env.local`, added `.env.example`,
  ignored `next-env.d.ts`. `npm run build` clean; dev server serves the page (200).
  Commit `__SCAFFOLD_HASH__`, pushed to `origin/main`.
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
