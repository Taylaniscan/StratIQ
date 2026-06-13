export interface AuditRow {
  id: string;
  action: string;
  at: Date;
  actorId: string;
}

export function AuditFeed({ entries }: { entries: AuditRow[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {entries.map((e) => (
        <li key={e.id} className="flex items-baseline justify-between gap-4 border-b pb-2 last:border-0">
          <span className="font-mono text-xs">{e.action}</span>
          <time
            dateTime={e.at.toISOString()}
            className="shrink-0 text-xs text-muted-foreground"
          >
            {e.at.toLocaleString()}
          </time>
        </li>
      ))}
    </ul>
  );
}
