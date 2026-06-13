-- CreateTable
CREATE TABLE "requirement_artifacts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirement_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "requirement_artifacts_tenant_id_idx" ON "requirement_artifacts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_artifacts_workspace_id_kind_key" ON "requirement_artifacts"("workspace_id", "kind");

-- AddForeignKey
ALTER TABLE "requirement_artifacts" ADD CONSTRAINT "requirement_artifacts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
