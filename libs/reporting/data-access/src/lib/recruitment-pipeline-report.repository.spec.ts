import { PrismaService } from '@africahr/platform-database';
import { RecruitmentPipelineReportRepository } from './recruitment-pipeline-report.repository';

describe('RecruitmentPipelineReportRepository', () => {
  let repository: RecruitmentPipelineReportRepository;
  let tx: {
    jobRequisition: { count: jest.Mock };
    application: { groupBy: jest.Mock; findMany: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      jobRequisition: { count: jest.fn() },
      application: { groupBy: jest.fn(), findMany: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new RecruitmentPipelineReportRepository(prisma as unknown as PrismaService);
  });

  it('counts OPEN requisitions', async () => {
    tx.jobRequisition.count.mockResolvedValue(4);

    const result = await repository.countOpenRequisitions('tenant-1');

    expect(result).toBe(4);
    expect(tx.jobRequisition.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, organizationId: undefined, status: 'OPEN' },
    });
  });

  it('groups applications by stage', async () => {
    tx.application.groupBy.mockResolvedValue([
      { stage: 'APPLIED', _count: { _all: 6 } },
      { stage: 'HIRED', _count: { _all: 1 } },
    ]);

    const result = await repository.countApplicationsByStage('tenant-1');

    expect(result).toEqual([
      { stage: 'APPLIED', count: 6 },
      { stage: 'HIRED', count: 1 },
    ]);
  });

  it('lists time-to-hire pairs only for accepted, HIRED applications', async () => {
    const appliedAt = new Date('2026-01-01');
    const offerRespondedAt = new Date('2026-01-15');
    tx.application.findMany.mockResolvedValue([{ appliedAt, offerRespondedAt }]);

    const result = await repository.listTimeToHirePairs('tenant-1');

    expect(result).toEqual([{ appliedAt, hiredAt: offerRespondedAt }]);
    expect(tx.application.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
        stage: 'HIRED',
        offerAccepted: true,
        offerRespondedAt: { not: null },
        requisition: undefined,
      },
      select: { appliedAt: true, offerRespondedAt: true },
    });
  });
});
