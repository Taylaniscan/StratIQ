import { Badge } from "@/components/ui/badge";

export interface OptionViewRow {
  id: string;
  label: string;
  isBaseline: boolean;
  isSelected: boolean;
  npv: string;
  score: number;
}

export function OptionsView({ options }: { options: OptionViewRow[] }) {
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">No options defined yet.</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-2 font-medium">Option</th>
          <th className="py-2 text-right font-medium">Weighted score</th>
          <th className="py-2 text-right font-medium">NPV (base)</th>
        </tr>
      </thead>
      <tbody>
        {options.map((o) => (
          <tr key={o.id} className="border-b last:border-0">
            <td className="py-2">
              <span className="flex items-center gap-2">
                {o.label}
                {o.isBaseline && <Badge variant="outline">Baseline</Badge>}
                {o.isSelected && <Badge>Selected</Badge>}
              </span>
            </td>
            <td className="py-2 text-right tabular-nums">{o.score}</td>
            <td className="py-2 text-right tabular-nums">{o.npv}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
