-- CreateEnum
CREATE TYPE "InventoryStockTransactionType" AS ENUM ('GOODS_RECEIVED', 'GOODS_ISSUED', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'REVERSAL');

-- AlterEnum
ALTER TYPE "AddOnModule" ADD VALUE 'INVENTORY';

-- CreateTable
CREATE TABLE "inventory_units" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "inventory_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_unit_conversions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "from_unit_id" TEXT NOT NULL,
    "to_unit_id" TEXT NOT NULL,
    "factor" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "inventory_unit_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "inventory_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_products" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT,
    "base_unit_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "manufacturer" TEXT,
    "purchase_price" DECIMAL(65,30) NOT NULL,
    "selling_price" DECIMAL(65,30),
    "min_stock_level" DECIMAL(65,30),
    "max_stock_level" DECIMAL(65,30),
    "image_storage_key" TEXT,
    "tracks_batch" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "inventory_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_warehouses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "manager_employee_id" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "inventory_warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_stock_ledger" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "transaction_type" "InventoryStockTransactionType" NOT NULL,
    "quantity_in" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "quantity_out" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(65,30),
    "reference_type" TEXT,
    "reference_id" TEXT,
    "reversal_of_id" TEXT,
    "note" TEXT,
    "actor_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_stock_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_stock_balances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_stock_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_units_tenant_id_idx" ON "inventory_units"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_units_tenant_id_name_key" ON "inventory_units"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "inventory_unit_conversions_tenant_id_idx" ON "inventory_unit_conversions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_unit_conversions_tenant_id_from_unit_id_to_unit_i_key" ON "inventory_unit_conversions"("tenant_id", "from_unit_id", "to_unit_id");

-- CreateIndex
CREATE INDEX "inventory_categories_tenant_id_idx" ON "inventory_categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_categories_tenant_id_name_key" ON "inventory_categories"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "inventory_products_tenant_id_idx" ON "inventory_products"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_products_category_id_idx" ON "inventory_products"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_products_tenant_id_sku_key" ON "inventory_products"("tenant_id", "sku");

-- CreateIndex
CREATE INDEX "inventory_warehouses_tenant_id_idx" ON "inventory_warehouses"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_warehouses_organization_id_idx" ON "inventory_warehouses"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_warehouses_tenant_id_code_key" ON "inventory_warehouses"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stock_ledger_reversal_of_id_key" ON "inventory_stock_ledger"("reversal_of_id");

-- CreateIndex
CREATE INDEX "inventory_stock_ledger_tenant_id_idx" ON "inventory_stock_ledger"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_stock_ledger_warehouse_id_product_id_idx" ON "inventory_stock_ledger"("warehouse_id", "product_id");

-- CreateIndex
CREATE INDEX "inventory_stock_ledger_reference_type_reference_id_idx" ON "inventory_stock_ledger"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "inventory_stock_balances_tenant_id_idx" ON "inventory_stock_balances"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stock_balances_tenant_id_warehouse_id_product_id_key" ON "inventory_stock_balances"("tenant_id", "warehouse_id", "product_id");

-- AddForeignKey
ALTER TABLE "inventory_units" ADD CONSTRAINT "inventory_units_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_unit_conversions" ADD CONSTRAINT "inventory_unit_conversions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_unit_conversions" ADD CONSTRAINT "inventory_unit_conversions_from_unit_id_fkey" FOREIGN KEY ("from_unit_id") REFERENCES "inventory_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_unit_conversions" ADD CONSTRAINT "inventory_unit_conversions_to_unit_id_fkey" FOREIGN KEY ("to_unit_id") REFERENCES "inventory_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_categories" ADD CONSTRAINT "inventory_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_categories" ADD CONSTRAINT "inventory_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "inventory_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_products" ADD CONSTRAINT "inventory_products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_products" ADD CONSTRAINT "inventory_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "inventory_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_products" ADD CONSTRAINT "inventory_products_base_unit_id_fkey" FOREIGN KEY ("base_unit_id") REFERENCES "inventory_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_warehouses" ADD CONSTRAINT "inventory_warehouses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_warehouses" ADD CONSTRAINT "inventory_warehouses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_warehouses" ADD CONSTRAINT "inventory_warehouses_manager_employee_id_fkey" FOREIGN KEY ("manager_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_ledger" ADD CONSTRAINT "inventory_stock_ledger_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_ledger" ADD CONSTRAINT "inventory_stock_ledger_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "inventory_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_ledger" ADD CONSTRAINT "inventory_stock_ledger_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_ledger" ADD CONSTRAINT "inventory_stock_ledger_reversal_of_id_fkey" FOREIGN KEY ("reversal_of_id") REFERENCES "inventory_stock_ledger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_balances" ADD CONSTRAINT "inventory_stock_balances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_balances" ADD CONSTRAINT "inventory_stock_balances_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "inventory_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_balances" ADD CONSTRAINT "inventory_stock_balances_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Every inventory table has a non-nullable tenant_id, so they all use the
-- plain tenant_isolation policy (RLS_CONVENTION.md §2) - same pattern as
-- tenant_payroll_wallets/vendors. No SECURITY DEFINER escape hatch needed:
-- nothing here is read across tenants.
ALTER TABLE "inventory_units" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_units" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_units"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "inventory_unit_conversions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_unit_conversions" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_unit_conversions"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "inventory_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_categories" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_categories"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "inventory_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_products" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_products"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "inventory_warehouses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_warehouses" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_warehouses"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "inventory_stock_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_stock_ledger" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_stock_ledger"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "inventory_stock_balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_stock_balances" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_stock_balances"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
