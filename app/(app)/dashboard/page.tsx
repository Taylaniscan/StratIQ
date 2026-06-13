import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireActiveMembership } from "@/lib/auth/session";
import { listWorkspaces } from "@/lib/domain/workspace";
import { StatusBadge } from "@/components/workspace/StatusBadge";

import { signout } from "../../(auth)/login/actions";

export default async function DashboardPage() {
  const { user, membership, tenant } = await requireActiveMembership();
  const workspaces = await listWorkspaces(tenant.id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {tenant.orgTier} · {membership.role}
          </p>
          <h1 className="text-2xl font-semibold">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={signout}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Categories ({workspaces.length})
        </h2>
        {workspaces.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">No categories yet</CardTitle>
              <CardDescription>Create one to get started.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          workspaces.map((w) => (
            <Link key={w.id} href={`/${w.id}/overview`} className="block">
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{w.name}</CardTitle>
                    <StatusBadge status={w.status} />
                  </div>
                  <CardDescription>
                    {[w.taxonomyL1, w.taxonomyL2, w.taxonomyL3].filter(Boolean).join(" › ")}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
