"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ScenarioMode } from "@/lib/adaptivity";
import { computeNpvMinor, weightedScore } from "@/lib/domain/finance";
import { formatMinor, parseAmountToMinor } from "@/lib/domain/money";

import { saveSimulationAction } from "@/app/(app)/[workspace]/options/actions";

const uid = () => Math.random().toString(36).slice(2, 10);

interface CriterionState {
  localId: string;
  name: string;
  weight: number;
}
interface OptionState {
  localId: string;
  label: string;
  isBaseline: boolean;
  isSelected: boolean;
  levers: string[];
  narrative: string;
  implCost: string;
  savingsBase: string;
  savingsUpside: string;
  savingsDownside: string;
  horizonYears: number;
  scores: Record<string, number>; // criterionLocalId -> score
}

export interface SimulatorInitial {
  criteria: { name: string; weight: number }[];
  options: {
    label: string;
    isBaseline: boolean;
    isSelected: boolean;
    levers: string[];
    narrative: string;
    implCost: string;
    savingsBase: string;
    savingsUpside: string;
    savingsDownside: string;
    horizonYears: number;
    scoresByIndex: number[]; // aligned to criteria order
  }[];
}

function npvDisplay(savings: string, horizon: number, implCost: string, currency: string) {
  try {
    const npv = computeNpvMinor(parseAmountToMinor(savings || "0"), horizon, parseAmountToMinor(implCost || "0"));
    return formatMinor(npv, currency);
  } catch {
    return "—";
  }
}

