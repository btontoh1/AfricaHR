import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CompanyAsset, CompanyAssetAssignment, CompanyAssetStatus } from '@prisma/client';
import {
  CompanyAssetAssignmentRepository,
  CompanyAssetRepository,
  InventoryEmployeeRepository,
} from '@africahr/inventory-data-access';
import { CreateCompanyAssetDto } from './dto/create-company-asset.dto';
import { UpdateCompanyAssetDto } from './dto/update-company-asset.dto';
import { AssignAssetDto } from './dto/assign-asset.dto';
import { ReturnAssetDto } from './dto/return-asset.dto';

@Injectable()
export class CompanyAssetService {
  constructor(
    private readonly assets: CompanyAssetRepository,
    private readonly assignments: CompanyAssetAssignmentRepository,
    private readonly employees: InventoryEmployeeRepository,
  ) {}

  async create(tenantId: string, dto: CreateCompanyAssetDto, actorId?: string): Promise<CompanyAsset> {
    const existing = await this.assets.findByAssetTag(tenantId, dto.assetTag);
    if (existing) {
      throw new ConflictException(`An asset tagged "${dto.assetTag}" already exists`);
    }
    return this.assets.create(tenantId, {
      organizationId: dto.organizationId,
      assetTag: dto.assetTag,
      name: dto.name,
      category: dto.category,
      serialNumber: dto.serialNumber,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      purchasePrice: dto.purchasePrice,
      notes: dto.notes,
      createdBy: actorId,
    });
  }

  findById(tenantId: string, id: string): Promise<CompanyAsset> {
    return this.requireAsset(tenantId, id);
  }

  list(
    tenantId: string,
    filters: { organizationId?: string; status?: CompanyAssetStatus } = {},
  ): Promise<CompanyAsset[]> {
    return this.assets.list(tenantId, filters);
  }

  async update(tenantId: string, id: string, dto: UpdateCompanyAssetDto, actorId?: string): Promise<CompanyAsset> {
    await this.requireAsset(tenantId, id);
    return this.assets.update(tenantId, id, {
      name: dto.name,
      category: dto.category,
      serialNumber: dto.serialNumber,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      purchasePrice: dto.purchasePrice,
      notes: dto.notes,
      isActive: dto.isActive,
      updatedBy: actorId,
    });
  }

  async delete(tenantId: string, id: string, actorId?: string): Promise<CompanyAsset> {
    await this.requireAsset(tenantId, id);
    return this.assets.softDelete(tenantId, id, actorId);
  }

  async assign(tenantId: string, assetId: string, dto: AssignAssetDto, actorId?: string): Promise<CompanyAssetAssignment> {
    const employee = await this.employees.findById(tenantId, dto.employeeId);
    if (!employee) {
      throw new NotFoundException(`Employee "${dto.employeeId}" not found`);
    }
    return this.assignments.assign(tenantId, assetId, {
      employeeId: dto.employeeId,
      assignNote: dto.assignNote,
      assignedByUserId: actorId,
    });
  }

  returnAsset(tenantId: string, assetId: string, dto: ReturnAssetDto): Promise<CompanyAssetAssignment> {
    return this.assignments.returnAsset(tenantId, assetId, dto);
  }

  async retire(tenantId: string, id: string, actorId?: string): Promise<CompanyAsset> {
    const asset = await this.requireAsset(tenantId, id);
    if (asset.status === 'ASSIGNED') {
      throw new ConflictException('Return this asset before retiring it');
    }
    return this.assets.updateStatus(tenantId, id, 'RETIRED', actorId);
  }

  async setMaintenance(tenantId: string, id: string, actorId?: string): Promise<CompanyAsset> {
    const asset = await this.requireAsset(tenantId, id);
    if (asset.status === 'ASSIGNED') {
      throw new ConflictException('Return this asset before marking it under maintenance');
    }
    return this.assets.updateStatus(tenantId, id, 'MAINTENANCE', actorId);
  }

  async makeAvailable(tenantId: string, id: string, actorId?: string): Promise<CompanyAsset> {
    const asset = await this.requireAsset(tenantId, id);
    if (asset.status === 'ASSIGNED') {
      throw new ConflictException('This asset is currently assigned');
    }
    return this.assets.updateStatus(tenantId, id, 'AVAILABLE', actorId);
  }

  assignmentHistory(tenantId: string, assetId: string): Promise<CompanyAssetAssignment[]> {
    return this.assignments.listForAsset(tenantId, assetId);
  }

  /** Self-service: the caller's own currently-and-previously-assigned assets, resolved via their Employee record. */
  async listForSelf(tenantId: string, userId: string): Promise<(CompanyAssetAssignment & { asset: CompanyAsset })[]> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record is linked to this account');
    }
    return this.assignments.listForEmployee(tenantId, employee.id);
  }

  private async requireAsset(tenantId: string, id: string): Promise<CompanyAsset> {
    const asset = await this.assets.findById(tenantId, id);
    if (!asset) {
      throw new NotFoundException(`Asset "${id}" not found`);
    }
    return asset;
  }
}
