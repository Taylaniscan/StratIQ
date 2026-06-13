"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface Bucket {
  key: string;
  amount: number;
}

function compact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
}

function Chart({ title, data }: { title: string; data: Bucket[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="key"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tickFormatter={compact}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            width={48}
          />
          <Tooltip
            formatter={(value) => compact(Number(value))}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          />
          <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SpendCharts({
  byMonth,
  bySupplier,
  byBusinessUnit,
}: {
  byMonth: Bucket[];
  bySupplier: Bucket[];
  byBusinessUnit: Bucket[];
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <Chart title="Spend by month" data={byMonth} />
      </div>
      <Chart title="Top suppliers" data={bySupplier} />
      <Chart title="By business unit" data={byBusinessUnit} />
    </div>
  );
}
