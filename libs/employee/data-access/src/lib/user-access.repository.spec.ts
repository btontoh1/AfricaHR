import { PrismaService } from '@africahr/platform-database';
import { UserAccessRepository } from './user-access.repository';

describe('UserAccessRepository', () => {
  let repository: UserAccessRepository;
  let tx: { user: { update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { user: { update: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new UserAccessRepository(prisma as unknown as PrismaService);
  });

  it('deactivates the linked user within the tenant context', async () => {
    await repository.deactivate('tenant-1', 'user-1', 'hr-1');

    expect(prisma.withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isActive: false, updatedBy: 'hr-1' },
    });
  });
});
