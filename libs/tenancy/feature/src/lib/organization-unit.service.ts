import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationUnit } from '@prisma/client';
import { wouldCreateCycle } from '@africahr/platform-core';
import { AuditService } from '@africahr/platform-audit';
import { OrganizationRepository, OrganizationUnitRepository } from '@africahr/tenancy-data-access';
import { CreateOrganizationUnitDto } from './dto/create-organization-unit.dto';
import { UpdateOrganizationUnitDto } from './dto/update-organization-unit.dto';

@Injectable()
export class OrganizationUnitService {
  constructor(
    private readonly units: OrganizationUnitRepository,
    private readonly organizations: OrganizationRepository,
    private readonly audit: AuditService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateOrganizationUnitDto,
    actorId?: string,
  ): Promise<OrganizationUnit> {
    const organization = await this.organizations.findById(tenantId, dto.organizationId);
    if (!organization) {
      throw new NotFoundException(`Organization "${dto.organizationId}" not found`);
    }

    if (dto.parentId) {
      const parent = await this.units.findById(tenantId, dto.parentId);
      if (!parent || parent.organizationId !== dto.organizationId) {
        throw new BadRequestException(
          `Parent unit "${dto.parentId}" not found in organization "${dto.organizationId}"`,
        );
      }
    }

    const unit = await this.units.create(tenantId, {
      organizationId: dto.organizationId,
      parentId: dto.parentId ?? null,
      name: dto.name,
      code: dto.code,
      createdBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'organization_unit.created',
      resourceType: 'OrganizationUnit',
      resourceId: unit.id,
    });

    return unit;
  }

  async findById(tenantId: string, id: string): Promise<OrganizationUnit> {
    const unit = await this.units.findById(tenantId, id);
    if (!unit) {
      throw new NotFoundException(`Organization unit "${id}" not found`);
    }
    return unit;
  }

  listByOrganization(tenantId: string, organizationId: string): Promise<OrganizationUnit[]> {
    return this.units.listByOrganization(tenantId, organizationId);
  }

  async updateParent(
    tenantId: string,
    id: string,
    parentId: string | null | undefined,
    actorId?: string,
  ): Promise<OrganizationUnit> {
    const unit = await this.findById(tenantId, id);
    const newParentId = parentId ?? null;

    if (newParentId) {
      const parent = await this.units.findById(tenantId, newParentId);
      if (!parent || parent.organizationId !== unit.organizationId) {
        throw new BadRequestException(
          `Parent unit "${newParentId}" not found in organization "${unit.organizationId}"`,
        );
      }
    }

    const siblings = await this.units.listByOrganization(tenantId, unit.organizationId);
    if (wouldCreateCycle(siblings, id, newParentId)) {
      throw new BadRequestException('Cannot move a unit under one of its own descendants');
    }

    const updated = await this.units.updateParent(tenantId, id, newParentId, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'organization_unit.moved',
      resourceType: 'OrganizationUnit',
      resourceId: id,
      metadata: { from: unit.parentId, to: newParentId },
    });

    return updated;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateOrganizationUnitDto,
    actorId?: string,
  ): Promise<OrganizationUnit> {
    await this.findById(tenantId, id);

    const updated = await this.units.update(
      tenantId,
      id,
      { name: dto.name, code: dto.code },
      actorId,
    );

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'organization_unit.updated',
      resourceType: 'OrganizationUnit',
      resourceId: id,
    });

    return updated;
  }

  async remove(tenantId: string, id: string, actorId?: string): Promise<OrganizationUnit> {
    await this.findById(tenantId, id);

    const childCount = await this.units.countChildren(tenantId, id);
    if (childCount > 0) {
      throw new BadRequestException(
        `Cannot remove this unit: reassign or remove its ${childCount} child unit(s) first`,
      );
    }

    const employeeCount = await this.units.countEmployees(tenantId, id);
    if (employeeCount > 0) {
      throw new BadRequestException(
        `Cannot remove this unit: ${employeeCount} employee(s) are still assigned to it`,
      );
    }

    const removed = await this.units.softDelete(tenantId, id, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'organization_unit.removed',
      resourceType: 'OrganizationUnit',
      resourceId: id,
    });

    return removed;
  }
}
