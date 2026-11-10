-- CreateEnum
CREATE TYPE "InventoryRequisitionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONVERTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryPurchaseOrderStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryStockRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CompanyAssetStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED');

-- AlterTable
ALTER TABLE "inventory_stock_ledger" ADD COLUMN     "purchase_order_line_id" TEXT;

-- CreateTable
CREATE TABLE "inventory_purchase_requisitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "requested_by_employee_id" TEXT NOT NULL,
    "status" "InventoryRequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "reviewed_by_employee_id" TEXT,
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "inventory_purchase_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_purchase_requisition_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "requisition_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "estimated_unit_cost" DECIMAL(65,30),

    CONSTRAINT "inventory_purchase_requisition_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_purchase_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "requisition_id" TEXT,
    "po_number" TEXT NOT NULL,
    "status" "InventoryPurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "inventory_purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_purchase_order_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit_cost" DECIMAL(65,30) NOT NULL,
    "quantity_received" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "inventory_purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_stock_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "requested_by_employee_id" TEXT NOT NULL,
    "status" "InventoryStockRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "reviewed_by_employee_id" TEXT,
    "review_note" TEXT,
    "fulfilled_ledger_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_stock_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_assets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "asset_tag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "serial_number" TEXT,
    "purchase_date" TIMESTAMP(3),
    "purchase_price" DECIMAL(65,30),
    "status" "CompanyAssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "assigned_employee_id" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "company_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_asset_assignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returned_at" TIMESTAMP(3),
    "assign_note" TEXT,
    "return_note" TEXT,
    "assigned_by_user_id" TEXT,

    CONSTRAINT "company_asset_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_purchase_requisitions_tenant_id_idx" ON "inventory_purchase_requisitions"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_purchase_requisitions_warehouse_id_idx" ON "inventory_purchase_requisitions"("warehouse_id");

-- CreateIndex
CREATE INDEX "inventory_purchase_requisitions_requested_by_employee_id_idx" ON "inventory_purchase_requisitions"("requested_by_employee_id");

-- CreateIndex
CREATE INDEX "inventory_purchase_requisition_lines_tenant_id_idx" ON "inventory_purchase_requisition_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_purchase_requisition_lines_requisition_id_idx" ON "inventory_purchase_requisition_lines"("requisition_id");

-- CreateIndex
CREATE INDEX "inventory_purchase_orders_tenant_id_idx" ON "inventory_purchase_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_purchase_orders_warehouse_id_idx" ON "inventory_purchase_orders"("warehouse_id");

-- CreateIndex
CREATE INDEX "inventory_purchase_orders_vendor_id_idx" ON "inventory_purchase_orders"("vendor_id");

