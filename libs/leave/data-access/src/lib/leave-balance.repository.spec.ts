import { PrismaService } from '@africahr/platform-database';
import { LeaveBalanceRepository } from './leave-balance.repository';

describe('LeaveBalanceRepository', () => {
  let repository: LeaveBalanceRepository;
  let tx: { leaveBalance: { upsert: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      leaveBalance: { upsert: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new LeaveBalanceRepository(prisma as unknown as PrismaService);
  });

  it('upserts the entitlement on the compound (tenant, employee, leaveType, year) key', async () => {
    await repository.upsertEntitlement('tenant-1', {
      employeeId: 'emp-1',
      leaveTypeId: 'lt-1',
      year: 2026,
      entitledDays: 15,
      actorId: 'hr-1',
    });

    expect(tx.leaveBalance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_employeeId_leaveTypeId_year: {
            tenantId: 'tenant-1',
            employeeId: 'emp-1',
            leaveTypeId: 'lt-1',
            year: 2026,
          },
        },
        create: expect.objectContaining({ entitledDays: 15 }),
        update: expect.objectContaining({ entitledDays: 15 }),
      }),
    );
  });

  it('increments usedDays via a relative Prisma update', async () => {
    await repository.incrementUsedDays('tenant-1', 'bal-1', 5, 'mgr-1');

    expect(tx.leaveBalance.update).toHaveBeenCalledWith({
      where: { id: 'bal-1' },
      data: { usedDays: { increment: 5 }, updatedBy: 'mgr-1' },
    });
  });

  it('decrements usedDays via a relative Prisma update', async () => {
    await repository.decrementUsedDays('tenant-1', 'bal-1', 5, 'mgr-1');

    expect(tx.leaveBalance.update).toHaveBeenCalledWith({
      where: { id: 'bal-1' },
      data: { usedDays: { decrement: 5 }, updatedBy: 'mgr-1' },
    });
  });
});
