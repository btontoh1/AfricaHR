-- CreateTable
CREATE TABLE "gl_budgets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "gl_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gl_budgets_tenant_id_idx" ON "gl_budgets"("tenant_id");

-- CreateIndex
CREATE INDEX "gl_budgets_organization_id_idx" ON "gl_budgets"("organization_id");

-- CreateIndex
CREATE INDEX "gl_budgets_account_id_idx" ON "gl_budgets"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "gl_budgets_tenant_id_organization_id_account_id_fiscal_year_key" ON "gl_budgets"("tenant_id", "organization_id", "account_id", "fiscal_year", "currency");

-- AddForeignKey
ALTER TABLE "gl_budgets" ADD CONSTRAINT "gl_budgets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_budgets" ADD CONSTRAINT "gl_budgets_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "gl_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (see RLS_CONVENTION.md)
ALTER TABLE "gl_budgets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gl_budgets" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "gl_budgets"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
