import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryStockLedgerEntry, InventoryStockTransactionType, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { ScopedClient } from './tenant-scoped';

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
}

/** Thrown when posting a net-negative movement would take a warehouse/product's balance below zero - negative inventory is never allowed by default (see InventoryStockLedgerEntry's doc comment). */
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

        await this.applyBalanceDelta(tx, tenantId, input.warehouseId, input.productId, net);

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
   * raw Prisma error).
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
}
