-- CreateEnum
CREATE TYPE "KraljicQuadrant" AS ENUM ('LEVERAGE', 'STRATEGIC', 'NON_CRITICAL', 'BOTTLENECK');

-- CreateTable
CREATE TABLE "positionings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "kraljic_supply_risk" INTEGER NOT NULL DEFAULT 50,
    "kraljic_business_impact" INTEGER NOT NULL DEFAULT 50,
    "kraljic_quadrant" "KraljicQuadrant" NOT NULL DEFAULT 'NON_CRITICAL',
    "rationale" TEXT,
    "frameworks" JSONB,
    "evidence_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positionings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "positionings_workspace_id_key" ON "positionings"("workspace_id");

-- CreateIndex
CREATE INDEX "positionings_tenant_id_idx" ON "positionings"("tenant_id");

-- AddForeignKey
ALTER TABLE "positionings" ADD CONSTRAINT "positionings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
