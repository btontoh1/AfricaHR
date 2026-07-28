import { PrismaService } from '@africahr/platform-database';
import { MfaTrustedDeviceRepository } from './mfa-trusted-device.repository';

describe('MfaTrustedDeviceRepository', () => {
  let repository: MfaTrustedDeviceRepository;
  let deviceDelegate: { create: jest.Mock; findFirst: jest.Mock; deleteMany: jest.Mock };
  let withTenantContext: jest.Mock;
  let withPlatformScope: jest.Mock;
  let prisma: {
    mfaTrustedDevice: typeof deviceDelegate;
    withTenantContext: jest.Mock;
    withPlatformScope: jest.Mock;
  };

  beforeEach(() => {
    deviceDelegate = { create: jest.fn(), findFirst: jest.fn(), deleteMany: jest.fn() };
    withTenantContext = jest.fn((_tenantId, fn) => fn({ mfaTrustedDevice: deviceDelegate }));
    withPlatformScope = jest.fn((fn) => fn({ mfaTrustedDevice: deviceDelegate }));
    prisma = { mfaTrustedDevice: deviceDelegate, withTenantContext, withPlatformScope };

    repository = new MfaTrustedDeviceRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('inserts a row with the given token hash and expiry within tenant scope', async () => {
      const expiresAt = new Date('2026-08-27T00:00:00Z');
      deviceDelegate.create.mockResolvedValue({ id: 'device-1' });

      await repository.create('tenant-1', 'user-1', 'hash-a', expiresAt);

      expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
      expect(deviceDelegate.create).toHaveBeenCalledWith({
        data: { tenantId: 'tenant-1', userId: 'user-1', tokenHash: 'hash-a', expiresAt },
        select: { id: true },
      });
    });

    it('uses the platform scope for a platform-admin user (tenantId null)', async () => {
      deviceDelegate.create.mockResolvedValue({ id: 'device-1' });

      await repository.create(null, 'user-1', 'hash-a', new Date());

      expect(withTenantContext).not.toHaveBeenCalled();
      expect(withPlatformScope).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('findValid', () => {
    it('looks up an unexpired record by token hash', async () => {
      deviceDelegate.findFirst.mockResolvedValue({ id: 'device-1' });

      const result = await repository.findValid('tenant-1', 'user-1', 'hash-a');

      expect(deviceDelegate.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', tokenHash: 'hash-a', expiresAt: { gt: expect.any(Date) } },
        select: { id: true },
      });
      expect(result).toEqual({ id: 'device-1' });
    });

    it('returns null when no valid record matches (wrong token, wrong user, or expired)', async () => {
      deviceDelegate.findFirst.mockResolvedValue(null);

      const result = await repository.findValid('tenant-1', 'user-1', 'hash-a');

      expect(result).toBeNull();
    });
  });

  describe('deleteAllForUser', () => {
    it('deletes every trusted device for the user', async () => {
      await repository.deleteAllForUser('tenant-1', 'user-1');

      expect(deviceDelegate.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });
  });
});
