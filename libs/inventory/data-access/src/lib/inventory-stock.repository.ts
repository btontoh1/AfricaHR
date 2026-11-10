import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryStockLedgerEntry, InventoryStockTransactionType, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { allocateFefo, InsufficientBatchStockError } from '@africahr/inventory-domain';
import { ScopedClient } from './tenant-scoped';

export interface ReceiveBatchInput {
  batchNumber: string;
  expiryDate: Date;
  manufactureDate?: Date;
}

export interface PostStockEntryInput {
  warehouseId: string;
  productId: string;
  transactionType: InventoryStockTransactionType;
  quantityIn?: number;
  quantityOut?: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  note?: string;
  actorUserId?: string;
  /** Set when this leg moves a specific, already-known batch (a FEFO issue/transfer leg, or a reversal of one). Mutually exclusive with receiveBatch. */
  batchId?: string;
  /** Set when this leg receives into a batch that may not exist yet (a GRN, or the inbound leg of a batch-tracked transfer) - the batch is found-or-created and batchId resolved from it. Mutually exclusive with batchId. */
  receiveBatch?: ReceiveBatchInput;
}

/** Thrown when posting a net-negative movement would take a warehouse/product's balance below zero - negative inventory is never allowed by default (see InventoryStockLedgerEntry's doc comment). Also reused for a batch-level shortfall (see applyBatchDelta) - same shape, so callers handle both the same way. */
export class InsufficientStockError extends Error {
  constructor(
    public readonly warehouseId: string,
    public readonly productId: string,
    public readonly available: number,
    public readonly requested: number,
  ) {
    super('Insufficient stock to complete this transaction');
  }
}

export interface StockBalance {
  warehouseId: string;
  productId: string;
  quantity: number;
}

export interface FefoIssueInput {
  warehouseId: string;
  productId: string;
  quantity: number;
  transactionType: InventoryStockTransactionType;
  referenceType?: string;
  referenceId?: string;
  note?: string;
  actorUserId?: string;
}

export interface FefoTransferInput {
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  quantity: number;
  note?: string;
  actorUserId?: string;
}

