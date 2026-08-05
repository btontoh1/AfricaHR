import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { StorageService } from '@africahr/platform-storage';
import { TenantRepository } from '@africahr/tenancy-data-access';
import { canTransitionTenantStatus, isValidSlug, slugify, TenantStatus } from '@africahr/tenancy-domain';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { RequestTenantLogoUploadDto } from './dto/request-tenant-logo-upload.dto';

export interface RequestLogoUploadResult {
  uploadUrl: string;
}

@Injectable()
export class TenantService {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
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

  listRecent(take: number): Promise<Tenant[]> {
    return this.tenants.listRecent(take);
  }

  count(): Promise<number> {
    return this.tenants.count();
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

  /**
   * Offboarding is a terminal step, not an alternative to updateStatus -
   * only reachable once a tenant is already CLOSED (the end of
   * ALLOWED_TRANSITIONS, same status the "no further status changes" UI
   * state already gates on). Un-gating this would let a single click
   * permanently hide an ACTIVE tenant with real users out from under it;
   * requiring CLOSED-first forces going through updateStatus's own
   * transition checks and audit trail before deletion is even possible.
   */
  async softDelete(id: string, actorId?: string): Promise<Tenant> {
    const tenant = await this.findById(id);
    if (tenant.status !== TenantStatus.CLOSED) {
      throw new ConflictException(
        `Tenant must be closed before it can be deleted (currently ${tenant.status})`,
      );
    }

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

  async requestLogoUpload(
    tenantId: string,
    dto: RequestTenantLogoUploadDto,
    actorId?: string,
  ): Promise<RequestLogoUploadResult> {
    await this.findById(tenantId);

    const storageKey = `tenant-logos/${tenantId}/${randomUUID()}-${dto.fileName}`;
    const uploadUrl = await this.storage.getUploadUrl(storageKey, dto.contentType);

    await this.tenants.updateLogo(tenantId, storageKey, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'tenant.logo_updated',
      resourceType: 'Tenant',
      resourceId: tenantId,
    });

    return { uploadUrl };
  }

  async removeLogo(tenantId: string, actorId?: string): Promise<void> {
    const tenant = await this.findById(tenantId);
    if (!tenant.logoStorageKey) {
      return;
    }

    await this.storage.deleteObject(tenant.logoStorageKey);
    await this.tenants.updateLogo(tenantId, null, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'tenant.logo_removed',
      resourceType: 'Tenant',
      resourceId: tenantId,
    });
  }

  // 1 hour rather than the storage service's 15-minute default: this URL
  // backs the logo shown in the app shell on every page, not a one-off
  // document view, so it needs to comfortably outlive a normal browsing
  // session between React Query refetches.
  async getLogoUrl(tenant: Tenant): Promise<string | null> {
    if (!tenant.logoStorageKey) {
      return null;
    }
    return this.storage.getViewUrl(tenant.logoStorageKey, 60 * 60);
  }
}