export function OptionSimulator({
  workspaceId,
  scenarios,
  currency,
  leverOptions,
  initial,
}: {
  workspaceId: string;
  scenarios: ScenarioMode;
  currency: string;
  leverOptions: { id: string; label: string }[];
  initial: SimulatorInitial;
}) {
  const [criteria, setCriteria] = useState<CriterionState[]>(() =>
    initial.criteria.map((c) => ({ localId: uid(), name: c.name, weight: c.weight })),
  );
  const [options, setOptions] = useState<OptionState[]>(() =>
    initial.options.map((o) => {
      const scores: Record<string, number> = {};
      // criteria state is already initialized here; map scoresByIndex → localId.
      criteria.forEach((c, ci) => {
        scores[c.localId] = o.scoresByIndex[ci] ?? 0;
      });
      return {
        localId: uid(),
        label: o.label,
        isBaseline: o.isBaseline,
        isSelected: o.isSelected,
        levers: o.levers,
        narrative: o.narrative,
        implCost: o.implCost,
        savingsBase: o.savingsBase,
        savingsUpside: o.savingsUpside,
        savingsDownside: o.savingsDownside,
        horizonYears: o.horizonYears,
        scores,
      };
    }),
  );

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const showRange = scenarios !== "POINT";

  function patchOption(localId: string, patch: Partial<OptionState>) {
    setOptions((prev) => prev.map((o) => (o.localId === localId ? { ...o, ...patch } : o)));
  }

  function setScore(optionId: string, criterionId: string, score: number) {
    setOptions((prev) =>
      prev.map((o) =>
        o.localId === optionId ? { ...o, scores: { ...o.scores, [criterionId]: score } } : o,
      ),
    );
  }

  function toggleLever(optionId: string, lever: string, on: boolean) {
    setOptions((prev) =>
      prev.map((o) =>
        o.localId === optionId
          ? { ...o, levers: on ? [...o.levers, lever] : o.levers.filter((l) => l !== lever) }
          : o,
      ),
    );
  }

  function addOption(baseline = false) {
    setOptions((prev) => [
      ...prev,
      {
        localId: uid(),
        label: baseline ? "Do-nothing baseline" : `Option ${prev.length + 1}`,
        isBaseline: baseline,
        isSelected: false,
        levers: [],
        narrative: "",
        implCost: "0",
        savingsBase: "0",
        savingsUpside: "0",
        savingsDownside: "0",
        horizonYears: 3,
        scores: {},
      },
    ]);
  }

  function selectOption(localId: string) {
    setOptions((prev) => prev.map((o) => ({ ...o, isSelected: o.localId === localId })));
  }

  function save() {
    setMsg(null);
    startTransition(async () => {
      const payload = {
        criteria: criteria.map((c) => ({ name: c.name, weight: c.weight })),
        options: options.map((o) => ({
          label: o.label,
          isBaseline: o.isBaseline,
          isSelected: o.isSelected,
          leversApplied: o.levers,
          narrative: o.narrative,
          implCost: o.implCost,
          savingsBase: o.savingsBase,
          savingsUpside: o.savingsUpside,
          savingsDownside: o.savingsDownside,
          horizonYears: o.horizonYears,
          scores: criteria.map((c, idx) => ({
            criterionIndex: idx,
            score: o.scores[c.localId] ?? 0,
          })),
        })),
      };
      const res = await saveSimulationAction(workspaceId, payload);
      setMsg(res.ok ? { ok: true, text: "Strategy saved." } : { ok: false, text: res.error });
    });
  }

  return (
    <div className="space-y-6">
      {/* Criteria */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Decision criteria (weighted)</h3>
        {criteria.map((c) => (
          <div key={c.localId} className="flex items-center gap-2">
            <Input
              value={c.name}
              placeholder="Criterion"
              onChange={(e) =>
                setCriteria((prev) => prev.map((x) => (x.localId === c.localId ? { ...x, name: e.target.value } : x)))
              }
              className="flex-1"
            />
            <Input
              type="number"
              min={0}
              value={c.weight}
              onChange={(e) =>
                setCriteria((prev) =>
                  prev.map((x) => (x.localId === c.localId ? { ...x, weight: Number(e.target.value) } : x)),
                )
              }
              className="w-20"
              aria-label="Weight"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCriteria((prev) => prev.filter((x) => x.localId !== c.localId))}
            >
              ✕
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setCriteria((prev) => [...prev, { localId: uid(), name: "", weight: 1 }])}
        >
          Add criterion
        </Button>
      </section>

      {/* Options */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Options</h3>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => addOption(false)}>
              Add option
            </Button>
            {!options.some((o) => o.isBaseline) && (
              <Button type="button" variant="outline" onClick={() => addOption(true)}>
                Add baseline
              </Button>
            )}
          </div>
        </div>

        {options.map((o) => {
          const score = weightedScore(
            criteria.map((c) => ({ criterionId: c.localId, score: o.scores[c.localId] ?? 0 })),
            criteria.map((c) => ({ id: c.localId, weight: c.weight })),
          );
          return (
            <div key={o.localId} className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={o.label}
                  onChange={(e) => patchOption(o.localId, { label: e.target.value })}
                  className="flex-1 min-w-48"
                />
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={o.isBaseline}
                    onChange={(e) => patchOption(o.localId, { isBaseline: e.target.checked })}
                  />
                  Baseline
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    name="selected"
                    checked={o.isSelected}
                    onChange={() => selectOption(o.localId)}
                  />
                  Selected
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOptions((prev) => prev.filter((x) => x.localId !== o.localId))}
                >
                  ✕
                </Button>
              </div>

              {leverOptions.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                  {leverOptions.map((l) => (
                    <label key={l.id} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={o.levers.includes(l.id)}
                        onChange={(e) => toggleLever(o.localId, l.id, e.target.checked)}
                      />
                      {l.label}
                    </label>
                  ))}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-4">
                <Field label={`Savings/yr (base, ${currency})`}>
                  <Input value={o.savingsBase} onChange={(e) => patchOption(o.localId, { savingsBase: e.target.value })} />
                </Field>
                {showRange && (
                  <>
                    <Field label="Savings (upside)">
                      <Input value={o.savingsUpside} onChange={(e) => patchOption(o.localId, { savingsUpside: e.target.value })} />
                    </Field>
                    <Field label="Savings (downside)">
                      <Input value={o.savingsDownside} onChange={(e) => patchOption(o.localId, { savingsDownside: e.target.value })} />
                    </Field>
                  </>
                )}
                <Field label="Impl. cost">
                  <Input value={o.implCost} onChange={(e) => patchOption(o.localId, { implCost: e.target.value })} />
                </Field>
                <Field label="Horizon (yrs)">
                  <Input
                    type="number"
                    min={1}
                    value={o.horizonYears}
                    onChange={(e) => patchOption(o.localId, { horizonYears: Number(e.target.value) })}
                  />
                </Field>
              </div>

              {criteria.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {criteria.map((c) => (
                    <Field key={c.localId} label={`${c.name || "Criterion"} (0–100)`}>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={o.scores[c.localId] ?? 0}
                        onChange={(e) => setScore(o.localId, c.localId, Number(e.target.value))}
                      />
                    </Field>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-4 border-t pt-2 text-sm">
                <span>
                  Weighted score: <strong>{score}</strong>
                </span>
                <span>
                  NPV (base): <strong>{npvDisplay(o.savingsBase, o.horizonYears, o.implCost, currency)}</strong>
                </span>
              </div>

              <Textarea
                value={o.narrative}
                placeholder="Rationale…"
                onChange={(e) => patchOption(o.localId, { narrative: e.target.value })}
              />
            </div>
          );
        })}
      </section>

      {msg && (
        <p
          role="status"
          className={
            msg.ok
              ? "text-sm text-muted-foreground"
              : "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          }
        >
          {msg.text}
        </p>
      )}

      <Button type="button" onClick={save} disabled={pending}>
        {pending ? "Saving…" : "Save strategy"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
