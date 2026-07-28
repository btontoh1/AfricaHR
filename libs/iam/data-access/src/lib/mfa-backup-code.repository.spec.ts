import { PrismaService } from '@africahr/platform-database';
import { MfaBackupCodeRepository } from './mfa-backup-code.repository';

describe('MfaBackupCodeRepository', () => {
  let repository: MfaBackupCodeRepository;
  let codeDelegate: { createMany: jest.Mock; deleteMany: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
  let withTenantContext: jest.Mock;
  let withPlatformScope: jest.Mock;
  let prisma: {
    mfaBackupCode: typeof codeDelegate;
    withTenantContext: jest.Mock;
    withPlatformScope: jest.Mock;
  };

  beforeEach(() => {
    codeDelegate = { createMany: jest.fn(), deleteMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() };
    withTenantContext = jest.fn((_tenantId, fn) => fn({ mfaBackupCode: codeDelegate }));
    withPlatformScope = jest.fn((fn) => fn({ mfaBackupCode: codeDelegate }));
    prisma = { mfaBackupCode: codeDelegate, withTenantContext, withPlatformScope };

    repository = new MfaBackupCodeRepository(prisma as unknown as PrismaService);
  });

  describe('createMany', () => {
    it('inserts one row per code hash within tenant scope', async () => {
      await repository.createMany('tenant-1', 'user-1', ['hash-a', 'hash-b']);

      expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
      expect(codeDelegate.createMany).toHaveBeenCalledWith({
        data: [
          { tenantId: 'tenant-1', userId: 'user-1', codeHash: 'hash-a' },
          { tenantId: 'tenant-1', userId: 'user-1', codeHash: 'hash-b' },
        ],
      });
    });

    it('uses the platform scope for a platform-admin user (tenantId null)', async () => {
      await repository.createMany(null, 'user-1', ['hash-a']);

      expect(withTenantContext).not.toHaveBeenCalled();
      expect(withPlatformScope).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('deleteAllForUser', () => {
    it('deletes every backup code for the user', async () => {
      await repository.deleteAllForUser('tenant-1', 'user-1');

      expect(codeDelegate.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });
  });

  describe('findUnused', () => {
    it('looks up an unused code by hash', async () => {
      codeDelegate.findFirst.mockResolvedValue({ id: 'code-1' });

      const result = await repository.findUnused('tenant-1', 'user-1', 'hash-a');

      expect(codeDelegate.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', codeHash: 'hash-a', usedAt: null },
        select: { id: true },
      });
      expect(result).toEqual({ id: 'code-1' });
    });

    it('returns null when no unused code matches (wrong code or already spent)', async () => {
      codeDelegate.findFirst.mockResolvedValue(null);

      const result = await repository.findUnused('tenant-1', 'user-1', 'hash-a');

      expect(result).toBeNull();
    });
  });

  describe('markUsed', () => {
    it('stamps usedAt on the given code', async () => {
      codeDelegate.update.mockResolvedValue({ id: 'code-1' });

      await repository.markUsed('tenant-1', 'code-1');

      expect(codeDelegate.update).toHaveBeenCalledWith({
        where: { id: 'code-1' },
        data: { usedAt: expect.any(Date) },
        select: { id: true },
      });
    });
  });
});
