import Link from "next/link";
import { notFound } from "next/navigation";

import { resolveCapabilities } from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";
import { requireActiveMembership } from "@/lib/auth/session";
import { getWorkspace } from "@/lib/domain/workspace";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { StatusBadge } from "@/components/workspace/StatusBadge";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceId } = await params;
  const { tenant } = await requireActiveMembership();

  const workspace = await getWorkspace(tenant.id, workspaceId);
  if (!workspace) {
    notFound();
  }

  const profile = contextProfileSchema.parse(workspace.profile);
  const caps = resolveCapabilities(profile);
  const taxonomy = [workspace.taxonomyL1, workspace.taxonomyL2, workspace.taxonomyL3]
    .filter(Boolean)
    .join(" › ");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto w-full max-w-5xl px-6 py-3">
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:underline"
          >
            ← {tenant.name}
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-lg font-semibold">{workspace.name}</h1>
            <StatusBadge status={workspace.status} />
          </div>
          {taxonomy && <p className="text-xs text-muted-foreground">{taxonomy}</p>}
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-6 py-6 md:grid-cols-[200px_1fr]">
        <aside>
          <WorkspaceNav workspaceId={workspaceId} enabledModules={caps.enabledModules} />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
