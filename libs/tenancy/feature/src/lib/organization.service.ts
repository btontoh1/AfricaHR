import { Injectable, NotFoundException } from '@nestjs/common';
import { Organization, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { OrganizationRepository, TenantRepository } from '@africahr/tenancy-data-access';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly tenants: TenantRepository,
    private readonly audit: AuditService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateOrganizationDto,
    actorId?: string,
  ): Promise<Organization> {
    const tenant = await this.tenants.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant "${tenantId}" not found`);
    }

    const organization = await this.organizations.create(tenantId, {
      legalName: dto.legalName,
      tradingName: dto.tradingName,
      countryCode: dto.countryCode,
      registrationNumber: dto.registrationNumber,
      taxIdentificationNumber: dto.taxIdentificationNumber,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      createdBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'organization.created',
      resourceType: 'Organization',
      resourceId: organization.id,
    });

    return organization;
  }

  async findById(tenantId: string, id: string): Promise<Organization> {
    const organization = await this.organizations.findById(tenantId, id);
    if (!organization) {
      throw new NotFoundException(`Organization "${id}" not found`);
    }
    return organization;
  }

  listByTenant(tenantId: string): Promise<Organization[]> {
    return this.organizations.listByTenant(tenantId);
  }

  async softDelete(tenantId: string, id: string, actorId?: string): Promise<Organization> {
    await this.findById(tenantId, id);
    const deleted = await this.organizations.softDelete(tenantId, id, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'organization.deleted',
      resourceType: 'Organization',
      resourceId: id,
    });

    return deleted;
  }
}
