"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KRALJIC_LABEL, KRALJIC_POSTURE, kraljicQuadrant } from "@/lib/domain/kraljic";

import { savePositioningAction } from "@/app/(app)/[workspace]/positioning/actions";

import { KraljicGrid } from "./KraljicGrid";

export interface PositioningInitial {
  supplyRisk: number;
  businessImpact: number;
  rationale: string;
  frameworks: Record<string, string>;
  evidenceIds: string[];
}

export function PositioningStudio({
  workspaceId,
  initial,
  otherFrameworks,
  evidenceOptions,
}: {
  workspaceId: string;
  initial: PositioningInitial;
  otherFrameworks: { id: string; label: string }[];
  evidenceOptions: { id: string; claim: string }[];
}) {
  const [supplyRisk, setSupplyRisk] = useState(initial.supplyRisk);
  const [businessImpact, setBusinessImpact] = useState(initial.businessImpact);
  const [rationale, setRationale] = useState(initial.rationale);
  const [frameworks, setFrameworks] = useState<Record<string, string>>(initial.frameworks);
  const [evidenceIds, setEvidenceIds] = useState<string[]>(initial.evidenceIds);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const quadrant = useMemo(
    () => kraljicQuadrant(supplyRisk, businessImpact),
    [supplyRisk, businessImpact],
  );

  function toggleEvidence(id: string, checked: boolean) {
    setEvidenceIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await savePositioningAction(workspaceId, {
        supplyRisk,
        businessImpact,
        rationale,
        frameworks,
        evidenceIds,
      });
      setMsg(res.ok ? { ok: true, text: "Positioning saved." } : { ok: false, text: res.error });
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <KraljicGrid supplyRisk={supplyRisk} businessImpact={businessImpact} quadrant={quadrant} />
        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="supplyRisk">Supply risk: {supplyRisk}</Label>
            <input
              id="supplyRisk"
              type="range"
              min={0}
              max={100}
              value={supplyRisk}
              onChange={(e) => setSupplyRisk(Number(e.target.value))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="businessImpact">Business impact: {businessImpact}</Label>
            <input
              id="businessImpact"
              type="range"
              min={0}
              max={100}
              value={businessImpact}
              onChange={(e) => setBusinessImpact(Number(e.target.value))}
            />
          </div>
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{KRALJIC_LABEL[quadrant]}</p>
            <p className="text-muted-foreground">{KRALJIC_POSTURE[quadrant]}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="rationale">Rationale</Label>
        <Textarea
          id="rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Why this position…"
        />
      </div>

      {otherFrameworks.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-medium">Additional frameworks</p>
          {otherFrameworks.map((fw) => (
            <div key={fw.id} className="grid gap-1.5">
              <Label htmlFor={`fw-${fw.id}`}>{fw.label}</Label>
              <Textarea
                id={`fw-${fw.id}`}
                value={frameworks[fw.id] ?? ""}
                onChange={(e) => setFrameworks((prev) => ({ ...prev, [fw.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      )}

      {evidenceOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Supporting evidence</p>
          <div className="space-y-1.5">
            {evidenceOptions.map((c) => (
              <label key={c.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={evidenceIds.includes(c.id)}
                  onChange={(e) => toggleEvidence(c.id, e.target.checked)}
                />
                <span>{c.claim}</span>
              </label>
            ))}
          </div>
        </div>
      )}

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

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save positioning"}
      </Button>
    </form>
  );
}
