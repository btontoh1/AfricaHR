import { PrismaService } from '@africahr/platform-database';
import { AttendanceEmployeeRepository } from './attendance-employee.repository';

describe('AttendanceEmployeeRepository', () => {
  let repository: AttendanceEmployeeRepository;
  let tx: { employee: { findFirst: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { employee: { findFirst: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new AttendanceEmployeeRepository(prisma as unknown as PrismaService);
  });

  it('resolves an employee by userId, scoped to the tenant, selecting only id/userId', async () => {
    await repository.findByUserId('tenant-1', 'user-1');

    expect(tx.employee.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', userId: 'user-1', deletedAt: null },
      select: { id: true, userId: true },
    });
  });

  it('finds an employee by id, scoped to the tenant', async () => {
    await repository.findById('tenant-1', 'emp-1');

    expect(tx.employee.findFirst).toHaveBeenCalledWith({
      where: { id: 'emp-1', tenantId: 'tenant-1', deletedAt: null },
      select: { id: true, userId: true },
    });
  });

  describe('isPinLookupHashTaken', () => {
    it('excludes terminated employees, matching the partial unique index backing this check', async () => {
      await repository.isPinLookupHashTaken('tenant-1', 'hash-1', 'emp-1');

      expect(tx.employee.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          clockInPinLookupHash: 'hash-1',
          deletedAt: null,
          employmentStatus: { not: 'TERMINATED' },
          id: { not: 'emp-1' },
        },
        select: { id: true },
      });
    });
  });
});
