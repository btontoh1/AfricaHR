import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryStockLedgerEntry, InventoryStockTransactionType } from '@prisma/client';
import {
  InventoryProductRepository,
  InventoryStockBatchRepository,
  InventoryStockRepository,
  StockBalance,
  StockBatchWithStatus,
} from '@africahr/inventory-data-access';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';
import { IssueGoodsDto } from './dto/issue-goods.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';

@Injectable()
export class InventoryStockService {
  constructor(
    private readonly stock: InventoryStockRepository,
    private readonly batches: InventoryStockBatchRepository,
    private readonly products: InventoryProductRepository,
  ) {}

  async receiveGoods(tenantId: string, dto: ReceiveGoodsDto, actorId?: string): Promise<InventoryStockLedgerEntry> {
    const product = await this.requireProduct(tenantId, dto.productId);

    if (product.tracksBatch) {
      if (!dto.batchNumber || !dto.expiryDate) {
        throw new BadRequestException(
          `Product "${product.sku}" tracks batches - batchNumber and expiryDate are required`,
        );
      }
      return this.stock.postEntry(tenantId, {
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        transactionType: InventoryStockTransactionType.GOODS_RECEIVED,
        quantityIn: dto.quantity,
        unitCost: dto.unitCost,
        referenceId: dto.referenceId,
        note: dto.note,
        actorUserId: actorId,
        purchaseOrderLineId: dto.purchaseOrderLineId,
        receiveBatch: {
          batchNumber: dto.batchNumber,
          expiryDate: new Date(dto.expiryDate),
          manufactureDate: dto.manufactureDate ? new Date(dto.manufactureDate) : undefined,
        },
      });
    }

    return this.stock.postEntry(tenantId, {
      warehouseId: dto.warehouseId,
      productId: dto.productId,
      transactionType: InventoryStockTransactionType.GOODS_RECEIVED,
      quantityIn: dto.quantity,
      unitCost: dto.unitCost,
      referenceId: dto.referenceId,
      note: dto.note,
      actorUserId: actorId,
      purchaseOrderLineId: dto.purchaseOrderLineId,
    });
  }

  /**
   * Returns one entry for a plain product, or one per batch drawn from when
   * the product tracks batches and FEFO allocation spans more than one lot
   * - always an array, so callers don't need to know in advance which case
   * applies (same reasoning as transferStock already returning an array).
   * `reference` is for internal orchestration (e.g. InventoryStockRequestService
   * tagging every resulting entry back to the request that triggered the
   * issue) - not exposed on IssueGoodsDto, since end users never set it directly.
   */
  async issueGoods(
    tenantId: string,
    dto: IssueGoodsDto,
    actorId?: string,
    reference?: { referenceType: string; referenceId: string },
  ): Promise<InventoryStockLedgerEntry[]> {
    const product = await this.requireProduct(tenantId, dto.productId);

    if (product.tracksBatch) {
      return this.stock.issueFefo(tenantId, {
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        quantity: dto.quantity,
        transactionType: InventoryStockTransactionType.GOODS_ISSUED,
        note: dto.reason,
        actorUserId: actorId,
        referenceType: reference?.referenceType,
        referenceId: reference?.referenceId,
      });
    }

    const entry = await this.stock.postEntry(tenantId, {
      warehouseId: dto.warehouseId,
      productId: dto.productId,
      transactionType: InventoryStockTransactionType.GOODS_ISSUED,
      quantityOut: dto.quantity,
      note: dto.reason,
      actorUserId: actorId,
      referenceType: reference?.referenceType,
      referenceId: reference?.referenceId,
    });
    return [entry];
  }

  /**
   * Posts a TRANSFER_OUT at the source and a TRANSFER_IN at the
   * destination as one atomic unit - stock never spends time recorded as
   * "in transit" in Phase 1/2's model, it moves directly, since both sides
   * post together or not at all. For a tracksBatch product this is FEFO
   * allocation at the source (InventoryStockRepository.transferFefo),
   * producing one OUT/IN pair per batch drawn from rather than a single
   * pair; otherwise it's the plain two-entry transfer, sharing one
   * generated referenceId either way so the legs can be correlated in the
   * ledger.
   */
  async transferStock(tenantId: string, dto: TransferStockDto, actorId?: string): Promise<InventoryStockLedgerEntry[]> {
    const product = await this.requireProduct(tenantId, dto.productId);

    if (product.tracksBatch) {
      return this.stock.transferFefo(tenantId, {
        fromWarehouseId: dto.fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        productId: dto.productId,
        quantity: dto.quantity,
        note: dto.note,
        actorUserId: actorId,
      });
    }

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

  listBatches(
    tenantId: string,
    filters: { productId?: string; warehouseId?: string } = {},
  ): Promise<StockBatchWithStatus[]> {
    return this.batches.list(tenantId, filters);
  }

  private async requireProduct(tenantId: string, productId: string) {
    const product = await this.products.findById(tenantId, productId);
    if (!product) {
      throw new NotFoundException(`Product "${productId}" not found`);
    }
    return product;
  }
}
