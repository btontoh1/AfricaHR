import { PrismaService } from '@africahr/platform-database';
import { TokenRevocationService } from '@africahr/platform-auth';
import { UserAccessRepository } from './user-access.repository';

describe('UserAccessRepository', () => {
  let repository: UserAccessRepository;
  let tx: { user: { update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };
  let revocation: jest.Mocked<TokenRevocationService>;

  beforeEach(() => {
    tx = { user: { update: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    revocation = { revokeAllForUser: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<TokenRevocationService>;
    repository = new UserAccessRepository(prisma as unknown as PrismaService, revocation);
  });

  it('deactivates the linked user within the tenant context', async () => {
    await repository.deactivate('tenant-1', 'user-1', 'hr-1');

    expect(prisma.withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isActive: false, updatedBy: 'hr-1' },
    });
  });

  it('revokes any already-issued access token for the user', async () => {
    await repository.deactivate('tenant-1', 'user-1', 'hr-1');

    expect(revocation.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });
});
