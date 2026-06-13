"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { addSupplierAction } from "@/app/(app)/[workspace]/intelligence/actions";

export interface SupplierRow {
  id: string;
  name: string;
  isIncumbent: boolean;
  tier: string | null;
}

export function SupplierUniverse({
  workspaceId,
  suppliers,
  canEdit,
}: {
  workspaceId: string;
  suppliers: SupplierRow[];
  canEdit: boolean;
}) {
  const [name, setName] = useState("");
  const [isIncumbent, setIsIncumbent] = useState(false);
  const [tier, setTier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setError(null);
    startTransition(async () => {
      const res = await addSupplierAction(workspaceId, {
        name,
        isIncumbent,
        tier,
      });
      if (res.ok) {
        setName("");
        setTier("");
        setIsIncumbent(false);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {suppliers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No suppliers yet.</p>
      ) : (
        <ul className="divide-y">
          {suppliers.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="font-medium">{s.name}</span>
              <span className="flex items-center gap-2">
                {s.tier && <span className="text-xs text-muted-foreground">{s.tier}</span>}
                {s.isIncumbent && <Badge variant="secondary">Incumbent</Badge>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2 border-t pt-3">
          <div className="grid gap-1">
            <label htmlFor="supName" className="text-xs text-muted-foreground">Name</label>
            <Input
              id="supName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Supplier name"
              className="w-48"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="supTier" className="text-xs text-muted-foreground">Tier</label>
            <Input
              id="supTier"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              placeholder="Strategic…"
              className="w-32"
            />
          </div>
          <label className="flex items-center gap-1.5 pb-2 text-sm">
            <input type="checkbox" checked={isIncumbent} onChange={(e) => setIsIncumbent(e.target.checked)} />
            Incumbent
          </label>
          <Button type="submit" disabled={pending} className="mb-0.5">
            {pending ? "Adding…" : "Add"}
          </Button>
          {error && <p className="w-full text-sm text-destructive">{error}</p>}
        </form>
      )}
    </div>
  );
}
