import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface InventoryValuationParams {
  warehouseId?: string;
}

export interface InventoryValuationRow {
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
}

/**
 * Reads inventory_* tables directly through PrismaService - scope:reporting
 * cannot depend on @africahr/inventory-data-access (Nx module boundary),
 * same cross-bounded-context read pattern as HeadcountReportRepository
 * reading "employees".
 */
@Injectable()
export class InventoryValuationReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listValuation(tenantId: string, params: InventoryValuationParams = {}): Promise<InventoryValuationRow[]> {
    const balances = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryStockBalance.findMany({
        where: {
          tenantId,
          warehouseId: params.warehouseId,
          quantity: { gt: 0 },
        },
        include: {
          warehouse: { select: { name: true } },
          product: { select: { sku: true, name: true, tracksBatch: true, purchasePrice: true } },
        },
      }),
    );

    const rows: InventoryValuationRow[] = [];
    for (const balance of balances) {
      const quantity = balance.quantity.toNumber();
      const unitCost = await this.resolveUnitCost(tenantId, balance);
      rows.push({
        warehouseId: balance.warehouseId,
        warehouseName: balance.warehouse.name,
        productId: balance.productId,
        productSku: balance.product.sku,
        productName: balance.product.name,
        quantity,
        unitCost,
        totalValue: quantity * unitCost,
      });
    }
    return rows;
  }

  /**
   * For a batch-tracked product: weighted-average unitCost across its
   * remaining batches at this warehouse. Otherwise: the most recent
   * GOODS_RECEIVED ledger entry's unitCost for this product+warehouse.
   * Falls back to the product's own purchasePrice when neither yields a
   * cost (e.g. stock seeded with no cost recorded) - a guaranteed,
   * non-null field, so this report always produces a value.
   */
  private async resolveUnitCost(
    tenantId: string,
    balance: {
      warehouseId: string;
      productId: string;
      product: { tracksBatch: boolean; purchasePrice: { toNumber(): number } };
    },
  ): Promise<number> {
    if (balance.product.tracksBatch) {
      const batches = await this.prisma.withTenantContext(tenantId, (tx) =>
        tx.inventoryStockBatch.findMany({
          where: {
            tenantId,
            productId: balance.productId,
            warehouseId: balance.warehouseId,
            remainingQuantity: { gt: 0 },
            unitCost: { not: null },
          },
          select: { unitCost: true, remainingQuantity: true },
        }),
      );
      const totalRemaining = batches.reduce((sum, batch) => sum + batch.remainingQuantity.toNumber(), 0);
      if (totalRemaining > 0) {
        const weightedCost = batches.reduce(
          (sum, batch) => sum + (batch.unitCost?.toNumber() ?? 0) * batch.remainingQuantity.toNumber(),
          0,
        );
        return weightedCost / totalRemaining;
      }
    } else {
      const lastReceipt = await this.prisma.withTenantContext(tenantId, (tx) =>
        tx.inventoryStockLedgerEntry.findFirst({
          where: {
            tenantId,
            productId: balance.productId,
            warehouseId: balance.warehouseId,
            transactionType: 'GOODS_RECEIVED',
            unitCost: { not: null },
          },
          orderBy: { createdAt: 'desc' },
          select: { unitCost: true },
        }),
      );
      if (lastReceipt?.unitCost != null) {
        return lastReceipt.unitCost.toNumber();
      }
    }
    return balance.product.purchasePrice.toNumber();
  }
}
