import { Injectable } from '@nestjs/common';
import { Announcement, AudienceScope } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateAnnouncementInput {
  tenantId: string;
  title: string;
  body: string;
  attachmentKey?: string | null;
  attachmentFileName?: string | null;
  audienceScope: AudienceScope;
  organizationId?: string | null;
  organizationUnitId?: string | null;
  pinned?: boolean;
  createdBy?: string;
}

export interface AnnouncementAudienceEmployee {
  organizationId: string;
  organizationUnitId: string | null;
}

const ORDER_BY = [{ pinned: 'desc' }, { createdAt: 'desc' }] as const;

@Injectable()
export class AnnouncementRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateAnnouncementInput): Promise<Announcement> {
    return this.prisma.withTenantContext(input.tenantId, (tx) =>
      tx.announcement.create({
        data: {
          tenantId: input.tenantId,
          title: input.title,
          body: input.body,
          attachmentKey: input.attachmentKey,
          attachmentFileName: input.attachmentFileName,
          audienceScope: input.audienceScope,
          organizationId: input.organizationId,
          organizationUnitId: input.organizationUnitId,
          pinned: input.pinned ?? false,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<Announcement | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.announcement.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  listAll(tenantId: string): Promise<Announcement[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.announcement.findMany({ where: { tenantId, deletedAt: null }, orderBy: [...ORDER_BY] }),
    );
  }

  setPinned(tenantId: string, id: string, pinned: boolean, updatedBy?: string): Promise<Announcement> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.announcement.update({ where: { id }, data: { pinned, updatedBy } }),
    );
  }

  /** Existence check run under the tenant's RLS context - mirrors PolicyRepository's. */
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

  /**
   * Announcements visible to an employee in this org/unit - same audience
   * matching as PolicyRepository.listVisibleTo, pinned-first ordering.
   */
  listVisibleTo(tenantId: string, employee: AnnouncementAudienceEmployee): Promise<Announcement[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.announcement.findMany({
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
        orderBy: [...ORDER_BY],
      }),
    );
  }
}
