import { PrismaService } from '@africahr/platform-database';
import { RefreshTokenRepository } from './refresh-token.repository';

describe('RefreshTokenRepository', () => {
  let repository: RefreshTokenRepository;
  let tokenDelegate: {
    create: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  let withTenantContext: jest.Mock;
  let prisma: { refreshToken: typeof tokenDelegate; withTenantContext: jest.Mock };

  beforeEach(() => {
    tokenDelegate = {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    };
    withTenantContext = jest.fn((_tenantId, fn) => fn({ refreshToken: tokenDelegate }));
    prisma = { refreshToken: tokenDelegate, withTenantContext };

    repository = new RefreshTokenRepository(prisma as unknown as PrismaService);
  });

  it('findByTokenHash bypasses tenant scoping', async () => {
    await repository.findByTokenHash('hash-abc');

    expect(withTenantContext).not.toHaveBeenCalled();
    expect(tokenDelegate.findFirst).toHaveBeenCalledWith({
      where: { tokenHash: 'hash-abc', revokedAt: null },
    });
  });

  it('creates a token for a platform admin (tenantId null) without scoping', async () => {
    await repository.create({
      tenantId: null,
      userId: 'user-1',
      tokenHash: 'hash-abc',
      expiresAt: new Date(),
    });

    expect(withTenantContext).not.toHaveBeenCalled();
  });

  it('creates a tenant user token within tenant scope', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      userId: 'user-1',
      tokenHash: 'hash-abc',
      expiresAt: new Date(),
    });

    expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
  });

  it('revokeAllForUser revokes every active token for the user', async () => {
    await repository.revokeAllForUser('tenant-1', 'user-1');

    expect(tokenDelegate.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
