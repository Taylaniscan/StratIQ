import type { FieldSpec } from "@/lib/adaptivity";

type Value = string | string[];

function display(field: FieldSpec, v: Value | undefined): string {
  if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return "—";
  const raw = Array.isArray(v) ? v.join(", ") : v;
  if (field.options) {
    const list = Array.isArray(v) ? v : [v];
    const labels = list.map((val) => field.options?.find((o) => o.value === val)?.label ?? val);
    return labels.join(", ");
  }
  return raw;
}

export function RequirementSummary({
  fields,
  values,
}: {
  fields: FieldSpec[];
  values: Record<string, Value>;
}) {
  return (
    <dl className="grid grid-cols-[12rem_1fr] gap-x-4 gap-y-2 text-sm">
      {fields.map((field) => (
        <div key={field.id} className="contents">
          <dt className="text-muted-foreground">{field.label}</dt>
          <dd>{display(field, values[field.id])}</dd>
        </div>
      ))}
    </dl>
  );
}
