"use client";

import { useMemo, useState, useTransition } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  resolveCapabilities,
  withProfileDefaults,
  MODULE_LABELS,
  FRAMEWORK_LABELS,
  type CategoryArchetype,
  type ContextProfile,
  type DataReadiness,
  type Maturity,
  type OrgTier,
} from "@/lib/adaptivity";

import { completeOnboarding } from "./actions";

type Option<T> = { value: T; label: string; hint: string };

const ORG_TIER_OPTIONS: Option<OrgTier>[] = [
  { value: "SMALL", label: "Small business", hint: "Fewer than 200 people" },
  { value: "MID", label: "Mid-market", hint: "200–5,000 people" },
  { value: "ENTERPRISE", label: "Enterprise", hint: "5,000+ people" },
];

const ARCHETYPE_OPTIONS: Option<CategoryArchetype>[] = [
  { value: "DIRECT_MATERIAL", label: "Direct material", hint: "Production inputs, BOM-driven" },
  { value: "INDIRECT_GOODS", label: "Indirect goods", hint: "MRO, IT hardware, catalogs" },
  { value: "INDIRECT_SERVICE", label: "Indirect service", hint: "SOW, SLAs, rate cards" },
  { value: "CAPEX_PROJECT", label: "Capital project", hint: "Plant, equipment, construction" },
];

const MATURITY_OPTIONS: Option<Maturity>[] = [
  { value: "FOUNDATIONAL", label: "Foundational", hint: "Guided, Kraljic only" },
  { value: "DEVELOPING", label: "Developing", hint: "More frameworks & rigor" },
  { value: "ADVANCED", label: "Advanced", hint: "Full scenarios, probabilistic" },
];

const DATA_READINESS_OPTIONS: Option<DataReadiness>[] = [
  { value: "MANUAL", label: "Manual", hint: "Type it in" },
  { value: "FILES", label: "Files", hint: "CSV / Excel uploads" },
  { value: "CONNECTED", label: "Connected", hint: "ERP / system feeds" },
];

const TOTAL_STEPS = 4;

