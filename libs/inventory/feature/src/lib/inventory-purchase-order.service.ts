import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryPurchaseOrderStatus } from '@prisma/client';
import {
  InventoryPurchaseOrderRepository,
  InventoryVendorRepository,
  InventoryWarehouseRepository,
  PurchaseOrderWithLines,
} from '@africahr/inventory-data-access';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ConvertRequisitionToPoDto } from './dto/convert-requisition-to-po.dto';

@Injectable()
export class InventoryPurchaseOrderService {
  constructor(
    private readonly purchaseOrders: InventoryPurchaseOrderRepository,
    private readonly warehouses: InventoryWarehouseRepository,
    private readonly vendors: InventoryVendorRepository,
  ) {}

  async create(tenantId: string, dto: CreatePurchaseOrderDto, actorId?: string): Promise<PurchaseOrderWithLines> {
    const warehouse = await this.requireWarehouse(tenantId, dto.warehouseId);
    await this.requireVendor(tenantId, dto.vendorId);

    return this.purchaseOrders.create(tenantId, {
      organizationId: warehouse.organizationId,
      warehouseId: dto.warehouseId,
      vendorId: dto.vendorId,
      poNumber: dto.poNumber,
      expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
      notes: dto.notes,
      lines: dto.lines,
      createdBy: actorId,
    });
  }

  async createFromRequisition(
    tenantId: string,
    requisitionId: string,
    dto: ConvertRequisitionToPoDto,
    actorId?: string,
  ): Promise<PurchaseOrderWithLines> {
    await this.requireVendor(tenantId, dto.vendorId);
    return this.purchaseOrders.createFromRequisition(tenantId, requisitionId, {
      vendorId: dto.vendorId,
      poNumber: dto.poNumber,
      expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
      notes: dto.notes,
      createdBy: actorId,
    });
  }

  findById(tenantId: string, id: string): Promise<PurchaseOrderWithLines> {
    return this.requirePurchaseOrder(tenantId, id);
  }

  list(
    tenantId: string,
    filters: { warehouseId?: string; vendorId?: string; status?: InventoryPurchaseOrderStatus } = {},
  ): Promise<PurchaseOrderWithLines[]> {
    return this.purchaseOrders.list(tenantId, filters);
  }

  async send(tenantId: string, id: string, actorId?: string) {
    const po = await this.requirePurchaseOrder(tenantId, id);
    if (po.status !== 'DRAFT') {
      throw new ConflictException('Only a draft purchase order can be sent');
    }
    return this.purchaseOrders.updateStatus(tenantId, id, 'SENT', actorId);
  }

  async cancel(tenantId: string, id: string, actorId?: string) {
    const po = await this.requirePurchaseOrder(tenantId, id);
    if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
      throw new ConflictException(`A ${po.status.toLowerCase()} purchase order cannot be cancelled`);
    }
    return this.purchaseOrders.updateStatus(tenantId, id, 'CANCELLED', actorId);
  }

  private async requirePurchaseOrder(tenantId: string, id: string): Promise<PurchaseOrderWithLines> {
    const po = await this.purchaseOrders.findById(tenantId, id);
    if (!po) {
      throw new NotFoundException(`Purchase order "${id}" not found`);
    }
    return po;
  }

  private async requireWarehouse(tenantId: string, warehouseId: string) {
    const warehouse = await this.warehouses.findById(tenantId, warehouseId);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse "${warehouseId}" not found`);
    }
    return warehouse;
  }

  private async requireVendor(tenantId: string, vendorId: string) {
    const vendor = await this.vendors.findById(tenantId, vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor "${vendorId}" not found`);
    }
    return vendor;
  }
}
