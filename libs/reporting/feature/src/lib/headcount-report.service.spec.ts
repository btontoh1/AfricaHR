import { HeadcountReportRepository } from '@africahr/reporting-data-access';
import { HeadcountReportService } from './headcount-report.service';

describe('HeadcountReportService', () => {
  let service: HeadcountReportService;
  let headcount: jest.Mocked<HeadcountReportRepository>;

  beforeEach(() => {
    headcount = {
      countActive: jest.fn().mockResolvedValue(20),
      countByEmploymentType: jest.fn().mockResolvedValue([{ employmentType: 'FULL_TIME', count: 20 }]),
      countByOrganizationUnit: jest.fn().mockResolvedValue([]),
      countHiresInPeriod: jest.fn().mockResolvedValue(3),
      countTerminationsInPeriod: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<HeadcountReportRepository>;

    service = new HeadcountReportService(headcount);
  });

  it('omits hires/terminations when no date range is given', async () => {
    const result = await service.generate('tenant-1', { organizationId: 'org-1' });

    expect(result.activeCount).toBe(20);
    expect(result.hiresInPeriod).toBeUndefined();
    expect(result.terminationsInPeriod).toBeUndefined();
    expect(headcount.countHiresInPeriod).not.toHaveBeenCalled();
  });

  it('includes hires/terminations when both from and to are given', async () => {
    const result = await service.generate('tenant-1', { from: '2026-01-01', to: '2026-01-31' });

    expect(result.hiresInPeriod).toBe(3);
    expect(result.terminationsInPeriod).toBe(1);
    expect(headcount.countHiresInPeriod).toHaveBeenCalledWith('tenant-1', {
      organizationId: undefined,
      from: new Date('2026-01-01'),
      to: new Date('2026-01-31'),
    });
  });
});
