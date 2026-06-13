"use client";

import { useState, useTransition } from "react";
import type { WorkspaceStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { updateGovernance } from "@/app/(app)/[workspace]/actions";

const STATUSES: { value: WorkspaceStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "REVIEW", label: "In review" },
  { value: "APPROVED", label: "Approved" },
  { value: "IN_EXECUTION", label: "In execution" },
  { value: "MONITORING", label: "Monitoring" },
  { value: "REFRESH", label: "Refresh" },
];

export interface GovernanceInitial {
  name: string;
  objective: string;
  taxonomyL1: string;
  taxonomyL2: string;
  taxonomyL3: string;
  status: WorkspaceStatus;
}

export function GovernanceEditForm({
  workspaceId,
  initial,
}: {
  workspaceId: string;
  initial: GovernanceInitial;
}) {
  const [name, setName] = useState(initial.name);
  const [objective, setObjective] = useState(initial.objective);
  const [taxonomyL1, setTaxonomyL1] = useState(initial.taxonomyL1);
  const [taxonomyL2, setTaxonomyL2] = useState(initial.taxonomyL2);
  const [taxonomyL3, setTaxonomyL3] = useState(initial.taxonomyL3);
  const [status, setStatus] = useState<WorkspaceStatus>(initial.status);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await updateGovernance(workspaceId, {
        name,
        objective,
        taxonomyL1,
        taxonomyL2,
        taxonomyL3,
        status,
      });
      setMsg(
        res.ok
          ? { ok: true, text: "Changes saved." }
          : { ok: false, text: res.error },
      );
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Category name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="objective">Objective / scope</Label>
        <Textarea
          id="objective"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="What this category strategy needs to achieve…"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="taxonomyL1">Taxonomy L1</Label>
          <Input id="taxonomyL1" value={taxonomyL1} onChange={(e) => setTaxonomyL1(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="taxonomyL2">Taxonomy L2</Label>
          <Input id="taxonomyL2" value={taxonomyL2} onChange={(e) => setTaxonomyL2(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="taxonomyL3">Taxonomy L3</Label>
          <Input id="taxonomyL3" value={taxonomyL3} onChange={(e) => setTaxonomyL3(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as WorkspaceStatus)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
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
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
