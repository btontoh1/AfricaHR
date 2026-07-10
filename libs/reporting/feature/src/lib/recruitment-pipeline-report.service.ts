import { Injectable } from '@nestjs/common';
import { ApplicationsByStage, RecruitmentPipelineReportRepository } from '@africahr/reporting-data-access';
import { calculateAverageTimeToHireDays } from '@africahr/reporting-domain';

export interface RecruitmentPipelineReportParams {
  organizationId?: string;
}

export interface RecruitmentPipelineReport {
  openRequisitions: number;
  applicationsByStage: ApplicationsByStage[];
  averageTimeToHireDays: number;
}

@Injectable()
export class RecruitmentPipelineReportService {
  constructor(private readonly pipeline: RecruitmentPipelineReportRepository) {}

  async generate(
    tenantId: string,
    params: RecruitmentPipelineReportParams = {},
  ): Promise<RecruitmentPipelineReport> {
    const [openRequisitions, applicationsByStage, timeToHirePairs] = await Promise.all([
      this.pipeline.countOpenRequisitions(tenantId, params),
      this.pipeline.countApplicationsByStage(tenantId, params),
      this.pipeline.listTimeToHirePairs(tenantId, params),
    ]);

    return {
      openRequisitions,
      applicationsByStage,
      averageTimeToHireDays: calculateAverageTimeToHireDays(timeToHirePairs),
    };
  }
}