function SelectCard<T extends string>({
  option,
  selected,
  onSelect,
}: {
  option: Option<T>;
  selected: boolean;
  onSelect: (v: T) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(option.value)}
      className={cn(
        "flex w-full flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:bg-muted",
      )}
    >
      <span className="text-sm font-medium">{option.label}</span>
      <span className="text-xs text-muted-foreground">{option.hint}</span>
    </button>
  );
}

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [taxonomyL1, setTaxonomyL1] = useState("");
  const [orgTier, setOrgTier] = useState<OrgTier>();
  const [categoryArchetype, setCategoryArchetype] = useState<CategoryArchetype>();
  const [maturity, setMaturity] = useState<Maturity>();
  const [dataReadiness, setDataReadiness] = useState<DataReadiness>();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const preview = useMemo(() => {
    const partial: Partial<ContextProfile> = {};
    if (orgTier) partial.orgTier = orgTier;
    if (categoryArchetype) partial.categoryArchetype = categoryArchetype;
    if (maturity) partial.maturity = maturity;
    if (dataReadiness) partial.dataReadiness = dataReadiness;
    return resolveCapabilities(withProfileDefaults(partial));
  }, [orgTier, categoryArchetype, maturity, dataReadiness]);

  const stepValid = [
    orgName.trim().length >= 2 && !!orgTier,
    workspaceName.trim().length >= 2 && taxonomyL1.trim().length >= 2 && !!categoryArchetype,
    !!maturity && !!dataReadiness,
    true,
  ][step];

  const allComplete =
    orgName.trim().length >= 2 &&
    workspaceName.trim().length >= 2 &&
    taxonomyL1.trim().length >= 2 &&
    !!orgTier &&
    !!categoryArchetype &&
    !!maturity &&
    !!dataReadiness;

  function submit() {
    if (!allComplete) return;
    setError(null);
    startTransition(async () => {
      const res = await completeOnboarding({
        orgName,
        workspaceName,
        taxonomyL1,
        orgTier,
        categoryArchetype,
        maturity,
        dataReadiness,
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <main className="flex flex-1 items-start justify-center p-6">
      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Set up · Step {step + 1} of {TOTAL_STEPS}
            </p>
            <CardTitle className="text-2xl">
              {step === 0 && "Your organization"}
              {step === 1 && "Your first category"}
              {step === 2 && "How you'll work"}
              {step === 3 && "Review & create"}
            </CardTitle>
            <CardDescription>
              {step === 0 && "A few taps and StratIQ shapes itself around you."}
              {step === 1 && "Pick the category you want to tackle first."}
              {step === 2 && "This sets your frameworks, rigor, and data flow."}
              {step === 3 && "Confirm the setup below, then create your workspace."}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            {step === 0 && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="orgName">Organization name</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Organization size</Label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {ORG_TIER_OPTIONS.map((o) => (
                      <SelectCard key={o.value} option={o} selected={orgTier === o.value} onSelect={setOrgTier} />
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="workspaceName">Category name</Label>
                  <Input
                    id="workspaceName"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Facilities management"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taxonomyL1">Top-level category</Label>
                  <Input
                    id="taxonomyL1"
                    value={taxonomyL1}
                    onChange={(e) => setTaxonomyL1(e.target.value)}
                    placeholder="Facilities"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Category type</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ARCHETYPE_OPTIONS.map((o) => (
                      <SelectCard
                        key={o.value}
                        option={o}
                        selected={categoryArchetype === o.value}
                        onSelect={setCategoryArchetype}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid gap-2">
                  <Label>Analytical maturity</Label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {MATURITY_OPTIONS.map((o) => (
                      <SelectCard key={o.value} option={o} selected={maturity === o.value} onSelect={setMaturity} />
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Data readiness</Label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {DATA_READINESS_OPTIONS.map((o) => (
                      <SelectCard
                        key={o.value}
                        option={o}
                        selected={dataReadiness === o.value}
                        onSelect={setDataReadiness}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Organization</dt>
                <dd className="font-medium">{orgName || "—"}</dd>
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium">{workspaceName || "—"}</dd>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">
                  {ARCHETYPE_OPTIONS.find((o) => o.value === categoryArchetype)?.label ?? "—"}
                </dd>
                <dt className="text-muted-foreground">Profile</dt>
                <dd className="font-medium">
                  {[orgTier, maturity, dataReadiness].filter(Boolean).join(" · ") || "—"}
                </dd>
              </dl>
            )}

            {error && (
              <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || pending}
              >
                Back
              </Button>
              {step < TOTAL_STEPS - 1 ? (
                <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!stepValid}>
                  Continue
                </Button>
              ) : (
                <Button type="button" onClick={submit} disabled={!allComplete || pending}>
                  {pending ? "Creating…" : "Create workspace"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live capability preview — the engine reshaping the product in real time. */}
        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Adapting to you
            </p>
            <CardTitle className="text-base">Your StratIQ</CardTitle>
            <CardDescription>{preview.uiDensity} experience</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Modules ({preview.enabledModules.length})
              </p>
              <p className="mt-1 leading-relaxed">
                {preview.enabledModules.map((m) => MODULE_LABELS[m].split(" ")[0]).join(" · ")}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Frameworks</p>
              <p className="mt-1 leading-relaxed">
                {preview.frameworks.map((f) => FRAMEWORK_LABELS[f]).join(" · ")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-y-1">
              <span className="text-xs text-muted-foreground">Options</span>
              <span className="text-right">
                ≥{preview.optionPolicy.minOptions} · {preview.optionPolicy.scenarios.toLowerCase()}
              </span>
              <span className="text-xs text-muted-foreground">Integration</span>
              <span className="text-right">{preview.integrationMode.toLowerCase()}</span>
              <span className="text-xs text-muted-foreground">Roles</span>
              <span className="text-right">{preview.roleSet.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
