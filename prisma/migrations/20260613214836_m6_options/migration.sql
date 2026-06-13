-- CreateTable
CREATE TABLE "strategy_options" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_baseline" BOOLEAN NOT NULL DEFAULT false,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "levers_applied" TEXT[],
    "narrative" TEXT,
    "impl_cost_minor" BIGINT NOT NULL DEFAULT 0,
    "savings_base_minor" BIGINT NOT NULL DEFAULT 0,
    "savings_upside_minor" BIGINT NOT NULL DEFAULT 0,
    "savings_downside_minor" BIGINT NOT NULL DEFAULT 0,
    "horizon_years" INTEGER NOT NULL DEFAULT 3,
    "risk_score" DOUBLE PRECISION,
    "npv_minor" BIGINT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategy_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_criteria" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "decision_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_scores" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "criterion_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rationale" TEXT,

    CONSTRAINT "option_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "strategy_options_tenant_id_idx" ON "strategy_options"("tenant_id");

-- CreateIndex
CREATE INDEX "strategy_options_workspace_id_idx" ON "strategy_options"("workspace_id");

-- CreateIndex
CREATE INDEX "decision_criteria_tenant_id_idx" ON "decision_criteria"("tenant_id");

-- CreateIndex
CREATE INDEX "decision_criteria_workspace_id_idx" ON "decision_criteria"("workspace_id");

-- CreateIndex
CREATE INDEX "option_scores_tenant_id_idx" ON "option_scores"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "option_scores_option_id_criterion_id_key" ON "option_scores"("option_id", "criterion_id");

-- AddForeignKey
ALTER TABLE "strategy_options" ADD CONSTRAINT "strategy_options_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_criteria" ADD CONSTRAINT "decision_criteria_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_scores" ADD CONSTRAINT "option_scores_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "strategy_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_scores" ADD CONSTRAINT "option_scores_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "decision_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
