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
  let withPlatformScope: jest.Mock;
  let queryRaw: jest.Mock;
  let prisma: {
    refreshToken: typeof tokenDelegate;
    withTenantContext: jest.Mock;
    withPlatformScope: jest.Mock;
    $queryRaw: jest.Mock;
  };

  beforeEach(() => {
    tokenDelegate = {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    };
    withTenantContext = jest.fn((_tenantId, fn) => fn({ refreshToken: tokenDelegate }));
    withPlatformScope = jest.fn((fn) => fn({ refreshToken: tokenDelegate }));
    queryRaw = jest.fn();
    prisma = { refreshToken: tokenDelegate, withTenantContext, withPlatformScope, $queryRaw: queryRaw };

    repository = new RefreshTokenRepository(prisma as unknown as PrismaService);
  });

  describe('findByTokenHash', () => {
    it('looks up via the find_refresh_token_by_hash SECURITY DEFINER function, bypassing tenant scoping', async () => {
      const row = {
        id: 'token-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        expiresAt: new Date(),
      };
      queryRaw.mockResolvedValue([row]);

      const result = await repository.findByTokenHash('hash-abc');

      expect(withTenantContext).not.toHaveBeenCalled();
      expect(withPlatformScope).not.toHaveBeenCalled();
      expect(queryRaw).toHaveBeenCalled();
      expect(result).toEqual(row);
    });

    it('returns null when no token matches the hash', async () => {
      queryRaw.mockResolvedValue([]);

      const result = await repository.findByTokenHash('missing-hash');

      expect(result).toBeNull();
    });
  });

  it('creates a token for a platform admin (tenantId null) under the platform scope', async () => {
    await repository.create({
      tenantId: null,
      userId: 'user-1',
      tokenHash: 'hash-abc',
      expiresAt: new Date(),
    });

    expect(withTenantContext).not.toHaveBeenCalled();
    expect(withPlatformScope).toHaveBeenCalledWith(expect.any(Function));
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
