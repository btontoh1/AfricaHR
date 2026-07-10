import { PrismaService } from '@africahr/platform-database';
import { LeaveUtilizationReportRepository } from './leave-utilization-report.repository';

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('LeaveUtilizationReportRepository', () => {
  let repository: LeaveUtilizationReportRepository;
  let tx: { leaveBalance: { findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { leaveBalance: { findMany: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new LeaveUtilizationReportRepository(prisma as unknown as PrismaService);
  });

  it('aggregates entitled and used days per leave type', async () => {
    tx.leaveBalance.findMany.mockResolvedValue([
      {
        entitledDays: decimal(15),
        usedDays: decimal(5),
        leaveType: { id: 'lt-1', name: 'Annual Leave' },
      },
      {
        entitledDays: decimal(15),
        usedDays: decimal(3),
        leaveType: { id: 'lt-1', name: 'Annual Leave' },
      },
      {
        entitledDays: decimal(10),
        usedDays: decimal(2),
        leaveType: { id: 'lt-2', name: 'Sick Leave' },
      },
    ]);

    const result = await repository.summarizeByLeaveType('tenant-1', { year: 2026 });

    expect(result).toEqual([
      { leaveTypeId: 'lt-1', leaveTypeName: 'Annual Leave', totalEntitledDays: 30, totalUsedDays: 8 },
      { leaveTypeId: 'lt-2', leaveTypeName: 'Sick Leave', totalEntitledDays: 10, totalUsedDays: 2 },
    ]);
  });

  it('filters by organization through the employee relation', async () => {
    tx.leaveBalance.findMany.mockResolvedValue([]);

    await repository.summarizeByLeaveType('tenant-1', { year: 2026, organizationId: 'org-1' });

    expect(tx.leaveBalance.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        year: 2026,
        leaveTypeId: undefined,
        employee: { organizationId: 'org-1' },
      },
      select: expect.any(Object),
    });
  });
});
