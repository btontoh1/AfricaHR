import { SystemRole } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { NotificationUserRepository } from './notification-user.repository';

describe('NotificationUserRepository', () => {
  let repository: NotificationUserRepository;
  let tx: { user: { findFirst: jest.Mock; findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { user: { findFirst: jest.fn(), findMany: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new NotificationUserRepository(prisma as unknown as PrismaService);
  });

  it('selects only id and email, scoped to the tenant', async () => {
    tx.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'ama@example.com' });

    const result = await repository.findById('tenant-1', 'user-1');

    expect(result).toEqual({ id: 'user-1', email: 'ama@example.com' });
    expect(tx.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-1', tenantId: 'tenant-1', deletedAt: null },
      select: { id: true, email: true },
    });
  });

  it('returns null when the user does not exist in this tenant', async () => {
    tx.user.findFirst.mockResolvedValue(null);

    await expect(repository.findById('tenant-1', 'missing')).resolves.toBeNull();
  });

  describe('listActiveUserIdsByRole', () => {
    it('returns the ids of active, non-deleted users holding any of the given roles', async () => {
      tx.user.findMany.mockResolvedValue([{ id: 'admin-1' }, { id: 'hr-1' }]);

      const result = await repository.listActiveUserIdsByRole('tenant-1', [
        SystemRole.TENANT_ADMIN,
        SystemRole.HR_MANAGER,
      ]);

      expect(result).toEqual(['admin-1', 'hr-1']);
      expect(tx.user.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          role: { in: [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER] },
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });
    });

    it('returns an empty array when no user holds any of the given roles', async () => {
      tx.user.findMany.mockResolvedValue([]);

      await expect(
        repository.listActiveUserIdsByRole('tenant-1', [SystemRole.TENANT_ADMIN]),
      ).resolves.toEqual([]);
    });
  });
});
