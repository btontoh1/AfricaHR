import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface ProcurementSpendParams {
  vendorId?: string;
  from?: Date;
  to?: Date;
}

export interface ProcurementSpendLine {
  vendorId: string;
  vendorName: string;
  orderDate: Date;
  lineTotal: number;
  purchaseOrderId: string;
}

/**
 * Reads inventory_purchase_orders/_lines and vendors directly through
 * PrismaService - scope:reporting cannot depend on
 * @africahr/inventory-data-access or @africahr/ap-data-access (Nx module
 * boundary), same cross-bounded-context read pattern as
 * HeadcountReportRepository. Only orders that represent committed spend
 * (SENT/PARTIALLY_RECEIVED/RECEIVED) are included - DRAFT never left the
 * requester's desk, CANCELLED never bought anything.
 */
@Injectable()
export class ProcurementSpendReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listSpendLines(tenantId: string, params: ProcurementSpendParams = {}): Promise<ProcurementSpendLine[]> {
    const orders = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryPurchaseOrder.findMany({
        where: {
          tenantId,
          vendorId: params.vendorId,
          status: { in: ['SENT', 'PARTIALLY_RECEIVED', 'RECEIVED'] },
          orderDate: { gte: params.from, lte: params.to },
        },
        include: {
          vendor: { select: { name: true } },
          lines: { select: { quantity: true, unitCost: true } },
        },
      }),
    );

    const result: ProcurementSpendLine[] = [];
    for (const order of orders) {
      const lineTotal = order.lines.reduce(
        (sum, line) => sum + line.quantity.toNumber() * line.unitCost.toNumber(),
        0,
      );
      result.push({
        vendorId: order.vendorId,
        vendorName: order.vendor.name,
        orderDate: order.orderDate,
        lineTotal,
        purchaseOrderId: order.id,
      });
    }
    return result;
  }
}
