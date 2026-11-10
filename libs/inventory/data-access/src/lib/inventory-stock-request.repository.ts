import { Injectable } from '@nestjs/common';
import { InventoryStockRequest, InventoryStockRequestStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateStockRequestInput {
  warehouseId: string;
  productId: string;
  quantity: number;
  requestedByEmployeeId: string;
  reason?: string;
}

export interface UpdateStockRequestStatusInput {
  status: InventoryStockRequestStatus;
  reviewedByEmployeeId?: string;
  reviewNote?: string;
  fulfilledLedgerEntryId?: string;
}

@Injectable()
export class InventoryStockRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateStockRequestInput): Promise<InventoryStockRequest> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryStockRequest.create({
        data: {
          tenantId,
          warehouseId: input.warehouseId,
          productId: input.productId,
          quantity: input.quantity,
          requestedByEmployeeId: input.requestedByEmployeeId,
          reason: input.reason,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<InventoryStockRequest | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryStockRequest.findFirst({ where: { id, tenantId } }),
    );
  }

  list(
    tenantId: string,
    filters: { requestedByEmployeeId?: string; status?: InventoryStockRequestStatus; warehouseId?: string } = {},
  ): Promise<InventoryStockRequest[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryStockRequest.findMany({
        where: {
          tenantId,
          requestedByEmployeeId: filters.requestedByEmployeeId,
          status: filters.status,
          warehouseId: filters.warehouseId,
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  updateStatus(tenantId: string, id: string, input: UpdateStockRequestStatusInput): Promise<InventoryStockRequest> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryStockRequest.update({
        where: { id },
        data: {
          status: input.status,
          reviewedByEmployeeId: input.reviewedByEmployeeId,
          reviewNote: input.reviewNote,
          fulfilledLedgerEntryId: input.fulfilledLedgerEntryId,
        },
      }),
    );
  }
}
