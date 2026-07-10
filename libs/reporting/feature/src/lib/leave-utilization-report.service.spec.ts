import { LeaveUtilizationReportRepository } from '@africahr/reporting-data-access';
import { LeaveUtilizationReportService } from './leave-utilization-report.service';

describe('LeaveUtilizationReportService', () => {
  let service: LeaveUtilizationReportService;
  let leaveUtilization: jest.Mocked<LeaveUtilizationReportRepository>;

  beforeEach(() => {
    leaveUtilization = {
      summarizeByLeaveType: jest.fn().mockResolvedValue([
        { leaveTypeId: 'lt-1', leaveTypeName: 'Annual Leave', totalEntitledDays: 30, totalUsedDays: 12 },
      ]),
    } as unknown as jest.Mocked<LeaveUtilizationReportRepository>;

    service = new LeaveUtilizationReportService(leaveUtilization);
  });

  it('defaults year to the current calendar year when omitted', async () => {
    await service.generate('tenant-1', {});

    expect(leaveUtilization.summarizeByLeaveType).toHaveBeenCalledWith('tenant-1', {
      year: new Date().getFullYear(),
      organizationId: undefined,
      leaveTypeId: undefined,
    });
  });

  it('attaches a computed utilization percentage per leave type', async () => {
    const result = await service.generate('tenant-1', { year: '2026' });

    expect(result).toEqual([
      {
        leaveTypeId: 'lt-1',
        leaveTypeName: 'Annual Leave',
        totalEntitledDays: 30,
        totalUsedDays: 12,
        utilizationPercent: 40,
      },
    ]);
  });
});
