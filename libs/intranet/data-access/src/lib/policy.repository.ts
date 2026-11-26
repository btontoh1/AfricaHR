import { Injectable } from '@nestjs/common';
import { AudienceScope, Policy } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreatePolicyInput {
  tenantId: string;
  title: string;
  folder: string;
  storageKey: string;
  fileName: string;
  version: number;
  supersedesId?: string | null;
  audienceScope: AudienceScope;
  organizationId?: string | null;
  organizationUnitId?: string | null;
  createdBy?: string;
}

export interface PolicyAudienceEmployee {
  organizationId: string;
  organizationUnitId: string | null;
}

@Injectable()
export class PolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreatePolicyInput): Promise<Policy> {
    return this.prisma.withTenantContext(input.tenantId, (tx) =>
      tx.policy.create({
        data: {
          tenantId: input.tenantId,
          title: input.title,
          folder: input.folder,
          storageKey: input.storageKey,
          fileName: input.fileName,
          version: input.version,
          supersedesId: input.supersedesId,
          audienceScope: input.audienceScope,
          organizationId: input.organizationId,
          organizationUnitId: input.organizationUnitId,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<Policy | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.policy.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  listAll(tenantId: string): Promise<Policy[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.policy.findMany({ where: { tenantId, deletedAt: null }, orderBy: { publishedAt: 'desc' } }),
    );
  }

  /**
   * Policies visible to an employee in this org/unit - TENANT-scoped ones
   * always match, ORGANIZATION-scoped ones match their own organization,
   * ORGANIZATION_UNIT-scoped ones match their own unit (never, if the
   * employee has no unit). Mirrors domain's isInAudience as a Prisma
   * where-clause rather than filtering in memory.
   */
  /** Existence check run under the tenant's RLS context - same posture as iam's UserRepository.organizationExistsInTenant. */
  async organizationExistsInTenant(tenantId: string, organizationId: string): Promise<boolean> {
    const org = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.findFirst({ where: { id: organizationId, deletedAt: null }, select: { id: true } }),
    );
    return org !== null;
  }

  async organizationUnitExistsInTenant(tenantId: string, organizationUnitId: string): Promise<boolean> {
    const unit = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organizationUnit.findFirst({ where: { id: organizationUnitId, deletedAt: null }, select: { id: true } }),
    );
    return unit !== null;
  }

  listVisibleTo(tenantId: string, employee: PolicyAudienceEmployee): Promise<Policy[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.policy.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            { audienceScope: 'TENANT' },
            { audienceScope: 'ORGANIZATION', organizationId: employee.organizationId },
            ...(employee.organizationUnitId
              ? [{ audienceScope: 'ORGANIZATION_UNIT' as const, organizationUnitId: employee.organizationUnitId }]
              : []),
          ],
        },
        orderBy: { publishedAt: 'desc' },
      }),
    );
  }
}
