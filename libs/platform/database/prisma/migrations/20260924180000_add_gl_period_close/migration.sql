-- CreateTable
CREATE TABLE "gl_period_closes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "closed_through" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_by" TEXT,

    CONSTRAINT "gl_period_closes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gl_period_closes_organization_id_key" ON "gl_period_closes"("organization_id");

-- CreateIndex
CREATE INDEX "gl_period_closes_tenant_id_idx" ON "gl_period_closes"("tenant_id");

-- AddForeignKey
ALTER TABLE "gl_period_closes" ADD CONSTRAINT "gl_period_closes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity
ALTER TABLE "gl_period_closes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gl_period_closes" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "gl_period_closes"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
