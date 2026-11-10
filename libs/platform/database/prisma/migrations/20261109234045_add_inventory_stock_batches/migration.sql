-- AlterTable
ALTER TABLE "inventory_stock_ledger" ADD COLUMN     "batch_id" TEXT;

-- CreateTable
CREATE TABLE "inventory_stock_batches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "manufacture_date" TIMESTAMP(3),
    "received_quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remaining_quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "inventory_stock_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_stock_batches_tenant_id_idx" ON "inventory_stock_batches"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_stock_batches_tenant_id_product_id_warehouse_id_e_idx" ON "inventory_stock_batches"("tenant_id", "product_id", "warehouse_id", "expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stock_batches_tenant_id_product_id_warehouse_id_b_key" ON "inventory_stock_batches"("tenant_id", "product_id", "warehouse_id", "batch_number");

-- CreateIndex
CREATE INDEX "inventory_stock_ledger_batch_id_idx" ON "inventory_stock_ledger"("batch_id");

-- AddForeignKey
ALTER TABLE "inventory_stock_ledger" ADD CONSTRAINT "inventory_stock_ledger_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "inventory_stock_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_batches" ADD CONSTRAINT "inventory_stock_batches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_batches" ADD CONSTRAINT "inventory_stock_batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_batches" ADD CONSTRAINT "inventory_stock_batches_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "inventory_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity
ALTER TABLE "inventory_stock_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_stock_batches" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_stock_batches"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
