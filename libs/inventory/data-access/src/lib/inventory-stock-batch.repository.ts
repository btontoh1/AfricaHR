import { Injectable } from '@nestjs/common';
import { InventoryStockBatch } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { BatchExpiryStatus, getBatchExpiryStatus } from '@africahr/inventory-domain';

export interface StockBatchWithStatus {
  id: string;
  productId: string;
  warehouseId: string;
  batchNumber: string;
  expiryDate: Date;
  manufactureDate: Date | null;
  receivedQuantity: number;
  remainingQuantity: number;
  unitCost: number | null;
  status: BatchExpiryStatus;
  createdAt: Date;
}

/**
 * Read-only: every batch mutation (creating/replenishing on receipt,
 * decrementing on FEFO issue/transfer) has to happen inside the same
 * transaction as its ledger entry and the aggregate warehouse balance, so
 * that logic lives in InventoryStockRepository instead, which already owns
 * that transaction (see its private upsertBatchForReceipt/applyBatchDelta).
 * This repository only serves the read side - the Batches list/expiry
 * report, which isn't part of any posting transaction.
 */
@Injectable()
export class InventoryStockBatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(
    tenantId: string,
    filters: { productId?: string; warehouseId?: string } = {},
  ): Promise<StockBatchWithStatus[]> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      const batches = await tx.inventoryStockBatch.findMany({
        where: { tenantId, productId: filters.productId, warehouseId: filters.warehouseId },
        orderBy: { expiryDate: 'asc' },
      });
      const asOf = new Date();
      return batches.map((batch) => toStatusDto(batch, asOf));
    });
  }
}

function toStatusDto(batch: InventoryStockBatch, asOf: Date): StockBatchWithStatus {
  return {
    id: batch.id,
    productId: batch.productId,
    warehouseId: batch.warehouseId,
    batchNumber: batch.batchNumber,
    expiryDate: batch.expiryDate,
    manufactureDate: batch.manufactureDate,
    receivedQuantity: Number(batch.receivedQuantity),
    remainingQuantity: Number(batch.remainingQuantity),
    unitCost: batch.unitCost ? Number(batch.unitCost) : null,
    status: getBatchExpiryStatus(batch.expiryDate, asOf),
    createdAt: batch.createdAt,
  };
}
