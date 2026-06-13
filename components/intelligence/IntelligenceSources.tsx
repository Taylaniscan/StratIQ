import { Badge } from "@/components/ui/badge";

export function IntelligenceSources({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((l) => (
        <Badge key={l} variant="outline">
          {l}
        </Badge>
      ))}
    </div>
  );
}
