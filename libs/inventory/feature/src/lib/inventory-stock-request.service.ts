import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryStockRequest, InventoryStockRequestStatus } from '@prisma/client';
import { InventoryEmployeeRepository, InventoryStockRequestRepository } from '@africahr/inventory-data-access';
import { InventoryStockService } from './inventory-stock.service';
import { CreateStockRequestDto } from './dto/create-stock-request.dto';
import { RejectStockRequestDto } from './dto/reject-stock-request.dto';

@Injectable()
export class InventoryStockRequestService {
  constructor(
    private readonly requests: InventoryStockRequestRepository,
    private readonly employees: InventoryEmployeeRepository,
    private readonly stock: InventoryStockService,
  ) {}

  /** Resolves the caller's own Employee id from their User id - the basis for every self-service method below (same pattern as LeaveRequestService). */
  async resolveOwnEmployeeId(tenantId: string, userId: string): Promise<string> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record is linked to this account');
    }
    return employee.id;
  }

  async createForSelf(tenantId: string, userId: string, dto: CreateStockRequestDto): Promise<InventoryStockRequest> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.requests.create(tenantId, {
      warehouseId: dto.warehouseId,
      productId: dto.productId,
      quantity: dto.quantity,
      requestedByEmployeeId: employeeId,
      reason: dto.reason,
    });
  }

  async listForSelf(tenantId: string, userId: string): Promise<InventoryStockRequest[]> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.requests.list(tenantId, { requestedByEmployeeId: employeeId });
  }

  async cancelForSelf(tenantId: string, userId: string, id: string): Promise<InventoryStockRequest> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const request = await this.requireRequest(tenantId, id);
    if (request.requestedByEmployeeId !== employeeId) {
      throw new ForbiddenException('This is not your request');
    }
    if (request.status !== 'PENDING') {
      throw new ConflictException('Only a pending request can be cancelled');
    }
    return this.requests.updateStatus(tenantId, id, { status: 'CANCELLED' });
  }

  findById(tenantId: string, id: string): Promise<InventoryStockRequest> {
    return this.requireRequest(tenantId, id);
  }

  list(
    tenantId: string,
    filters: { requestedByEmployeeId?: string; status?: InventoryStockRequestStatus; warehouseId?: string } = {},
  ): Promise<InventoryStockRequest[]> {
    return this.requests.list(tenantId, filters);
  }

  /**
   * Approves and fulfills in the same step: posts the actual GOODS_ISSUED
   * (through the normal tracksBatch/FEFO-aware issueGoods) tagged back to
   * this request via referenceType/referenceId, then marks the request
   * FULFILLED. fulfilledLedgerEntryId points at the first resulting entry
   * - a representative pointer for display; the full set (relevant when a
   * batch-tracked product's issue spans more than one lot) is still
   * recoverable via each entry's referenceId.
   */
  async approveAndFulfill(tenantId: string, id: string, actorId?: string): Promise<InventoryStockRequest> {
    const request = await this.requireRequest(tenantId, id);
    if (request.status !== 'PENDING') {
      throw new ConflictException('Only a pending request can be approved');
    }
    const reviewer = actorId ? await this.employees.findByUserId(tenantId, actorId) : null;

    const entries = await this.stock.issueGoods(
      tenantId,
      {
        warehouseId: request.warehouseId,
        productId: request.productId,
        quantity: Number(request.quantity),
        reason: request.reason || `Fulfilling stock request ${request.id}`,
      },
      actorId,
      { referenceType: 'StockRequest', referenceId: request.id },
    );

    return this.requests.updateStatus(tenantId, id, {
      status: 'FULFILLED',
      reviewedByEmployeeId: reviewer?.id,
      fulfilledLedgerEntryId: entries[0]?.id,
    });
  }

  async reject(tenantId: string, id: string, dto: RejectStockRequestDto, actorId?: string): Promise<InventoryStockRequest> {
    const request = await this.requireRequest(tenantId, id);
    if (request.status !== 'PENDING') {
      throw new ConflictException('Only a pending request can be rejected');
    }
    const reviewer = actorId ? await this.employees.findByUserId(tenantId, actorId) : null;
    return this.requests.updateStatus(tenantId, id, {
      status: 'REJECTED',
      reviewedByEmployeeId: reviewer?.id,
      reviewNote: dto.reviewNote,
    });
  }

  private async requireRequest(tenantId: string, id: string): Promise<InventoryStockRequest> {
    const request = await this.requests.findById(tenantId, id);
    if (!request) {
      throw new NotFoundException(`Stock request "${id}" not found`);
    }
    return request;
  }
}
