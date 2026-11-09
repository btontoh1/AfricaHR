import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InventoryStockLedgerEntry, InventoryStockTransactionType } from '@prisma/client';
import { InventoryStockRepository, StockBalance } from '@africahr/inventory-data-access';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';
import { IssueGoodsDto } from './dto/issue-goods.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';

@Injectable()
export class InventoryStockService {
  constructor(private readonly stock: InventoryStockRepository) {}

  receiveGoods(tenantId: string, dto: ReceiveGoodsDto, actorId?: string): Promise<InventoryStockLedgerEntry> {
    return this.stock.postEntry(tenantId, {
      warehouseId: dto.warehouseId,
      productId: dto.productId,
      transactionType: InventoryStockTransactionType.GOODS_RECEIVED,
      quantityIn: dto.quantity,
      unitCost: dto.unitCost,
      referenceId: dto.referenceId,
      note: dto.note,
      actorUserId: actorId,
    });
  }

  issueGoods(tenantId: string, dto: IssueGoodsDto, actorId?: string): Promise<InventoryStockLedgerEntry> {
    return this.stock.postEntry(tenantId, {
      warehouseId: dto.warehouseId,
      productId: dto.productId,
      transactionType: InventoryStockTransactionType.GOODS_ISSUED,
      quantityOut: dto.quantity,
      note: dto.reason,
      actorUserId: actorId,
    });
  }

  /**
   * Posts a TRANSFER_OUT at the source and a TRANSFER_IN at the
   * destination as one atomic unit (see
   * InventoryStockRepository.postEntries) - stock never spends time
   * recorded as "in transit" in Phase 1's model, it moves directly, since
   * both sides post together or not at all. The two entries share a
   * generated referenceId so they can be correlated in the ledger.
   */
  async transferStock(tenantId: string, dto: TransferStockDto, actorId?: string): Promise<InventoryStockLedgerEntry[]> {
    const referenceId = randomUUID();
    return this.stock.postEntries(tenantId, [
      {
        warehouseId: dto.fromWarehouseId,
        productId: dto.productId,
        transactionType: InventoryStockTransactionType.TRANSFER_OUT,
        quantityOut: dto.quantity,
        referenceType: 'StockTransfer',
        referenceId,
        note: dto.note,
        actorUserId: actorId,
      },
      {
        warehouseId: dto.toWarehouseId,
        productId: dto.productId,
        transactionType: InventoryStockTransactionType.TRANSFER_IN,
        quantityIn: dto.quantity,
        referenceType: 'StockTransfer',
        referenceId,
        note: dto.note,
        actorUserId: actorId,
      },
    ]);
  }

  reverseEntry(tenantId: string, entryId: string, reason: string, actorId?: string): Promise<InventoryStockLedgerEntry> {
    return this.stock.reverseEntry(tenantId, entryId, actorId, reason);
  }

  getBalance(tenantId: string, warehouseId: string, productId: string): Promise<number> {
    return this.stock.getBalance(tenantId, warehouseId, productId);
  }

  listBalances(tenantId: string, warehouseId?: string): Promise<StockBalance[]> {
    return this.stock.listBalances(tenantId, warehouseId);
  }

  listLedgerEntries(
    tenantId: string,
    filters: { warehouseId?: string; productId?: string } = {},
  ): Promise<InventoryStockLedgerEntry[]> {
    return this.stock.listLedgerEntries(tenantId, filters);
  }
}
