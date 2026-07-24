import { Injectable } from '@nestjs/common';
import { Organization, OrganizationVerificationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateOrganizationInput {
  legalName: string;
  tradingName?: string;
  countryCode: string;
  registrationNumber: string;
  taxIdentificationNumber?: string;
  metadata?: Prisma.InputJsonValue;
  createdBy?: string;
}

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateOrganizationInput): Promise<Organization> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.create({
        data: {
          tenantId,
          legalName: input.legalName,
          tradingName: input.tradingName,
          countryCode: input.countryCode,
          registrationNumber: input.registrationNumber,
          taxIdentificationNumber: input.taxIdentificationNumber,
          metadata: input.metadata,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<Organization | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  listByTenant(tenantId: string): Promise<Organization[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<Organization> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy },
      }),
    );
  }

  submitForVerification(tenantId: string, id: string, updatedBy?: string): Promise<Organization> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.update({
        where: { id },
        data: {
          verificationStatus: OrganizationVerificationStatus.PENDING_REVIEW,
          verificationNote: null,
          updatedBy,
        },
      }),
    );
  }

  verify(tenantId: string, id: string, verifiedBy?: string): Promise<Organization> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.update({
        where: { id },
        data: {
          verificationStatus: OrganizationVerificationStatus.VERIFIED,
          verificationNote: null,
          verifiedAt: new Date(),
          verifiedBy,
          updatedBy: verifiedBy,
        },
      }),
    );
  }

  reject(tenantId: string, id: string, note: string, verifiedBy?: string): Promise<Organization> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.update({
        where: { id },
        data: {
          verificationStatus: OrganizationVerificationStatus.REJECTED,
          verificationNote: note,
          verifiedAt: new Date(),
          verifiedBy,
          updatedBy: verifiedBy,
        },
      }),
    );
  }

  /**
   * Cross-tenant by design: a PLATFORM_ADMIN's review queue spans every
   * tenant. "organizations" has a non-nullable tenant_id, so it uses the
   * plain tenant_isolation policy (RLS_CONVENTION.md §2) - unlike the
   * nullable-tenant §4 case, that policy has no platform-sentinel branch,
   * so withPlatformScope would silently return zero rows here (verified
   * directly against Postgres, not assumed - see the migration this
   * function comes from). Goes through find_organizations_pending_review(),
   * a narrow SECURITY DEFINER function, the §5 pattern used by
   * UserRepository.findByEmail / RefreshTokenRepository.findByTokenHash.
   */
  listPendingReview(): Promise<Organization[]> {
    return this.prisma.$queryRaw<Organization[]>`SELECT * FROM find_organizations_pending_review()`;
  }

  /** Cross-tenant, same reasoning and pattern as listPendingReview. */
  async findByIdAcrossTenants(id: string): Promise<Organization | null> {
    const rows = await this.prisma.$queryRaw<
      Organization[]
    >`SELECT * FROM find_organization_by_id_across_tenants(${id})`;
    return rows[0] ?? null;
  }
}
