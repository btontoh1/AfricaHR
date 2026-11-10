import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryRequisitionStatus } from '@prisma/client';
import {
  InventoryEmployeeRepository,
  InventoryPurchaseRequisitionRepository,
  InventoryWarehouseRepository,
  RequisitionWithLines,
} from '@africahr/inventory-data-access';
import { CreatePurchaseRequisitionDto } from './dto/create-purchase-requisition.dto';
import { ApproveRequisitionDto } from './dto/review-requisition.dto';
import { RejectRequisitionDto } from './dto/reject-requisition.dto';

@Injectable()
export class InventoryRequisitionService {
  constructor(
    private readonly requisitions: InventoryPurchaseRequisitionRepository,
    private readonly warehouses: InventoryWarehouseRepository,
    private readonly employees: InventoryEmployeeRepository,
  ) {}

  async create(tenantId: string, dto: CreatePurchaseRequisitionDto, actorId?: string): Promise<RequisitionWithLines> {
    const warehouse = await this.warehouses.findById(tenantId, dto.warehouseId);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse "${dto.warehouseId}" not found`);
    }
    const requester = await this.employees.findById(tenantId, dto.requestedByEmployeeId);
    if (!requester) {
      throw new NotFoundException(`Employee "${dto.requestedByEmployeeId}" not found`);
    }

    return this.requisitions.create(tenantId, {
      organizationId: warehouse.organizationId,
      warehouseId: dto.warehouseId,
      requestedByEmployeeId: dto.requestedByEmployeeId,
      notes: dto.notes,
      lines: dto.lines,
      createdBy: actorId,
    });
  }

  findById(tenantId: string, id: string): Promise<RequisitionWithLines> {
    return this.requireRequisition(tenantId, id);
  }

  list(
    tenantId: string,
    filters: { warehouseId?: string; status?: InventoryRequisitionStatus; requestedByEmployeeId?: string } = {},
  ): Promise<RequisitionWithLines[]> {
    return this.requisitions.list(tenantId, filters);
  }

  async submit(tenantId: string, id: string, actorId?: string) {
    const requisition = await this.requireRequisition(tenantId, id);
    this.requireStatus(requisition, 'DRAFT', 'submitted');
    return this.requisitions.updateStatus(tenantId, id, { status: 'SUBMITTED', updatedBy: actorId });
  }

  async approve(tenantId: string, id: string, dto: ApproveRequisitionDto, actorId?: string) {
    const requisition = await this.requireRequisition(tenantId, id);
    this.requireStatus(requisition, 'SUBMITTED', 'approved');
    const reviewer = actorId ? await this.employees.findByUserId(tenantId, actorId) : null;
    return this.requisitions.updateStatus(tenantId, id, {
      status: 'APPROVED',
      reviewedByEmployeeId: reviewer?.id,
      reviewNote: dto.reviewNote,
      updatedBy: actorId,
    });
  }

  async reject(tenantId: string, id: string, dto: RejectRequisitionDto, actorId?: string) {
    const requisition = await this.requireRequisition(tenantId, id);
    this.requireStatus(requisition, 'SUBMITTED', 'rejected');
    const reviewer = actorId ? await this.employees.findByUserId(tenantId, actorId) : null;
    return this.requisitions.updateStatus(tenantId, id, {
      status: 'REJECTED',
      reviewedByEmployeeId: reviewer?.id,
      reviewNote: dto.reviewNote,
      updatedBy: actorId,
    });
  }

  async cancel(tenantId: string, id: string, actorId?: string) {
    const requisition = await this.requireRequisition(tenantId, id);
    if (requisition.status === 'CONVERTED') {
      throw new ConflictException('A requisition already converted to a purchase order cannot be cancelled');
    }
    return this.requisitions.updateStatus(tenantId, id, { status: 'CANCELLED', updatedBy: actorId });
  }

  private async requireRequisition(tenantId: string, id: string): Promise<RequisitionWithLines> {
    const requisition = await this.requisitions.findById(tenantId, id);
    if (!requisition) {
      throw new NotFoundException(`Purchase requisition "${id}" not found`);
    }
    return requisition;
  }

  private requireStatus(requisition: RequisitionWithLines, expected: InventoryRequisitionStatus, action: string): void {
    if (requisition.status !== expected) {
      throw new ConflictException(`Only a ${expected.toLowerCase()} requisition can be ${action}`);
    }
  }
}
