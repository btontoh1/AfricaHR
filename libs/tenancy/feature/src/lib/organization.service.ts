import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Organization, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { StorageService } from '@africahr/platform-storage';
import { canTransitionOrganizationVerificationStatus, OrganizationVerificationStatus } from '@africahr/tenancy-domain';
import { OrganizationRepository, TenantRepository } from '@africahr/tenancy-data-access';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { RequestOrganizationLogoUploadDto } from './dto/request-organization-logo-upload.dto';

export interface RequestOrganizationLogoUploadResult {
  uploadUrl: string;
}

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly tenants: TenantRepository,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
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

  async update(
    tenantId: string,
    id: string,
    dto: UpdateOrganizationDto,
    actorId?: string,
  ): Promise<Organization> {
    await this.findById(tenantId, id);

    const updated = await this.organizations.update(tenantId, id, {
      legalName: dto.legalName,
      tradingName: dto.tradingName,
      countryCode: dto.countryCode,
      registrationNumber: dto.registrationNumber,
      taxIdentificationNumber: dto.taxIdentificationNumber,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'organization.updated',
      resourceType: 'Organization',
      resourceId: id,
    });

    return updated;
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

  async submitForVerification(tenantId: string, id: string, actorId?: string): Promise<Organization> {
    const organization = await this.findById(tenantId, id);
    if (
      !canTransitionOrganizationVerificationStatus(
        organization.verificationStatus,
        OrganizationVerificationStatus.PENDING_REVIEW,
      )
    ) {
      throw new ConflictException(
        `Cannot submit organization for verification from status ${organization.verificationStatus}`,
      );
    }

    const updated = await this.organizations.submitForVerification(tenantId, id, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'organization.verification_submitted',
      resourceType: 'Organization',
      resourceId: id,
      metadata: { from: organization.verificationStatus, to: updated.verificationStatus },
    });

    return updated;
  }

  /** Platform-admin-facing, cross-tenant — see OrganizationRepository.listPendingReview. */
  listPendingVerification(): Promise<Organization[]> {
    return this.organizations.listPendingReview();
  }

  /** Platform-admin-facing, cross-tenant — resolves an org (and its owning tenant) regardless of who is scoped to it. */
  async findByIdAcrossTenants(id: string): Promise<Organization> {
    const organization = await this.organizations.findByIdAcrossTenants(id);
    if (!organization) {
      throw new NotFoundException(`Organization "${id}" not found`);
    }
    return organization;
  }

  async verify(id: string, actorId?: string): Promise<Organization> {
    const organization = await this.findByIdAcrossTenants(id);
    if (
      !canTransitionOrganizationVerificationStatus(
        organization.verificationStatus,
        OrganizationVerificationStatus.VERIFIED,
      )
    ) {
      throw new ConflictException(`Cannot verify organization from status ${organization.verificationStatus}`);
    }

    const updated = await this.organizations.verify(organization.tenantId, id, actorId);

    await this.audit.record({
      tenantId: organization.tenantId,
      actorUserId: actorId ?? null,
      action: 'organization.verified',
      resourceType: 'Organization',
      resourceId: id,
      metadata: { from: organization.verificationStatus, to: updated.verificationStatus },
    });

    return updated;
  }

  async reject(id: string, note: string, actorId?: string): Promise<Organization> {
    const organization = await this.findByIdAcrossTenants(id);
    if (
      !canTransitionOrganizationVerificationStatus(
        organization.verificationStatus,
        OrganizationVerificationStatus.REJECTED,
      )
    ) {
      throw new ConflictException(`Cannot reject organization from status ${organization.verificationStatus}`);
    }

    const updated = await this.organizations.reject(organization.tenantId, id, note, actorId);

    await this.audit.record({
      tenantId: organization.tenantId,
      actorUserId: actorId ?? null,
      action: 'organization.verification_rejected',
      resourceType: 'Organization',
      resourceId: id,
      metadata: { from: organization.verificationStatus, to: updated.verificationStatus, note },
    });

    return updated;
  }

  async requestLogoUpload(
    tenantId: string,
    id: string,
    dto: RequestOrganizationLogoUploadDto,
    actorId?: string,
  ): Promise<RequestOrganizationLogoUploadResult> {
    await this.findById(tenantId, id);

    const storageKey = `organization-logos/${tenantId}/${id}/${randomUUID()}-${dto.fileName}`;
    const uploadUrl = await this.storage.getUploadUrl(storageKey, dto.contentType);

    await this.organizations.updateLogo(tenantId, id, storageKey, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'organization.logo_updated',
      resourceType: 'Organization',
      resourceId: id,
    });

    return { uploadUrl };
  }

  async removeLogo(tenantId: string, id: string, actorId?: string): Promise<void> {
    const organization = await this.findById(tenantId, id);
    if (!organization.logoStorageKey) {
      return;
    }

    await this.storage.deleteObject(organization.logoStorageKey);
    await this.organizations.updateLogo(tenantId, id, null, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'organization.logo_removed',
      resourceType: 'Organization',
      resourceId: id,
    });
  }

  // 1 hour rather than the storage service's 15-minute default - same
  // reasoning as TenantService.getLogoUrl: this backs a logo shown across a
  // normal browsing session, not a one-off document view.
  async getLogoUrl(organization: Organization): Promise<string | null> {
    if (!organization.logoStorageKey) {
      return null;
    }
    return this.storage.getViewUrl(organization.logoStorageKey, 60 * 60);
  }
}
