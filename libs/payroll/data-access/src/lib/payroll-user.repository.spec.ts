import { SystemRole } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { PayrollUserRepository } from './payroll-user.repository';

describe('PayrollUserRepository', () => {
  let repository: PayrollUserRepository;
  let tx: { user: { findFirst: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { user: { findFirst: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PayrollUserRepository(prisma as unknown as PrismaService);
  });

  it('queries active, non-deleted users holding any of the given roles, excluding the given user', async () => {
    tx.user.findFirst.mockResolvedValue(null);

    await repository.hasOtherActiveUserWithRole(
      'tenant-1',
      [SystemRole.TENANT_ADMIN, SystemRole.PAYROLL_MANAGER],
      'user-1',
    );

    expect(tx.user.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        role: { in: [SystemRole.TENANT_ADMIN, SystemRole.PAYROLL_MANAGER] },
        isActive: true,
        deletedAt: null,
        id: { not: 'user-1' },
      },
      select: { id: true },
    });
  });

  it('returns true when a match is found', async () => {
    tx.user.findFirst.mockResolvedValue({ id: 'user-2' });

    const result = await repository.hasOtherActiveUserWithRole(
      'tenant-1',
      [SystemRole.TENANT_ADMIN],
      'user-1',
    );

    expect(result).toBe(true);
  });

  it('returns false when no one else qualifies', async () => {
    tx.user.findFirst.mockResolvedValue(null);

    const result = await repository.hasOtherActiveUserWithRole(
      'tenant-1',
      [SystemRole.TENANT_ADMIN],
      'user-1',
    );

    expect(result).toBe(false);
  });
});
