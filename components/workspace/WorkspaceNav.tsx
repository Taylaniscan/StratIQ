"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { MODULE_LABELS, type ModuleId } from "@/lib/adaptivity";

// Module → URL segment. M1 is represented by the always-present Overview +
// Governance items; the rest are Spine modules that light up as they're built.
const MODULE_NAV: { id: ModuleId; segment: string; built: boolean }[] = [
  { id: "M2", segment: "data", built: true },
  { id: "M3", segment: "requirements", built: false },
  { id: "M4", segment: "intelligence", built: false },
  { id: "M5", segment: "positioning", built: false },
  { id: "M6", segment: "options", built: false },
  { id: "M7", segment: "sourcing", built: false },
  { id: "M8", segment: "contract", built: false },
  { id: "M9", segment: "transition", built: false },
  { id: "M10", segment: "performance", built: false },
  { id: "M11", segment: "value", built: false },
  { id: "M12", segment: "command-center", built: false },
];

export function WorkspaceNav({
  workspaceId,
  enabledModules,
}: {
  workspaceId: string;
  enabledModules: ModuleId[];
}) {
  const pathname = usePathname();
  const base = `/${workspaceId}`;

  const builtItems = [
    { href: `${base}/overview`, label: "Overview" },
    { href: `${base}/governance`, label: "Governance" },
  ];

  const moduleItems = MODULE_NAV.filter((m) => enabledModules.includes(m.id));

  return (
    <nav className="flex flex-col gap-0.5 text-sm" aria-label="Workspace sections">
      {builtItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}

      <p className="px-3 pt-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Modules
      </p>
      {moduleItems.map((m) => {
        if (!m.built) {
          return (
            <span
              key={m.id}
              aria-disabled
              className="flex items-center justify-between rounded-md px-3 py-1.5 text-muted-foreground/60"
            >
              {MODULE_LABELS[m.id]}
              <span className="text-[10px] uppercase tracking-wide">Soon</span>
            </span>
          );
        }
        const href = `${base}/${m.segment}`;
        const active = pathname === href;
        return (
          <Link
            key={m.id}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {MODULE_LABELS[m.id]}
          </Link>
        );
      })}
    </nav>
  );
}
