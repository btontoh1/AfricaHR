import { SystemRole } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  let repository: UserRepository;
  let userDelegate: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let withTenantContext: jest.Mock;
  let queryRaw: jest.Mock;
  let prisma: { user: typeof userDelegate; withTenantContext: jest.Mock; $queryRaw: jest.Mock };

  beforeEach(() => {
    userDelegate = {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    withTenantContext = jest.fn((_tenantId, fn) => fn({ user: userDelegate }));
    queryRaw = jest.fn().mockResolvedValue([]);
    prisma = { user: userDelegate, withTenantContext, $queryRaw: queryRaw };

    repository = new UserRepository(prisma as unknown as PrismaService);
  });

  describe('findByEmail', () => {
    it('looks up via the find_user_for_login SECURITY DEFINER function, bypassing tenant scoping', async () => {
      const row = {
        id: 'user-1',
        tenantId: 'tenant-1',
        email: 'admin@africahr.com',
        passwordHash: 'hash',
        firstName: 'Ama',
        lastName: 'Owusu',
        role: SystemRole.HR_MANAGER,
        isActive: true,
      };
      queryRaw.mockResolvedValue([row]);

      const result = await repository.findByEmail('admin@africahr.com');

      expect(withTenantContext).not.toHaveBeenCalled();
      expect(queryRaw).toHaveBeenCalled();
      expect(result).toEqual(row);
    });

    it('returns null when no user matches the email', async () => {
      queryRaw.mockResolvedValue([]);

      const result = await repository.findByEmail('missing@africahr.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a platform admin (tenantId null) without tenant scoping', async () => {
      await repository.create({
        tenantId: null,
        email: 'admin@africahr.com',
        passwordHash: 'hash',
        firstName: 'Ama',
        lastName: 'Owusu',
        role: SystemRole.PLATFORM_ADMIN,
      });

      expect(withTenantContext).not.toHaveBeenCalled();
      expect(userDelegate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ tenantId: null, role: SystemRole.PLATFORM_ADMIN }),
      });
    });

    it('creates a tenant user within tenant scope', async () => {
      await repository.create({
        tenantId: 'tenant-1',
        email: 'hr@acme.com',
        passwordHash: 'hash',
        firstName: 'Kofi',
        lastName: 'Mensah',
        role: SystemRole.HR_MANAGER,
      });

      expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
      expect(userDelegate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ tenantId: 'tenant-1' }),
      });
    });
  });

  describe('listByTenant', () => {
    it('lists within tenant scope', async () => {
      await repository.listByTenant('tenant-1');

      expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
      expect(userDelegate.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
    });
  });
});
