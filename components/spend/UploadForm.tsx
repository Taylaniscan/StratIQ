"use client";

import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { loadSampleSpend, uploadSpend } from "@/app/(app)/[workspace]/data/actions";

// Kept in sync with lib/domain/spend/parse.ts SPEND_TEMPLATE_HEADERS. Defined
// locally so this client component doesn't pull the server-only parser (xlsx).
const TEMPLATE_HEADERS = [
  "supplier",
  "amount",
  "currency",
  "date",
  "businessUnit",
  "site",
  "category",
  "contractId",
];

const TEMPLATE_CSV = encodeURIComponent(
  `${TEMPLATE_HEADERS.join(",")}\nAcme Services,12500.00,USD,2026-01-15,Operations,London,Facilities,\n`,
);

export function UploadForm({ workspaceId }: { workspaceId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function onUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setMsg({ ok: false, text: "Choose a file first." });
      return;
    }
    const fd = new FormData();
    fd.set("file", file);
    setMsg(null);
    startTransition(async () => {
      const res = await uploadSpend(workspaceId, fd);
      setMsg(
        res.ok
          ? {
              ok: true,
              text: `Imported ${res.lineCount} lines${res.errorCount ? `, ${res.errorCount} skipped` : ""}.`,
            }
          : { ok: false, text: res.error },
      );
      if (res.ok && inputRef.current) inputRef.current.value = "";
    });
  }

  function onSample() {
    setMsg(null);
    startTransition(async () => {
      const res = await loadSampleSpend(workspaceId);
      setMsg(
        res.ok
          ? { ok: true, text: `Loaded ${res.lineCount} sample lines.` }
          : { ok: false, text: res.error },
      );
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={onUpload} className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1.5 file:text-sm"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Importing…" : "Import"}
        </Button>
        <Button type="button" variant="outline" onClick={onSample} disabled={pending}>
          Load sample data
        </Button>
        <a
          href={`data:text/csv;charset=utf-8,${TEMPLATE_CSV}`}
          download="stratiq-spend-template.csv"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Download template
        </a>
      </form>
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
    </div>
  );
}
