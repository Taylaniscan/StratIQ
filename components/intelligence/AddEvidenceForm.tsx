"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { addEvidence } from "@/app/(app)/[workspace]/intelligence/actions";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const CATEGORIES = [
  ["POSITIONING_INPUT", "Positioning input"],
  ["DEMAND_BASIS", "Demand basis"],
  ["SUPPLIER_UNIVERSE", "Supplier universe"],
  ["MARKET", "Market"],
  ["SUPPLIER_RISK", "Supplier risk"],
  ["PRICING", "Pricing"],
  ["OTHER", "Other"],
] as const;

const SOURCE_TYPES = ["Web", "Report", "Expert note", "Interview", "Internal", "Feed"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AddEvidenceForm({ workspaceId }: { workspaceId: string }) {
  const [claim, setClaim] = useState("");
  const [category, setCategory] = useState<string>("MARKET");
  const [sourceType, setSourceType] = useState("Web");
  const [sourceRef, setSourceRef] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [collectedAt, setCollectedAt] = useState(today());
  const [confidence, setConfidence] = useState("MEDIUM");
  const [triangulationCount, setTriangulationCount] = useState("1");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await addEvidence(workspaceId, {
        claim,
        category,
        sourceType,
        sourceRef,
        sourceUrl,
        collectedAt,
        confidence,
        triangulationCount,
      });
      if (res.ok) {
        setMsg({ ok: true, text: "Evidence added." });
        setClaim("");
        setSourceRef("");
        setSourceUrl("");
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="claim">Claim</Label>
        <Textarea
          id="claim"
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          placeholder="e.g. Resin index up 6% QoQ per supplier briefing"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="category">Category</Label>
          <select id="category" className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="sourceType">Source type</Label>
          <select id="sourceType" className={selectClass} value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
            {SOURCE_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confidence">Confidence</Label>
          <select id="confidence" className={selectClass} value={confidence} onChange={(e) => setConfidence(e.target.value)}>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="sourceRef">Source reference</Label>
          <Input id="sourceRef" value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="collectedAt">Collected</Label>
          <Input id="collectedAt" type="date" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="triangulationCount">Sources</Label>
          <Input
            id="triangulationCount"
            type="number"
            min={1}
            value={triangulationCount}
            onChange={(e) => setTriangulationCount(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="sourceUrl">Source URL (optional)</Label>
        <Input id="sourceUrl" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" />
      </div>

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

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add evidence"}
        </Button>
      </div>
    </form>
  );
}