-- CreateIndex
CREATE INDEX "inventory_purchase_orders_requisition_id_idx" ON "inventory_purchase_orders"("requisition_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_purchase_orders_tenant_id_po_number_key" ON "inventory_purchase_orders"("tenant_id", "po_number");

-- CreateIndex
CREATE INDEX "inventory_purchase_order_lines_tenant_id_idx" ON "inventory_purchase_order_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_purchase_order_lines_purchase_order_id_idx" ON "inventory_purchase_order_lines"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stock_requests_fulfilled_ledger_entry_id_key" ON "inventory_stock_requests"("fulfilled_ledger_entry_id");

-- CreateIndex
CREATE INDEX "inventory_stock_requests_tenant_id_idx" ON "inventory_stock_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_stock_requests_requested_by_employee_id_idx" ON "inventory_stock_requests"("requested_by_employee_id");

-- CreateIndex
CREATE INDEX "inventory_stock_requests_warehouse_id_idx" ON "inventory_stock_requests"("warehouse_id");

-- CreateIndex
CREATE INDEX "company_assets_tenant_id_idx" ON "company_assets"("tenant_id");

-- CreateIndex
CREATE INDEX "company_assets_organization_id_idx" ON "company_assets"("organization_id");

-- CreateIndex
CREATE INDEX "company_assets_assigned_employee_id_idx" ON "company_assets"("assigned_employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_assets_tenant_id_asset_tag_key" ON "company_assets"("tenant_id", "asset_tag");

-- CreateIndex
CREATE INDEX "company_asset_assignments_tenant_id_idx" ON "company_asset_assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "company_asset_assignments_asset_id_idx" ON "company_asset_assignments"("asset_id");

-- CreateIndex
CREATE INDEX "company_asset_assignments_employee_id_idx" ON "company_asset_assignments"("employee_id");

-- CreateIndex
CREATE INDEX "inventory_stock_ledger_purchase_order_line_id_idx" ON "inventory_stock_ledger"("purchase_order_line_id");

-- AddForeignKey
ALTER TABLE "inventory_stock_ledger" ADD CONSTRAINT "inventory_stock_ledger_purchase_order_line_id_fkey" FOREIGN KEY ("purchase_order_line_id") REFERENCES "inventory_purchase_order_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_requisitions" ADD CONSTRAINT "inventory_purchase_requisitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_requisitions" ADD CONSTRAINT "inventory_purchase_requisitions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_requisitions" ADD CONSTRAINT "inventory_purchase_requisitions_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "inventory_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_requisitions" ADD CONSTRAINT "inventory_purchase_requisitions_requested_by_employee_id_fkey" FOREIGN KEY ("requested_by_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_requisitions" ADD CONSTRAINT "inventory_purchase_requisitions_reviewed_by_employee_id_fkey" FOREIGN KEY ("reviewed_by_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_requisition_lines" ADD CONSTRAINT "inventory_purchase_requisition_lines_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_requisition_lines" ADD CONSTRAINT "inventory_purchase_requisition_lines_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "inventory_purchase_requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_requisition_lines" ADD CONSTRAINT "inventory_purchase_requisition_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_orders" ADD CONSTRAINT "inventory_purchase_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_orders" ADD CONSTRAINT "inventory_purchase_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_orders" ADD CONSTRAINT "inventory_purchase_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "inventory_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_orders" ADD CONSTRAINT "inventory_purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_orders" ADD CONSTRAINT "inventory_purchase_orders_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "inventory_purchase_requisitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_order_lines" ADD CONSTRAINT "inventory_purchase_order_lines_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_order_lines" ADD CONSTRAINT "inventory_purchase_order_lines_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "inventory_purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_purchase_order_lines" ADD CONSTRAINT "inventory_purchase_order_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_requests" ADD CONSTRAINT "inventory_stock_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_requests" ADD CONSTRAINT "inventory_stock_requests_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "inventory_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_requests" ADD CONSTRAINT "inventory_stock_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_requests" ADD CONSTRAINT "inventory_stock_requests_requested_by_employee_id_fkey" FOREIGN KEY ("requested_by_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_requests" ADD CONSTRAINT "inventory_stock_requests_reviewed_by_employee_id_fkey" FOREIGN KEY ("reviewed_by_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_requests" ADD CONSTRAINT "inventory_stock_requests_fulfilled_ledger_entry_id_fkey" FOREIGN KEY ("fulfilled_ledger_entry_id") REFERENCES "inventory_stock_ledger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_assets" ADD CONSTRAINT "company_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_assets" ADD CONSTRAINT "company_assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_assets" ADD CONSTRAINT "company_assets_assigned_employee_id_fkey" FOREIGN KEY ("assigned_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_asset_assignments" ADD CONSTRAINT "company_asset_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_asset_assignments" ADD CONSTRAINT "company_asset_assignments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "company_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_asset_assignments" ADD CONSTRAINT "company_asset_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity
ALTER TABLE "inventory_purchase_requisitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_purchase_requisitions" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_purchase_requisitions"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "inventory_purchase_requisition_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_purchase_requisition_lines" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_purchase_requisition_lines"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "inventory_purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_purchase_orders" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_purchase_orders"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "inventory_purchase_order_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_purchase_order_lines" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_purchase_order_lines"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "inventory_stock_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_stock_requests" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_stock_requests"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "company_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company_assets" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "company_assets"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "company_asset_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company_asset_assignments" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "company_asset_assignments"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
