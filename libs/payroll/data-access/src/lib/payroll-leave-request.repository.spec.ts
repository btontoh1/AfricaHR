import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { PayrollLeaveRequestRepository } from './payroll-leave-request.repository';

describe('PayrollLeaveRequestRepository', () => {
  let repository: PayrollLeaveRequestRepository;
  let tx: { leaveRequest: { findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { leaveRequest: { findMany: jest.fn().mockResolvedValue([]) } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PayrollLeaveRequestRepository(prisma as unknown as PrismaService);
  });

  it('queries only APPROVED, non-deleted, unpaid-LeaveType requests entirely within the period', async () => {
    const periodStart = new Date('2026-02-01');
    const periodEnd = new Date('2026-02-28');

    await repository.sumUnpaidDays('tenant-1', 'emp-1', periodStart, periodEnd);

    expect(tx.leaveRequest.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        status: 'APPROVED',
        deletedAt: null,
        startDate: { gte: periodStart },
        endDate: { lte: periodEnd },
        leaveType: { isPaid: false },
      },
      select: { daysRequested: true },
    });
  });

  it('sums daysRequested across every matching request', async () => {
    tx.leaveRequest.findMany.mockResolvedValue([
      { daysRequested: new Prisma.Decimal(2) },
      { daysRequested: new Prisma.Decimal(3) },
    ]);

    const result = await repository.sumUnpaidDays('tenant-1', 'emp-1', new Date(), new Date());

    expect(result).toBe(5);
  });

  it('returns 0 when there are no matching requests', async () => {
    const result = await repository.sumUnpaidDays('tenant-1', 'emp-1', new Date(), new Date());

    expect(result).toBe(0);
  });
});
