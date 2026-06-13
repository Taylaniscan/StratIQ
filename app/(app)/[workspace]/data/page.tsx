import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveCapabilities } from "@/lib/adaptivity";
import { contextProfileSchema } from "@/lib/adaptivity/profile";
import { can } from "@/lib/auth/rbac";
import { requireActiveMembership } from "@/lib/auth/session";
import { forTenant } from "@/lib/db/tenant";
import { formatMinor } from "@/lib/domain/money";
import { spendCube } from "@/lib/domain/spend/cube";
import { getWorkspace } from "@/lib/domain/workspace";
import { DatasetTable } from "@/components/spend/DatasetTable";
import { SpendCharts } from "@/components/spend/SpendCharts";
import { UploadForm } from "@/components/spend/UploadForm";

export default async function DataPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceId } = await params;
  const { tenant, membership } = await requireActiveMembership();

  const workspace = await getWorkspace(tenant.id, workspaceId);
  if (!workspace) notFound();

  const caps = resolveCapabilities(contextProfileSchema.parse(workspace.profile));
  if (!caps.enabledModules.includes("M2")) notFound();

  const canEdit = can(membership.role, "workspace:write");

  const datasets = await forTenant(tenant.id).spendDataset.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  const cube = await spendCube(tenant.id, workspaceId);

  return (
    <div className="space-y-6">
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Import spend</CardTitle>
            <CardDescription>
              Upload a CSV or Excel export, or load sample data to explore.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadForm workspaceId={workspaceId} />
          </CardContent>
        </Card>
      )}

      {cube.lineCount === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No spend yet</CardTitle>
            <CardDescription>
              {canEdit
                ? "Import a file above to build the spend cube."
                : "No spend data has been imported for this category."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total spend</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {formatMinor(cube.totalMinor, cube.currency)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Lines</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{cube.lineCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Suppliers</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {cube.bySupplier.length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Spend cube</CardTitle>
              <CardDescription>Amounts in {cube.currency}, major units.</CardDescription>
            </CardHeader>
            <CardContent>
              <SpendCharts
                byMonth={cube.byMonth}
                bySupplier={cube.bySupplier}
                byBusinessUnit={cube.byBusinessUnit}
              />
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datasets</CardTitle>
          <CardDescription>Imported files and their data-quality status.</CardDescription>
        </CardHeader>
        <CardContent>
          <DatasetTable
            datasets={datasets.map((d) => ({
              id: d.id,
              filename: d.filename,
              rowCount: d.rowCount,
              errorCount: d.errorCount,
              total: formatMinor(d.totalMinor, d.currency ?? cube.currency),
              status: d.status,
              createdAt: d.createdAt,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
