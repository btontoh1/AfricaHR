import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Organization, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { canTransitionOrganizationVerificationStatus, OrganizationVerificationStatus } from '@africahr/tenancy-domain';
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
}
