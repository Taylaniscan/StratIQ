import type { DataQuality } from "@prisma/client";

import { DataQualityBadge } from "./DataQualityBadge";

export interface DatasetRow {
  id: string;
  filename: string;
  rowCount: number;
  errorCount: number;
  total: string;
  status: DataQuality;
  createdAt: Date;
}

export function DatasetTable({ datasets }: { datasets: DatasetRow[] }) {
  if (datasets.length === 0) {
    return <p className="text-sm text-muted-foreground">No datasets imported yet.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-2 font-medium">File</th>
          <th className="py-2 font-medium">Lines</th>
          <th className="py-2 text-right font-medium">Total</th>
          <th className="py-2 font-medium">Quality</th>
          <th className="py-2 text-right font-medium">Imported</th>
        </tr>
      </thead>
      <tbody>
        {datasets.map((d) => (
          <tr key={d.id} className="border-b last:border-0">
            <td className="py-2">
              <div className="font-medium">{d.filename}</div>
              {d.errorCount > 0 && (
                <div className="text-xs text-muted-foreground">{d.errorCount} skipped</div>
              )}
            </td>
            <td className="py-2">{d.rowCount}</td>
            <td className="py-2 text-right tabular-nums">{d.total}</td>
            <td className="py-2">
              <DataQualityBadge status={d.status} />
            </td>
            <td className="py-2 text-right text-xs text-muted-foreground">
              {d.createdAt.toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
