import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { TenantRepository } from '@africahr/tenancy-data-access';
import { canTransitionTenantStatus, isValidSlug, slugify, TenantStatus } from '@africahr/tenancy-domain';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantService {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateTenantDto, actorId?: string): Promise<Tenant> {
    const slug = dto.slug ? dto.slug : slugify(dto.name);

    if (!isValidSlug(slug)) {
      throw new ConflictException(`"${slug}" is not a valid tenant slug`);
    }

    const existing = await this.tenants.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`Tenant slug "${slug}" is already in use`);
    }

    const tenant = await this.tenants.create({
      name: dto.name,
      slug,
      country: dto.country,
      currency: dto.currency,
      timezone: dto.timezone,
      createdBy: actorId,
    });

    await this.audit.record({
      tenantId: tenant.id,
      actorUserId: actorId ?? null,
      action: 'tenant.created',
      resourceType: 'Tenant',
      resourceId: tenant.id,
    });

    return tenant;
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenants.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant "${id}" not found`);
    }
    return tenant;
  }

  list(params: { skip?: number; take?: number } = {}): Promise<Tenant[]> {
    return this.tenants.list(params);
  }

  /**
   * For org-scoped login: TRIAL and ACTIVE tenants can log in, SUSPENDED and
   * CLOSED cannot. Uses the same not-found message for "no such slug" and
   * "suspended/closed" so an unauthenticated caller can't distinguish them.
   */
  async findBySlugForLogin(slug: string): Promise<Tenant> {
    const tenant = await this.tenants.findBySlug(slug);
    if (
      !tenant ||
      tenant.status === TenantStatus.SUSPENDED ||
      tenant.status === TenantStatus.CLOSED
    ) {
      throw new NotFoundException(`Tenant "${slug}" not found`);
    }
    return tenant;
  }

  async updateStatus(id: string, status: TenantStatus, actorId?: string): Promise<Tenant> {
    const tenant = await this.findById(id);

    if (!canTransitionTenantStatus(tenant.status, status)) {
      throw new ConflictException(`Cannot transition tenant from ${tenant.status} to ${status}`);
    }

    const updated = await this.tenants.updateStatus(id, status, actorId);

    await this.audit.record({
      tenantId: id,
      actorUserId: actorId ?? null,
      action: 'tenant.status_changed',
      resourceType: 'Tenant',
      resourceId: id,
      metadata: { from: tenant.status, to: status },
    });

    return updated;
  }

  async softDelete(id: string, actorId?: string): Promise<Tenant> {
    await this.findById(id);
    const deleted = await this.tenants.softDelete(id, actorId);

    await this.audit.record({
      tenantId: id,
      actorUserId: actorId ?? null,
      action: 'tenant.deleted',
      resourceType: 'Tenant',
      resourceId: id,
    });

    return deleted;
  }
}