@Injectable()
export class InventoryStockRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Posts one immutable ledger entry and atomically applies its net effect
   * to the materialized balance, inside a single withTenantContext
   * transaction - the ledger and the balance can never drift apart, and two
   * concurrent issues against the same product/warehouse can't both
   * succeed past zero. The negative-stock guard is a conditional
   * updateMany's own WHERE clause (same pattern as
   * PayrollWalletRepository.reserveForDisbursement), not a read-then-check
   * in application code, which would race under concurrent load.
   */
  async postEntry(tenantId: string, input: PostStockEntryInput): Promise<InventoryStockLedgerEntry> {
    const [entry] = await this.postEntries(tenantId, [input]);
    return entry;
  }

  /**
   * Posts several ledger entries as one all-or-nothing unit, inside a
   * single withTenantContext transaction - used for a stock transfer
   * (TRANSFER_OUT at the source warehouse, TRANSFER_IN at the destination),
   * where posting only one side would make stock vanish or appear from
   * nowhere. Entries are applied in array order; if a later one fails
   * (e.g. insufficient stock), every balance change in this call - earlier
   * entries included - rolls back with it.
   */
  async postEntries(tenantId: string, inputs: PostStockEntryInput[]): Promise<InventoryStockLedgerEntry[]> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      const entries: InventoryStockLedgerEntry[] = [];
      for (const input of inputs) {
        const quantityIn = input.quantityIn ?? 0;
        const quantityOut = input.quantityOut ?? 0;
        const net = quantityIn - quantityOut;

        let batchId = input.batchId;
        if (input.receiveBatch) {
          batchId = await this.upsertBatchForReceipt(
            tx,
            tenantId,
            input.productId,
            input.warehouseId,
            input.receiveBatch,
            quantityIn,
            input.unitCost,
          );
        }

        await this.applyBalanceDelta(tx, tenantId, input.warehouseId, input.productId, net);
        if (batchId) {
          await this.applyBatchDelta(tx, tenantId, input.warehouseId, input.productId, batchId, net);
        }

        entries.push(
          await tx.inventoryStockLedgerEntry.create({
            data: {
              tenantId,
              warehouseId: input.warehouseId,
              productId: input.productId,
              transactionType: input.transactionType,
              quantityIn,
              quantityOut,
              unitCost: input.unitCost,
              referenceType: input.referenceType,
              referenceId: input.referenceId,
              batchId,
              note: input.note,
              actorUserId: input.actorUserId,
            },
          }),
        );
      }
      return entries;
    });
  }

  /**
   * Issues (or transfers-out) a batch-tracked product without the caller
   * picking a batch: allocates First-Expired-First-Out across the
   * warehouse's non-expired batches (see allocateFefo) and posts one
   * ledger leg per batch drawn from, each referencing that batch. A
   * request spanning three batches posts three entries, atomically - same
   * all-or-nothing guarantee as postEntries.
   */
  async issueFefo(tenantId: string, input: FefoIssueInput): Promise<InventoryStockLedgerEntry[]> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      const allocations = await this.allocateFefoForIssue(
        tx,
        tenantId,
        input.warehouseId,
        input.productId,
        input.quantity,
      );

      const entries: InventoryStockLedgerEntry[] = [];
      for (const allocation of allocations) {
        await this.applyBalanceDelta(tx, tenantId, input.warehouseId, input.productId, -allocation.quantity);
        await this.applyBatchDelta(
          tx,
          tenantId,
          input.warehouseId,
          input.productId,
          allocation.batchId,
          -allocation.quantity,
        );
        entries.push(
          await tx.inventoryStockLedgerEntry.create({
            data: {
              tenantId,
              warehouseId: input.warehouseId,
              productId: input.productId,
              transactionType: input.transactionType,
              quantityOut: allocation.quantity,
              batchId: allocation.batchId,
              referenceType: input.referenceType,
              referenceId: input.referenceId,
              note: input.note,
              actorUserId: input.actorUserId,
            },
          }),
        );
      }
      return entries;
    });
  }

  /**
   * The batch-tracked counterpart to InventoryStockService.transferStock:
   * allocates FEFO at the source warehouse, then for each batch drawn from
   * posts a TRANSFER_OUT leg there and a TRANSFER_IN leg at the
   * destination into a batch carrying the same batch number/expiry
   * (found-or-created there, exactly like a receipt) - the lot's identity
   * and expiry follow it to the new warehouse. All legs share one
   * referenceId and post as one all-or-nothing unit.
   */
  async transferFefo(tenantId: string, input: FefoTransferInput): Promise<InventoryStockLedgerEntry[]> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      const allocations = await this.allocateFefoForIssue(
        tx,
        tenantId,
        input.fromWarehouseId,
        input.productId,
        input.quantity,
      );
      const referenceId = randomUUID();

      const entries: InventoryStockLedgerEntry[] = [];
      for (const allocation of allocations) {
        await this.applyBalanceDelta(tx, tenantId, input.fromWarehouseId, input.productId, -allocation.quantity);
        await this.applyBatchDelta(
          tx,
          tenantId,
          input.fromWarehouseId,
          input.productId,
          allocation.batchId,
          -allocation.quantity,
        );
        entries.push(
          await tx.inventoryStockLedgerEntry.create({
            data: {
              tenantId,
              warehouseId: input.fromWarehouseId,
              productId: input.productId,
              transactionType: InventoryStockTransactionType.TRANSFER_OUT,
              quantityOut: allocation.quantity,
              batchId: allocation.batchId,
              referenceType: 'StockTransfer',
              referenceId,
              note: input.note,
              actorUserId: input.actorUserId,
            },
          }),
        );

        const destBatchId = await this.upsertBatchForReceipt(
          tx,
          tenantId,
          input.productId,
          input.toWarehouseId,
          {
            batchNumber: allocation.batchNumber,
            expiryDate: allocation.expiryDate,
            manufactureDate: allocation.manufactureDate ?? undefined,
          },
          allocation.quantity,
          allocation.unitCost ? Number(allocation.unitCost) : undefined,
        );
        await this.applyBalanceDelta(tx, tenantId, input.toWarehouseId, input.productId, allocation.quantity);
        await this.applyBatchDelta(tx, tenantId, input.toWarehouseId, input.productId, destBatchId, allocation.quantity);
        entries.push(
          await tx.inventoryStockLedgerEntry.create({
            data: {
              tenantId,
              warehouseId: input.toWarehouseId,
              productId: input.productId,
              transactionType: InventoryStockTransactionType.TRANSFER_IN,
              quantityIn: allocation.quantity,
              batchId: destBatchId,
              referenceType: 'StockTransfer',
              referenceId,
              note: input.note,
              actorUserId: input.actorUserId,
            },
          }),
        );
      }
      return entries;
    });
  }

  /**
   * The only sanctioned way to correct a posted entry: inserts a new entry
   * with quantityIn/quantityOut swapped, linked via reversalOfId (unique,
   * so an entry can only ever be reversed once - a second attempt hits that
   * DB constraint, caught below and reported as a clear 409 rather than a
   * raw Prisma error). Carries the original's batchId through unchanged -
   * reversing one leg of a FEFO issue/transfer only ever touches the one
   * batch that leg drew from.
   */
  async reverseEntry(tenantId: string, entryId: string, actorUserId?: string, note?: string): Promise<InventoryStockLedgerEntry> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      const original = await tx.inventoryStockLedgerEntry.findFirst({ where: { id: entryId, tenantId } });
      if (!original) {
        throw new NotFoundException(`Stock ledger entry "${entryId}" not found`);
      }

      const reversedQuantityIn = Number(original.quantityOut);
      const reversedQuantityOut = Number(original.quantityIn);
      const net = reversedQuantityIn - reversedQuantityOut;

      await this.applyBalanceDelta(tx, tenantId, original.warehouseId, original.productId, net);
      if (original.batchId) {
        await this.applyBatchDelta(tx, tenantId, original.warehouseId, original.productId, original.batchId, net);
      }

      try {
        return await tx.inventoryStockLedgerEntry.create({
          data: {
            tenantId,
            warehouseId: original.warehouseId,
            productId: original.productId,
            transactionType: InventoryStockTransactionType.REVERSAL,
            quantityIn: reversedQuantityIn,
            quantityOut: reversedQuantityOut,
            unitCost: original.unitCost,
            referenceType: original.referenceType,
            referenceId: original.referenceId,
            batchId: original.batchId,
            reversalOfId: original.id,
            note,
            actorUserId,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException(`Stock ledger entry "${entryId}" has already been reversed`);
        }
        throw error;
      }
    });
  }

  getBalance(tenantId: string, warehouseId: string, productId: string): Promise<number> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      const balance = await tx.inventoryStockBalance.findUnique({
        where: { tenantId_warehouseId_productId: { tenantId, warehouseId, productId } },
      });
      return balance ? Number(balance.quantity) : 0;
    });
  }

  listBalances(tenantId: string, warehouseId?: string): Promise<StockBalance[]> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      const balances = await tx.inventoryStockBalance.findMany({ where: { tenantId, warehouseId } });
      return balances.map((balance) => ({
        warehouseId: balance.warehouseId,
        productId: balance.productId,
        quantity: Number(balance.quantity),
      }));
    });
  }

  listLedgerEntries(
    tenantId: string,
    filters: { warehouseId?: string; productId?: string } = {},
  ): Promise<InventoryStockLedgerEntry[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryStockLedgerEntry.findMany({
        where: { tenantId, warehouseId: filters.warehouseId, productId: filters.productId },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  /**
   * Finds-or-creates the batch a receipt (a GRN, or a transfer's inbound
   * leg) lands in, bumping its all-time receivedQuantity - remainingQuantity
   * is deliberately left untouched here and handled by the caller's own
   * applyBatchDelta(+quantityIn) immediately after, the same generic path
   * every other entry type goes through, so the two can never drift apart.
   * A batch number re-received with a different expiry date is rejected:
   * either it's a different lot that was mis-keyed with an existing
   * number, or the expiry was mistyped the first time - either way,
   * silently accepting it would corrupt FEFO ordering for stock already in
   * the ledger.
   */
  private async upsertBatchForReceipt(
    tx: ScopedClient,
    tenantId: string,
    productId: string,
    warehouseId: string,
    receiveBatch: ReceiveBatchInput,
    quantity: number,
    unitCost?: number,
  ): Promise<string> {
    const existing = await tx.inventoryStockBatch.findUnique({
      where: {
        tenantId_productId_warehouseId_batchNumber: {
          tenantId,
          productId,
          warehouseId,
          batchNumber: receiveBatch.batchNumber,
        },
      },
    });

    if (existing) {
      if (existing.expiryDate.getTime() !== receiveBatch.expiryDate.getTime()) {
        throw new ConflictException(
          `Batch "${receiveBatch.batchNumber}" already exists for this product/warehouse with a different expiry date`,
        );
      }
      await tx.inventoryStockBatch.update({
        where: { id: existing.id },
        data: { receivedQuantity: { increment: quantity }, unitCost: unitCost ?? existing.unitCost },
      });
      return existing.id;
    }

    const created = await tx.inventoryStockBatch.create({
      data: {
        tenantId,
        productId,
        warehouseId,
        batchNumber: receiveBatch.batchNumber,
        expiryDate: receiveBatch.expiryDate,
        manufactureDate: receiveBatch.manufactureDate,
        receivedQuantity: quantity,
        remainingQuantity: 0,
        unitCost,
      },
    });
    return created.id;
  }

  /**
   * Queries the warehouse's batches for this product and hands them to the
   * domain's allocateFefo, translating its InsufficientBatchStockError into
   * this repository's own InsufficientStockError so callers only ever need
   * to handle one shortfall type regardless of whether a product tracks
   * batches. Returns each allocation enriched with its batch's metadata
   * (batchNumber/expiryDate/manufactureDate/unitCost), since transferFefo
   * needs it to open the matching batch at the destination warehouse.
   */
  private async allocateFefoForIssue(
    tx: ScopedClient,
    tenantId: string,
    warehouseId: string,
    productId: string,
    quantity: number,
  ): Promise<
    Array<{
      batchId: string;
      quantity: number;
      batchNumber: string;
      expiryDate: Date;
      manufactureDate: Date | null;
      unitCost: Prisma.Decimal | null;
    }>
  > {
    const batches = await tx.inventoryStockBatch.findMany({
      where: { tenantId, productId, warehouseId, remainingQuantity: { gt: 0 } },
      orderBy: { expiryDate: 'asc' },
    });

    let plan;
    try {
      plan = allocateFefo(
        batches.map((batch) => ({
          batchId: batch.id,
          expiryDate: batch.expiryDate,
          remainingQuantity: Number(batch.remainingQuantity),
        })),
        quantity,
        new Date(),
      );
    } catch (error) {
      if (error instanceof InsufficientBatchStockError) {
        throw new InsufficientStockError(warehouseId, productId, error.available, error.requested);
      }
      throw error;
    }

    const byId = new Map(batches.map((batch) => [batch.id, batch]));
    return plan.map((allocation) => {
      const batch = byId.get(allocation.batchId);
      if (!batch) {
        throw new Error(`Allocated batch "${allocation.batchId}" vanished mid-transaction`);
      }
      return {
        batchId: allocation.batchId,
        quantity: allocation.quantity,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        manufactureDate: batch.manufactureDate,
        unitCost: batch.unitCost,
      };
    });
  }

  private async applyBalanceDelta(
    tx: ScopedClient,
    tenantId: string,
    warehouseId: string,
    productId: string,
    net: number,
  ): Promise<void> {
    if (net < 0) {
      const result = await tx.inventoryStockBalance.updateMany({
        where: { tenantId, warehouseId, productId, quantity: { gte: -net } },
        data: { quantity: { increment: net } },
      });
      if (result.count === 0) {
        const existing = await tx.inventoryStockBalance.findUnique({
          where: { tenantId_warehouseId_productId: { tenantId, warehouseId, productId } },
        });
        throw new InsufficientStockError(warehouseId, productId, existing ? Number(existing.quantity) : 0, -net);
      }
    } else if (net > 0) {
      await tx.inventoryStockBalance.upsert({
        where: { tenantId_warehouseId_productId: { tenantId, warehouseId, productId } },
        create: { tenantId, warehouseId, productId, quantity: net },
        update: { quantity: { increment: net } },
      });
    }
  }

  /** The batch-level analogue of applyBalanceDelta, same guarded-decrement shape, scoped to one InventoryStockBatch's remainingQuantity instead of the aggregate warehouse+product balance. */
  private async applyBatchDelta(
    tx: ScopedClient,
    tenantId: string,
    warehouseId: string,
    productId: string,
    batchId: string,
    net: number,
  ): Promise<void> {
    if (net < 0) {
      const result = await tx.inventoryStockBatch.updateMany({
        where: { id: batchId, tenantId, remainingQuantity: { gte: -net } },
        data: { remainingQuantity: { increment: net } },
      });
      if (result.count === 0) {
        const existing = await tx.inventoryStockBatch.findUnique({ where: { id: batchId } });
        throw new InsufficientStockError(
          warehouseId,
          productId,
          existing ? Number(existing.remainingQuantity) : 0,
          -net,
        );
      }
    } else if (net > 0) {
      await tx.inventoryStockBatch.update({
        where: { id: batchId },
        data: { remainingQuantity: { increment: net } },
      });
    }
  }
}
