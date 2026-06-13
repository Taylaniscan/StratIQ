-- CreateEnum
CREATE TYPE "Freshness" AS ENUM ('FRESH', 'AGING', 'STALE');

-- CreateTable
CREATE TABLE "evidence_cards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "category" TEXT,
    "source_type" TEXT NOT NULL,
    "source_ref" TEXT,
    "source_url" TEXT,
    "collected_at" TIMESTAMP(3) NOT NULL,
    "refreshed_at" TIMESTAMP(3),
    "freshness" "Freshness" NOT NULL DEFAULT 'FRESH',
    "confidence" "Confidence" NOT NULL DEFAULT 'MEDIUM',
    "triangulation_count" INTEGER NOT NULL DEFAULT 1,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evidence_cards_tenant_id_idx" ON "evidence_cards"("tenant_id");

-- CreateIndex
CREATE INDEX "evidence_cards_workspace_id_idx" ON "evidence_cards"("workspace_id");

-- AddForeignKey
ALTER TABLE "evidence_cards" ADD CONSTRAINT "evidence_cards_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
