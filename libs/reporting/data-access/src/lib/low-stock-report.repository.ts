import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface LowStockParams {
  warehouseId?: string;
}

export interface LowStockRow {
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  minStockLevel: number;
  shortfall: number;
}

/**
 * Reads inventory_stock_balances/inventory_products directly through
 * PrismaService - scope:reporting cannot depend on
 * @africahr/inventory-data-access (Nx module boundary). Products with no
 * minStockLevel set have no threshold to compare against, so they never
 * appear here - this is not the same as "zero stock is fine", just that no
 * one has configured a reorder point for that product yet.
 */
@Injectable()
export class LowStockReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listLowStock(tenantId: string, params: LowStockParams = {}): Promise<LowStockRow[]> {
    const balances = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryStockBalance.findMany({
        where: {
          tenantId,
          warehouseId: params.warehouseId,
          product: { minStockLevel: { not: null } },
        },
        include: {
          warehouse: { select: { name: true } },
          product: { select: { sku: true, name: true, minStockLevel: true } },
        },
      }),
    );

    const rows: LowStockRow[] = [];
    for (const balance of balances) {
      const minStockLevel = balance.product.minStockLevel?.toNumber() ?? 0;
      const quantity = balance.quantity.toNumber();
      if (quantity < minStockLevel) {
        rows.push({
          warehouseId: balance.warehouseId,
          warehouseName: balance.warehouse.name,
          productId: balance.productId,
          productSku: balance.product.sku,
          productName: balance.product.name,
          quantity,
          minStockLevel,
          shortfall: minStockLevel - quantity,
        });
      }
    }
    return rows.sort((a, b) => b.shortfall - a.shortfall);
  }
}
