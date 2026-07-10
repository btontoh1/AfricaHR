import { PrismaService } from '@africahr/platform-database';
import { NotificationUserRepository } from './notification-user.repository';

describe('NotificationUserRepository', () => {
  let repository: NotificationUserRepository;
  let tx: { user: { findFirst: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { user: { findFirst: jest.fn() } };
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
});
