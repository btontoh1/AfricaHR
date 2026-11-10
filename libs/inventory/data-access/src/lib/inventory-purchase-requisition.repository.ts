import { Injectable } from '@nestjs/common';
import { InventoryPurchaseRequisition, InventoryPurchaseRequisitionLine, InventoryRequisitionStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export type RequisitionWithLines = InventoryPurchaseRequisition & { lines: InventoryPurchaseRequisitionLine[] };

export interface CreateRequisitionLineInput {
  productId: string;
  quantity: number;
  estimatedUnitCost?: number;
}

export interface CreateRequisitionInput {
  organizationId: string;
  warehouseId: string;
  requestedByEmployeeId: string;
  notes?: string;
  lines: CreateRequisitionLineInput[];
  createdBy?: string;
}

export interface UpdateRequisitionStatusInput {
  status: InventoryRequisitionStatus;
  reviewedByEmployeeId?: string;
  reviewNote?: string;
  updatedBy?: string;
}

@Injectable()
export class InventoryPurchaseRequisitionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateRequisitionInput): Promise<RequisitionWithLines> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryPurchaseRequisition.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          warehouseId: input.warehouseId,
          requestedByEmployeeId: input.requestedByEmployeeId,
          notes: input.notes,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
          lines: {
            create: input.lines.map((line) => ({
              tenantId,
              productId: line.productId,
              quantity: line.quantity,
              estimatedUnitCost: line.estimatedUnitCost,
            })),
          },
        },
        include: { lines: true },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<RequisitionWithLines | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryPurchaseRequisition.findFirst({
        where: { id, tenantId },
        include: { lines: true },
      }),
    );
  }

  list(
    tenantId: string,
    filters: { warehouseId?: string; status?: InventoryRequisitionStatus; requestedByEmployeeId?: string } = {},
  ): Promise<RequisitionWithLines[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryPurchaseRequisition.findMany({
        where: {
          tenantId,
          warehouseId: filters.warehouseId,
          status: filters.status,
          requestedByEmployeeId: filters.requestedByEmployeeId,
        },
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  updateStatus(tenantId: string, id: string, input: UpdateRequisitionStatusInput): Promise<InventoryPurchaseRequisition> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryPurchaseRequisition.update({
        where: { id },
        data: {
          status: input.status,
          reviewedByEmployeeId: input.reviewedByEmployeeId,
          reviewNote: input.reviewNote,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }
}
