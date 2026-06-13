"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { requestReviewAction } from "@/app/(app)/[workspace]/options/actions";

export function PublishPanel({
  workspaceId,
  blockers,
  ready,
  status,
}: {
  workspaceId: string;
  blockers: string[];
  ready: boolean;
  status: string;
}) {
  const [override, setOverride] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setMsg(null);
    startTransition(async () => {
      const res = await requestReviewAction(workspaceId, showOverride ? override : undefined);
      if (res.ok) {
        setMsg({
          ok: true,
          text: res.overridden ? "Sent to review with a documented override." : "Sent to review.",
        });
      } else if (res.blockers) {
        setMsg({ ok: false, text: `Blocked: ${res.blockers.join("; ")}` });
      } else {
        setMsg({ ok: false, text: res.error ?? "Could not request review." });
      }
    });
  }

  if (status !== "DRAFT") {
    return (
      <p className="text-sm text-muted-foreground">
        Workspace status is <strong>{status.replace(/_/g, " ").toLowerCase()}</strong>.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {ready ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          All checks pass — ready to send for review.
        </p>
      ) : (
        <div className="space-y-1.5">
          <p className="text-sm">Resolve before review:</p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {blockers.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {!ready && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showOverride} onChange={(e) => setShowOverride(e.target.checked)} />
          Override with documented justification
        </label>
      )}
      {!ready && showOverride && (
        <Textarea
          value={override}
          onChange={(e) => setOverride(e.target.value)}
          placeholder="Why is it acceptable to proceed without meeting the policy?"
        />
      )}

      <Button
        type="button"
        onClick={submit}
        disabled={pending || (!ready && (!showOverride || override.trim().length < 5))}
      >
        {pending ? "Sending…" : "Request review"}
      </Button>

      {msg && (
        <p
          role="status"
          className={msg.ok ? "text-sm text-muted-foreground" : "text-sm text-destructive"}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
