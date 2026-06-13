import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMemberships, requireAuthUser } from "@/lib/auth/session";
import { forTenant } from "@/lib/db/tenant";
import {
  resolveCapabilities,
  MODULE_LABELS,
  FRAMEWORK_LABELS,
} from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";

import { signout } from "../../(auth)/login/actions";

export default async function DashboardPage() {
  const user = await requireAuthUser();

  const memberships = await getMemberships(user.id);
  const membership = memberships[0];
  if (!membership) {
    redirect("/onboarding");
  }
  const tenant = membership.tenant;

  // Load the tenant's first workspace through the tenant-scoped client — this
  // exercises RLS in a real page.
  const workspace = await forTenant(tenant.id).workspace.findFirst({
    orderBy: { createdAt: "asc" },
  });
  const profile = workspace ? contextProfileSchema.parse(workspace.profile) : null;
  const caps = profile ? resolveCapabilities(profile) : null;

  return (
    <main className="flex flex-1 flex-col items-center p-6">
      <div className="w-full max-w-3xl space-y-6">
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

        {workspace && caps && profile ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{workspace.name}</CardTitle>
              <CardDescription>
                {profile.categoryArchetype.replace(/_/g, " ").toLowerCase()} ·{" "}
                {profile.maturity.toLowerCase()} maturity · {caps.uiDensity.toLowerCase()} experience
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Enabled modules ({caps.enabledModules.length})
                </p>
                <ul className="mt-1 space-y-0.5">
                  {caps.enabledModules.map((m) => (
                    <li key={m}>{MODULE_LABELS[m]}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Frameworks</p>
                  <p className="mt-1">
                    {caps.frameworks.map((f) => FRAMEWORK_LABELS[f]).join(", ")}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-y-1">
                  <dt className="text-xs text-muted-foreground">Options</dt>
                  <dd className="text-right">
                    ≥{caps.optionPolicy.minOptions} · {caps.optionPolicy.scenarios.toLowerCase()}
                  </dd>
                  <dt className="text-xs text-muted-foreground">Integration</dt>
                  <dd className="text-right">{caps.integrationMode.toLowerCase()}</dd>
                  <dt className="text-xs text-muted-foreground">Roles</dt>
                  <dd className="text-right">{caps.roleSet.length}</dd>
                  <dt className="text-xs text-muted-foreground">SSO</dt>
                  <dd className="text-right">{caps.sso ? "enabled" : "off"}</dd>
                </dl>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">No workspace yet</CardTitle>
              <CardDescription>
                Your tenant has no category workspace. The full workspace screens
                arrive in Phase 1.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </main>
  );
}
