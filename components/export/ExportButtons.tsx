import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FORMATS: { format: string; label: string }[] = [
  { format: "pdf", label: "PDF" },
  { format: "pptx", label: "PowerPoint" },
  { format: "xlsx", label: "Excel" },
];

export function ExportButtons({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {FORMATS.map((f) => (
        <a
          key={f.format}
          href={`/${workspaceId}/export?format=${f.format}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {f.label}
        </a>
      ))}
    </div>
  );
}
