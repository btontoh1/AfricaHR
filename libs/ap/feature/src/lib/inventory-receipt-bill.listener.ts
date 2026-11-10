import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AddOnModule } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { VendorBillService } from './vendor-bill.service';

/**
 * Consumes the event InventoryStockService emits whenever a receipt posts
 * against a purchase-order line - the event name and payload shape below
 * must match libs/inventory/feature/src/lib/inventory-stock.service.ts's
 * INVENTORY_GOODS_RECEIVED_EVENT literally. Lives here, not in
 * inventory-feature, because only ap-feature can call VendorBillService -
 * scope:inventory is not allowed to depend on scope:ap (see
 * eslint.config.mjs's depConstraints), same decoupling reasoning as
 * finance-feature's ApGlPostingListener.
 */
export interface InventoryGoodsReceivedEventPayload {
  tenantId: string;
  organizationId: string;
  purchaseOrderId: string;
  poNumber: string;
  vendorId: string;
  warehouseId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  ledgerEntryId: string;
  receivedAt: string;
}

const NET_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class InventoryReceiptBillListener {
  private readonly logger = new Logger(InventoryReceiptBillListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vendorBills: VendorBillService,
  ) {}

  @OnEvent('inventory.purchase_order.goods_received')
  async handleGoodsReceived(payload: InventoryGoodsReceivedEventPayload): Promise<void> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: payload.tenantId },
        select: { enabledAddOns: true },
      });
      // Finance isn't enabled for most tenants (opt-in, off by default) -
      // this is the expected, common case, not an error worth logging. Same
      // raw Tenant.enabledAddOns read AddOnGuard itself does - ap-feature
      // can depend on platform-database freely, it just can't depend on
      // finance-feature's own TenantAddOnRepository (scope:finance).
      if (!tenant || !tenant.enabledAddOns.includes(AddOnModule.FINANCE)) {
        return;
      }

      const receivedAt = new Date(payload.receivedAt);
      const dueDate = new Date(receivedAt.getTime() + NET_30_DAYS_MS);

      // Synthetic actor for this one system-triggered call. TENANT_ADMIN is
      // deliberate: assertOrganizationScope (which VendorBillService.create
      // calls) only restricts SystemRole.ORG_ADMIN, so this bypasses that
      // check cleanly without being a role that could do anything
      // unexpected elsewhere - it's never persisted as a session or reused.
      const systemActor: RequestUser = {
        sub: 'system:inventory-receipt',
        email: 'system@internal',
        role: SystemRole.TENANT_ADMIN,
        tenantId: payload.tenantId,
        organizationId: null,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60,
      };

      await this.vendorBills.create(
        payload.tenantId,
        {
          organizationId: payload.organizationId,
          vendorId: payload.vendorId,
          vendorReference: `PO ${payload.poNumber}`,
          billDate: payload.receivedAt.slice(0, 10),
          dueDate: dueDate.toISOString().slice(0, 10),
          // No currency field exists anywhere on Vendor/PurchaseOrder/Tenant
          // yet (v1 limitation) - this draft is editable by whoever reviews
          // it before approval.
          currency: 'GHS',
          notes: `Auto-drafted from goods received against purchase order ${payload.poNumber} (warehouse receipt).`,
          lineItems: [
            {
              description: payload.productName,
              quantity: payload.quantity,
              unitPrice: payload.unitCost,
            },
          ],
        },
        systemActor,
      );
    } catch (error) {
      // A failed auto-draft must never surface as an error to the user who
      // just received goods - the receipt itself has already committed.
      this.logger.error(
        `Failed to auto-draft a vendor bill for purchase order "${payload.poNumber}" goods receipt`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
