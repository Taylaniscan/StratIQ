"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  generateSynthesisAction,
  setSynthesisStatusAction,
} from "@/app/(app)/[workspace]/synthesis/actions";

import { AiBadge } from "./AiBadge";

export interface LatestSynthesis {
  id: string;
  output: string;
  model: string;
  status: "DRAFT" | "APPROVED" | "REJECTED";
  createdAt: string;
  citedClaims: string[];
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
};

export function SynthesisPanel({
  workspaceId,
  canGenerate,
  canApprove,
  latest,
}: {
  workspaceId: string;
  canGenerate: boolean;
  canApprove: boolean;
  latest: LatestSynthesis | null;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    setMsg(null);
    startTransition(async () => {
      const res = await generateSynthesisAction(workspaceId);
      if (res.ok) {
        setMsg({
          ok: true,
          text:
            res.strippedCount > 0
              ? `Draft generated. ${res.strippedCount} unsupported citation(s) were stripped.`
              : "Draft generated.",
        });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  function setStatus(approve: boolean) {
    setMsg(null);
    startTransition(async () => {
      const res = await setSynthesisStatusAction(workspaceId, latest!.id, approve);
      if (res.ok) router.refresh();
      else setMsg({ ok: false, text: res.error });
    });
  }

  return (
    <div className="space-y-4">
      {canGenerate && (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={generate} disabled={pending}>
            {pending ? "Generating…" : latest ? "Regenerate" : "Generate executive summary"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Demo evidence only — free-tier AI may use prompts to improve models.
          </p>
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

      {latest ? (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <AiBadge model={latest.model} />
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[latest.status]}>{latest.status.toLowerCase()}</Badge>
              <time className="text-xs text-muted-foreground">
                {new Date(latest.createdAt).toLocaleString()}
              </time>
            </div>
          </div>

          <p className="whitespace-pre-wrap text-sm leading-relaxed">{latest.output}</p>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Sources cited ({latest.citedClaims.length})
            </p>
            {latest.citedClaims.length > 0 ? (
              <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                {latest.citedClaims.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">No evidence cited.</p>
            )}
          </div>

          {latest.status === "DRAFT" && (
            <div className="flex gap-2 border-t pt-3">
              {canApprove && (
                <Button type="button" onClick={() => setStatus(true)} disabled={pending}>
                  Approve
                </Button>
              )}
              {canGenerate && (
                <Button type="button" variant="outline" onClick={() => setStatus(false)} disabled={pending}>
                  Reject
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No AI draft yet{canGenerate ? " — generate one above." : "."}
        </p>
      )}
    </div>
  );
}
