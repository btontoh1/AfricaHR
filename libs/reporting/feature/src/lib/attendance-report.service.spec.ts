import { BadRequestException } from '@nestjs/common';
import { AttendanceReportRepository } from '@africahr/reporting-data-access';
import { AttendanceReportService } from './attendance-report.service';

describe('AttendanceReportService', () => {
  let service: AttendanceReportService;
  let attendance: jest.Mocked<AttendanceReportRepository>;

  beforeEach(() => {
    attendance = {
      summarize: jest
        .fn()
        .mockResolvedValue({ recordCount: 10, employeeCount: 2, totalHoursWorked: 80, totalOvertimeHours: 4 }),
    } as unknown as jest.Mocked<AttendanceReportRepository>;

    service = new AttendanceReportService(attendance);
  });

  it('rejects when from/to are missing', async () => {
    await expect(service.generate('tenant-1', {})).rejects.toThrow(BadRequestException);
    expect(attendance.summarize).not.toHaveBeenCalled();
  });

  it('delegates to the repository with parsed dates', async () => {
    const result = await service.generate('tenant-1', { from: '2026-01-01', to: '2026-01-31' });

    expect(result.totalHoursWorked).toBe(80);
    expect(attendance.summarize).toHaveBeenCalledWith('tenant-1', {
      organizationId: undefined,
      from: new Date('2026-01-01'),
      to: new Date('2026-01-31'),
    });
  });
});
