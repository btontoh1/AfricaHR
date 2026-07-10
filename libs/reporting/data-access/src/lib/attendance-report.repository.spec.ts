import { PrismaService } from '@africahr/platform-database';
import { AttendanceReportRepository } from './attendance-report.repository';

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('AttendanceReportRepository', () => {
  let repository: AttendanceReportRepository;
  let tx: { attendanceRecord: { findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { attendanceRecord: { findMany: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new AttendanceReportRepository(prisma as unknown as PrismaService);
  });

  it('summarizes hours and overtime across distinct employees', async () => {
    tx.attendanceRecord.findMany.mockResolvedValue([
      { employeeId: 'emp-1', hoursWorked: decimal(8), overtimeHours: decimal(1) },
      { employeeId: 'emp-1', hoursWorked: decimal(9), overtimeHours: decimal(2) },
      { employeeId: 'emp-2', hoursWorked: decimal(7.5), overtimeHours: decimal(0) },
    ]);

    const result = await repository.summarize('tenant-1', {
      from: new Date('2026-01-01'),
      to: new Date('2026-01-31'),
    });

    expect(result).toEqual({
      recordCount: 3,
      employeeCount: 2,
      totalHoursWorked: 24.5,
      totalOvertimeHours: 3,
    });
  });

  it('excludes still-open clock-ins with no hoursWorked', async () => {
    tx.attendanceRecord.findMany.mockResolvedValue([]);
    const from = new Date('2026-01-01');
    const to = new Date('2026-01-31');

    await repository.summarize('tenant-1', { from, to });

    expect(tx.attendanceRecord.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
        date: { gte: from, lte: to },
        hoursWorked: { not: null },
        employee: undefined,
      },
      select: { employeeId: true, hoursWorked: true, overtimeHours: true },
    });
  });
});
