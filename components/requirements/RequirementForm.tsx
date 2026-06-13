"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FieldSpec } from "@/lib/adaptivity";

import { saveRequirements } from "@/app/(app)/[workspace]/requirements/actions";

type Value = string | string[];

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function asString(v: Value | undefined): string {
  return Array.isArray(v) ? v.join(", ") : (v ?? "");
}

export function RequirementForm({
  workspaceId,
  fields,
  initial,
}: {
  workspaceId: string;
  fields: FieldSpec[];
  initial: Record<string, Value>;
}) {
  const [values, setValues] = useState<Record<string, Value>>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function set(id: string, v: Value) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  function toggleMulti(id: string, option: string, checked: boolean) {
    const current = Array.isArray(values[id]) ? (values[id] as string[]) : [];
    set(id, checked ? [...current, option] : current.filter((o) => o !== option));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await saveRequirements(workspaceId, values);
      setMsg(res.ok ? { ok: true, text: "Requirements saved." } : { ok: false, text: res.error });
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {fields.map((field) => (
        <div key={field.id} className="grid gap-1.5">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </Label>

          {field.type === "textarea" && (
            <Textarea
              id={field.id}
              value={asString(values[field.id])}
              onChange={(e) => set(field.id, e.target.value)}
            />
          )}

          {(field.type === "text") && (
            <Input
              id={field.id}
              value={asString(values[field.id])}
              onChange={(e) => set(field.id, e.target.value)}
            />
          )}

          {(field.type === "number" || field.type === "currency") && (
            <Input
              id={field.id}
              type="number"
              inputMode="decimal"
              value={asString(values[field.id])}
              onChange={(e) => set(field.id, e.target.value)}
            />
          )}

          {field.type === "date" && (
            <Input
              id={field.id}
              type="date"
              value={asString(values[field.id])}
              onChange={(e) => set(field.id, e.target.value)}
            />
          )}

          {field.type === "boolean" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                id={field.id}
                type="checkbox"
                checked={values[field.id] === "true"}
                onChange={(e) => set(field.id, e.target.checked ? "true" : "")}
              />
              Yes
            </label>
          )}

          {field.type === "select" && (
            <select
              id={field.id}
              className={selectClass}
              value={asString(values[field.id])}
              onChange={(e) => set(field.id, e.target.value)}
            >
              <option value="">Select…</option>
              {field.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}

          {field.type === "multiselect" && (
            <div className="flex flex-wrap gap-3">
              {field.options?.map((o) => {
                const selected = Array.isArray(values[field.id])
                  ? (values[field.id] as string[]).includes(o.value)
                  : false;
                return (
                  <label key={o.value} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => toggleMulti(field.id, o.value, e.target.checked)}
                    />
                    {o.label}
                  </label>
                );
              })}
            </div>
          )}

          {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
        </div>
      ))}

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
          {pending ? "Saving…" : "Save requirements"}
        </Button>
      </div>
    </form>
  );
}
