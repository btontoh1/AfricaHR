import { Injectable } from '@nestjs/common';
import { WeeklyReportTemplate } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface UpsertWeeklyReportTemplateInput {
  tenantId: string;
  organizationUnitId: string;
  questions: string[];
  actorId?: string;
}

@Injectable()
export class WeeklyReportTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByOrganizationUnitId(tenantId: string, organizationUnitId: string): Promise<WeeklyReportTemplate | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.weeklyReportTemplate.findFirst({ where: { tenantId, organizationUnitId, deletedAt: null } }),
    );
  }

  listAll(tenantId: string): Promise<WeeklyReportTemplate[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.weeklyReportTemplate.findMany({ where: { tenantId, deletedAt: null } }),
    );
  }

  upsert(input: UpsertWeeklyReportTemplateInput): Promise<WeeklyReportTemplate> {
    return this.prisma.withTenantContext(input.tenantId, (tx) =>
      tx.weeklyReportTemplate.upsert({
        where: { organizationUnitId: input.organizationUnitId },
        create: {
          tenantId: input.tenantId,
          organizationUnitId: input.organizationUnitId,
          questions: input.questions,
          createdBy: input.actorId,
          updatedBy: input.actorId,
        },
        update: {
          questions: input.questions,
          updatedBy: input.actorId,
        },
      }),
    );
  }

  /** Existence check run under the tenant's RLS context - mirrors PolicyRepository's. */
  async organizationUnitExistsInTenant(tenantId: string, organizationUnitId: string): Promise<boolean> {
    const unit = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organizationUnit.findFirst({ where: { id: organizationUnitId, deletedAt: null }, select: { id: true } }),
    );
    return unit !== null;
  }
}
