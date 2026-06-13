-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'IN_EXECUTION', 'MONITORING', 'REFRESH');

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxonomy_l1" TEXT NOT NULL,
    "taxonomy_l2" TEXT,
    "taxonomy_l3" TEXT,
    "profile" JSONB NOT NULL,
    "status" "WorkspaceStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspaces_tenant_id_idx" ON "workspaces"("tenant_id");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
