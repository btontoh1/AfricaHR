import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryPurchaseOrder, InventoryPurchaseOrderLine, InventoryPurchaseOrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export type PurchaseOrderWithLines = InventoryPurchaseOrder & { lines: InventoryPurchaseOrderLine[] };

export interface CreatePurchaseOrderLineInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderInput {
  organizationId: string;
  warehouseId: string;
  vendorId: string;
  poNumber: string;
  expectedDate?: Date;
  notes?: string;
  lines: CreatePurchaseOrderLineInput[];
  createdBy?: string;
}

@Injectable()
export class InventoryPurchaseOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, input: CreatePurchaseOrderInput): Promise<PurchaseOrderWithLines> {
    try {
      return await this.prisma.withTenantContext(tenantId, (tx) =>
        tx.inventoryPurchaseOrder.create({
          data: {
            tenantId,
            organizationId: input.organizationId,
            warehouseId: input.warehouseId,
            vendorId: input.vendorId,
            poNumber: input.poNumber,
            expectedDate: input.expectedDate,
            notes: input.notes,
            createdBy: input.createdBy,
            updatedBy: input.createdBy,
            lines: {
              create: input.lines.map((line) => ({
                tenantId,
                productId: line.productId,
                quantity: line.quantity,
                unitCost: line.unitCost,
              })),
            },
          },
          include: { lines: true },
        }),
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`A purchase order numbered "${input.poNumber}" already exists`);
      }
      throw error;
    }
  }

  /**
   * Converts an APPROVED requisition into a new DRAFT purchase order,
   * copying its lines (estimatedUnitCost carries over as the PO line's
   * starting unitCost - the buyer can still edit cost on the PO before
   * sending it) and marking the requisition CONVERTED, atomically in one
   * transaction so the two can never disagree about whether conversion
   * happened.
   */
  async createFromRequisition(
    tenantId: string,
    requisitionId: string,
    input: { vendorId: string; poNumber: string; expectedDate?: Date; notes?: string; createdBy?: string },
  ): Promise<PurchaseOrderWithLines> {
    try {
      return await this.prisma.withTenantContext(tenantId, async (tx) => {
        const requisition = await tx.inventoryPurchaseRequisition.findFirst({
          where: { id: requisitionId, tenantId },
          include: { lines: true },
        });
        if (!requisition) {
          throw new NotFoundException(`Purchase requisition "${requisitionId}" not found`);
        }
        if (requisition.status !== 'APPROVED') {
          throw new ConflictException('Only an approved requisition can be converted to a purchase order');
        }

        const purchaseOrder = await tx.inventoryPurchaseOrder.create({
          data: {
            tenantId,
            organizationId: requisition.organizationId,
            warehouseId: requisition.warehouseId,
            vendorId: input.vendorId,
            requisitionId: requisition.id,
            poNumber: input.poNumber,
            expectedDate: input.expectedDate,
            notes: input.notes,
            createdBy: input.createdBy,
            updatedBy: input.createdBy,
            lines: {
              create: requisition.lines.map((line) => ({
                tenantId,
                productId: line.productId,
                quantity: line.quantity,
                unitCost: line.estimatedUnitCost ?? 0,
              })),
            },
          },
          include: { lines: true },
        });

        await tx.inventoryPurchaseRequisition.update({
          where: { id: requisition.id },
          data: { status: 'CONVERTED' },
        });

        return purchaseOrder;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`A purchase order numbered "${input.poNumber}" already exists`);
      }
      throw error;
    }
  }

  findById(tenantId: string, id: string): Promise<PurchaseOrderWithLines | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryPurchaseOrder.findFirst({
        where: { id, tenantId },
        include: { lines: true },
      }),
    );
  }

  findLineById(tenantId: string, lineId: string): Promise<InventoryPurchaseOrderLine | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryPurchaseOrderLine.findFirst({ where: { id: lineId, tenantId } }),
    );
  }

  list(
    tenantId: string,
    filters: { warehouseId?: string; vendorId?: string; status?: InventoryPurchaseOrderStatus } = {},
  ): Promise<PurchaseOrderWithLines[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryPurchaseOrder.findMany({
        where: { tenantId, warehouseId: filters.warehouseId, vendorId: filters.vendorId, status: filters.status },
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  updateStatus(tenantId: string, id: string, status: InventoryPurchaseOrderStatus, updatedBy?: string): Promise<InventoryPurchaseOrder> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryPurchaseOrder.update({ where: { id }, data: { status, updatedBy } }),
    );
  }
}
