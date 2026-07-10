import { Injectable } from '@nestjs/common';
import { ApplicationStage } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { TimeToHirePair } from '@africahr/reporting-domain';

export interface RecruitmentPipelineReportParams {
  organizationId?: string;
}

export interface ApplicationsByStage {
  stage: ApplicationStage;
  count: number;
}

/**
 * Reads JobRequisition/Application fields recruitment-pipeline reporting
 * needs, via the shared PrismaService directly (same cross-bounded-context
 * read pattern as HeadcountReportRepository).
 */
@Injectable()
export class RecruitmentPipelineReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  countOpenRequisitions(tenantId: string, params: RecruitmentPipelineReportParams = {}): Promise<number> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.jobRequisition.count({
        where: {
          tenantId,
          deletedAt: null,
          organizationId: params.organizationId,
          status: 'OPEN',
        },
      }),
    );
  }

  async countApplicationsByStage(
    tenantId: string,
    params: RecruitmentPipelineReportParams = {},
  ): Promise<ApplicationsByStage[]> {
    const rows = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.application.groupBy({
        by: ['stage'],
        where: {
          tenantId,
          deletedAt: null,
          requisition: params.organizationId ? { organizationId: params.organizationId } : undefined,
        },
        _count: { _all: true },
      }),
    );
    return rows.map((row) => ({ stage: row.stage, count: row._count._all }));
  }

  async listTimeToHirePairs(
    tenantId: string,
    params: RecruitmentPipelineReportParams = {},
  ): Promise<TimeToHirePair[]> {
    const applications = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.application.findMany({
        where: {
          tenantId,
          deletedAt: null,
          stage: 'HIRED',
          offerAccepted: true,
          offerRespondedAt: { not: null },
          requisition: params.organizationId ? { organizationId: params.organizationId } : undefined,
        },
        select: { appliedAt: true, offerRespondedAt: true },
      }),
    );

    return applications
      .filter((application) => application.offerRespondedAt !== null)
      .map((application) => ({
        appliedAt: application.appliedAt,
        hiredAt: application.offerRespondedAt as Date,
      }));
  }
}
