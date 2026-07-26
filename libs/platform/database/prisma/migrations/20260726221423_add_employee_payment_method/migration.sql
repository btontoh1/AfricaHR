-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('BANK_ACCOUNT', 'MOBILE_MONEY');

-- CreateTable
CREATE TABLE "employee_payment_methods" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "bank_name" TEXT,
    "account_number" TEXT,
    "account_name" TEXT,
    "mobile_money_provider" TEXT,
    "mobile_money_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "employee_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_payment_methods_employee_id_key" ON "employee_payment_methods"("employee_id");

-- CreateIndex
CREATE INDEX "employee_payment_methods_tenant_id_idx" ON "employee_payment_methods"("tenant_id");

-- AddForeignKey
ALTER TABLE "employee_payment_methods" ADD CONSTRAINT "employee_payment_methods_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (see RLS_CONVENTION.md — non-nullable tenant_id, so the
-- plain policy applies).
ALTER TABLE "employee_payment_methods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_payment_methods" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "employee_payment_methods"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
