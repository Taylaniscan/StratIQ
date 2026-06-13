-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "DataQuality" AS ENUM ('COMPLETE', 'PARTIAL', 'STALE', 'ESTIMATED', 'BLOCKED');

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_incumbent" BOOLEAN NOT NULL DEFAULT false,
    "tier" TEXT,
    "risk_profile" JSONB,
    "esg_profile" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spend_datasets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" "DataQuality" NOT NULL DEFAULT 'COMPLETE',
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "total_minor" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spend_datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spend_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "bu_unit" TEXT,
    "site" TEXT,
    "gl_date" TIMESTAMP(3) NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "classification" TEXT,
    "classification_confidence" "Confidence",
    "contract_id" TEXT,
    "is_maverick" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "spend_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_idx" ON "suppliers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_tenant_id_name_key" ON "suppliers"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "spend_datasets_tenant_id_idx" ON "spend_datasets"("tenant_id");

-- CreateIndex
CREATE INDEX "spend_datasets_workspace_id_idx" ON "spend_datasets"("workspace_id");

-- CreateIndex
CREATE INDEX "spend_lines_tenant_id_idx" ON "spend_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "spend_lines_workspace_id_idx" ON "spend_lines"("workspace_id");

-- CreateIndex
CREATE INDEX "spend_lines_dataset_id_idx" ON "spend_lines"("dataset_id");

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spend_datasets" ADD CONSTRAINT "spend_datasets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spend_lines" ADD CONSTRAINT "spend_lines_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spend_lines" ADD CONSTRAINT "spend_lines_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "spend_datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spend_lines" ADD CONSTRAINT "spend_lines_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
