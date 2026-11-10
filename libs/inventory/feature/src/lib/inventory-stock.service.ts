import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryStockLedgerEntry, InventoryStockTransactionType } from '@prisma/client';
import {
  InventoryProductRepository,
  InventoryPurchaseOrderRepository,
  InventoryStockBatchRepository,
  InventoryStockRepository,
  StockBalance,
  StockBatchWithStatus,
} from '@africahr/inventory-data-access';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';
import { IssueGoodsDto } from './dto/issue-goods.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';

/**
 * Emitted after a receipt posts against a purchase-order line - consumed by
 * ap-feature's InventoryReceiptBillListener to auto-draft a VendorBill.
 * Lives as a plain event rather than a direct call because scope:inventory
 * is not allowed to depend on scope:ap (see eslint.config.mjs's
 * depConstraints), same decoupling reasoning as ap-feature's own
 * VENDOR_BILL_STATUS_CHANGED_EVENT. The event name and payload shape below
 * must match InventoryReceiptBillListener's locally-declared copy literally.
 */
export const INVENTORY_GOODS_RECEIVED_EVENT = 'inventory.purchase_order.goods_received';

export interface InventoryGoodsReceivedEventPayload {
  tenantId: string;
  organizationId: string;
  purchaseOrderId: string;
  poNumber: string;
  vendorId: string;
  warehouseId: string;
  productId: string;
  /** e.g. "SKU-001 - Widget", for a readable bill line description. */
  productName: string;
  /** The quantity received in THIS receiving call, not the PO line's cumulative total. */
  quantity: number;
  /** dto.unitCost if provided, else the PO line's own unitCost. */
  unitCost: number;
  ledgerEntryId: string;
  /** ISO timestamp of the receipt. */
  receivedAt: string;
}

@Injectable()
export class InventoryStockService {
  private readonly logger = new Logger(InventoryStockService.name);

  constructor(
    private readonly stock: InventoryStockRepository,
    private readonly batches: InventoryStockBatchRepository,
    private readonly products: InventoryProductRepository,
    private readonly purchaseOrders: InventoryPurchaseOrderRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async receiveGoods(tenantId: string, dto: ReceiveGoodsDto, actorId?: string): Promise<InventoryStockLedgerEntry> {
    const product = await this.requireProduct(tenantId, dto.productId);

    let entry: InventoryStockLedgerEntry;
    if (product.tracksBatch) {
      if (!dto.batchNumber || !dto.expiryDate) {
        throw new BadRequestException(
          `Product "${product.sku}" tracks batches - batchNumber and expiryDate are required`,
        );
      }
      entry = await this.stock.postEntry(tenantId, {
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
    } else {
      entry = await this.stock.postEntry(tenantId, {
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

    if (dto.purchaseOrderLineId) {
      await this.emitGoodsReceivedForPurchaseOrder(tenantId, dto, product, entry);
    }

    return entry;
  }

  /**
   * Best-effort - a failure here must never undo or surface as an error
   * against the stock receipt, which has already committed. See
   * InventoryReceiptBillListener for the consumer.
   */
  private async emitGoodsReceivedForPurchaseOrder(
    tenantId: string,
    dto: ReceiveGoodsDto,
    product: { sku: string; name: string },
    entry: InventoryStockLedgerEntry,
  ): Promise<void> {
    try {
      const line = await this.purchaseOrders.findLineById(tenantId, dto.purchaseOrderLineId as string);
      if (!line) {
        return;
      }
      const purchaseOrder = await this.purchaseOrders.findById(tenantId, line.purchaseOrderId);
      if (!purchaseOrder) {
        return;
      }
      const payload: InventoryGoodsReceivedEventPayload = {
        tenantId,
        organizationId: purchaseOrder.organizationId,
        purchaseOrderId: purchaseOrder.id,
        poNumber: purchaseOrder.poNumber,
        vendorId: purchaseOrder.vendorId,
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        productName: `${product.sku} - ${product.name}`,
        quantity: dto.quantity,
        unitCost: dto.unitCost ?? Number(line.unitCost),
        ledgerEntryId: entry.id,
        receivedAt: new Date().toISOString(),
      };
      this.eventEmitter.emit(INVENTORY_GOODS_RECEIVED_EVENT, payload);
    } catch (error) {
      this.logger.error(
        `Failed to emit ${INVENTORY_GOODS_RECEIVED_EVENT} for purchase order line "${dto.purchaseOrderLineId}"`,
        error instanceof Error ? error.stack : error,
      );
    }
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
