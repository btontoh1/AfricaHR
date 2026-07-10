import { RecruitmentPipelineReportRepository } from '@africahr/reporting-data-access';
import { RecruitmentPipelineReportService } from './recruitment-pipeline-report.service';

describe('RecruitmentPipelineReportService', () => {
  let service: RecruitmentPipelineReportService;
  let pipeline: jest.Mocked<RecruitmentPipelineReportRepository>;

  beforeEach(() => {
    pipeline = {
      countOpenRequisitions: jest.fn().mockResolvedValue(3),
      countApplicationsByStage: jest.fn().mockResolvedValue([{ stage: 'APPLIED', count: 5 }]),
      listTimeToHirePairs: jest.fn().mockResolvedValue([
        { appliedAt: new Date('2026-01-01'), hiredAt: new Date('2026-01-11') },
      ]),
    } as unknown as jest.Mocked<RecruitmentPipelineReportRepository>;

    service = new RecruitmentPipelineReportService(pipeline);
  });

  it('combines open requisitions, pipeline funnel, and average time-to-hire', async () => {
    const result = await service.generate('tenant-1', { organizationId: 'org-1' });

    expect(result).toEqual({
      openRequisitions: 3,
      applicationsByStage: [{ stage: 'APPLIED', count: 5 }],
      averageTimeToHireDays: 10,
    });
    expect(pipeline.countOpenRequisitions).toHaveBeenCalledWith('tenant-1', { organizationId: 'org-1' });
  });
});
