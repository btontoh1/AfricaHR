import { randomBytes } from 'node:crypto';
import { TOTP, Secret } from 'otpauth';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';
import { RequestUser, SystemRole, TokenRevocationService } from '@africahr/platform-auth';
import { AppConfigService } from '@africahr/platform-core';
import { AuditService } from '@africahr/platform-audit';
import {
  MfaBackupCodeRepository,
  MfaTrustedDeviceRepository,
  RefreshTokenRepository,
  UserRepository,
} from '@africahr/iam-data-access';
import { encryptMfaSecret, generateTotpSecret, hashBackupCode, hashDeviceToken } from '@africahr/iam-domain';
import { MfaService } from './mfa.service';

jest.mock('argon2');

const validEncryptionKey = randomBytes(32).toString('hex');

function codeFor(secretBase32: string): string {
  return new TOTP({ secret: Secret.fromBase32(secretBase32) }).generate();
}

describe('MfaService', () => {
  let service: MfaService;
  let users: jest.Mocked<UserRepository>;
  let backupCodes: jest.Mocked<MfaBackupCodeRepository>;
  let trustedDevices: jest.Mocked<MfaTrustedDeviceRepository>;
  let refreshTokens: jest.Mocked<RefreshTokenRepository>;
  let revocation: jest.Mocked<TokenRevocationService>;
  let audit: jest.Mocked<AuditService>;

  const actor: RequestUser = {
    sub: 'user-1',
    email: 'ama@acme.com',
    role: SystemRole.EMPLOYEE,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  function makeUser(overrides: Partial<User> = {}): User {
    return {
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'ama@acme.com',
      passwordHash: 'hashed-password',
      firstName: 'Ama',
      lastName: 'Owusu',
      role: SystemRole.EMPLOYEE,
      isActive: true,
      lastLoginAt: null,
      mfaEnabled: false,
      mfaSecretEncrypted: null,
      mfaEnabledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as User;
  }

  beforeEach(() => {
    users = {
      findById: jest.fn(),
      setPendingMfaSecret: jest.fn(),
      enableMfa: jest.fn(),
      clearMfa: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    backupCodes = {
      createMany: jest.fn(),
      deleteAllForUser: jest.fn(),
      findUnused: jest.fn(),
      markUsed: jest.fn(),
    } as unknown as jest.Mocked<MfaBackupCodeRepository>;

    trustedDevices = {
      create: jest.fn(),
      findValid: jest.fn(),
      deleteAllForUser: jest.fn(),
    } as unknown as jest.Mocked<MfaTrustedDeviceRepository>;

    refreshTokens = {
      revokeAllForUser: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenRepository>;

    revocation = {
      revokeAllForUser: jest.fn(),
    } as unknown as jest.Mocked<TokenRevocationService>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    const config = { mfaEncryptionKey: validEncryptionKey } as unknown as AppConfigService;

    service = new MfaService(users, backupCodes, trustedDevices, refreshTokens, revocation, audit, config);

    jest.mocked(argon2.verify).mockReset();
  });

  describe('constructor', () => {
    it('throws if MFA_ENCRYPTION_KEY is unset, failing the app boot rather than the first request', () => {
      const badConfig = { mfaEncryptionKey: undefined } as unknown as AppConfigService;

      expect(
        () => new MfaService(users, backupCodes, trustedDevices, refreshTokens, revocation, audit, badConfig),
      ).toThrow(/MFA_ENCRYPTION_KEY must be set/);
    });
  });

  describe('getStatus', () => {
    it('reports disabled for an account with no MFA', async () => {
      users.findById.mockResolvedValue(makeUser({ mfaEnabled: false }));

      await expect(service.getStatus(actor)).resolves.toEqual({ enabled: false });
    });

    it('reports enabled for an account with MFA on', async () => {
      users.findById.mockResolvedValue(makeUser({ mfaEnabled: true }));

      await expect(service.getStatus(actor)).resolves.toEqual({ enabled: true });
    });
  });

  describe('setup', () => {
    it('generates and stores a pending secret, returning it plus an otpauth URI', async () => {
      users.findById.mockResolvedValue(makeUser());

      const result = await service.setup(actor);

      expect(result.secret).toMatch(/^[A-Z2-7]+$/);
      expect(result.otpauthUri).toContain('otpauth://totp/');
      expect(users.setPendingMfaSecret).toHaveBeenCalledWith('tenant-1', 'user-1', expect.any(String));
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'mfa.setup_initiated' }),
      );
    });

    it('rejects setup when MFA is already enabled', async () => {
      users.findById.mockResolvedValue(makeUser({ mfaEnabled: true }));

      await expect(service.setup(actor)).rejects.toThrow(ConflictException);
      expect(users.setPendingMfaSecret).not.toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it('enables MFA and returns backup codes when the code is correct', async () => {
      const secret = generateTotpSecret();
      const encrypted = encryptMfaSecret(secret, Buffer.from(validEncryptionKey, 'hex'));
      users.findById.mockResolvedValue(makeUser({ mfaSecretEncrypted: encrypted }));

      const result = await service.confirm(actor, codeFor(secret));

      expect(result.backupCodes).toHaveLength(10);
      expect(new Set(result.backupCodes).size).toBe(10);
      expect(backupCodes.createMany).toHaveBeenCalledWith('tenant-1', 'user-1', expect.any(Array));
      expect(users.enableMfa).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'mfa.enabled' }));
    });

    it('rejects an incorrect code without enabling MFA', async () => {
      const secret = generateTotpSecret();
      const encrypted = encryptMfaSecret(secret, Buffer.from(validEncryptionKey, 'hex'));
      users.findById.mockResolvedValue(makeUser({ mfaSecretEncrypted: encrypted }));

      await expect(service.confirm(actor, '000000')).rejects.toThrow(UnauthorizedException);
      expect(users.enableMfa).not.toHaveBeenCalled();
      expect(backupCodes.createMany).not.toHaveBeenCalled();
    });

    it('rejects confirm when setup was never called', async () => {
      users.findById.mockResolvedValue(makeUser({ mfaSecretEncrypted: null }));

      await expect(service.confirm(actor, '123456')).rejects.toThrow(BadRequestException);
    });

    it('rejects confirm when MFA is already enabled', async () => {
      users.findById.mockResolvedValue(makeUser({ mfaEnabled: true }));

      await expect(service.confirm(actor, '123456')).rejects.toThrow(ConflictException);
    });
  });

  describe('disable', () => {
    it('clears MFA, deletes backup codes, and revokes every session on a correct password', async () => {
      users.findById.mockResolvedValue(makeUser({ mfaEnabled: true }));
      jest.mocked(argon2.verify).mockResolvedValue(true);

      await service.disable(actor, 'correct-password');

      expect(users.clearMfa).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(backupCodes.deleteAllForUser).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(trustedDevices.deleteAllForUser).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(revocation.revokeAllForUser).toHaveBeenCalledWith('user-1');
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'mfa.disabled' }));
    });

    it('rejects an incorrect password without touching MFA state', async () => {
      users.findById.mockResolvedValue(makeUser({ mfaEnabled: true }));
      jest.mocked(argon2.verify).mockResolvedValue(false);

      await expect(service.disable(actor, 'wrong-password')).rejects.toThrow(UnauthorizedException);
      expect(users.clearMfa).not.toHaveBeenCalled();
      expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
    });

    it('rejects disable when MFA is not enabled', async () => {
      users.findById.mockResolvedValue(makeUser({ mfaEnabled: false }));

      await expect(service.disable(actor, 'any-password')).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyLoginCode', () => {
    const encryptedSecretFor = (secret: string) =>
      encryptMfaSecret(secret, Buffer.from(validEncryptionKey, 'hex'));

    it('accepts a valid TOTP code', async () => {
      const secret = generateTotpSecret();

      const result = await service.verifyLoginCode(
        'tenant-1',
        'user-1',
        encryptedSecretFor(secret),
        codeFor(secret),
      );

      expect(result).toBe(true);
      expect(backupCodes.findUnused).not.toHaveBeenCalled();
    });

    it('falls back to an unused backup code when the TOTP code is wrong', async () => {
      const secret = generateTotpSecret();
      backupCodes.findUnused.mockResolvedValue({ id: 'code-1' });

      const result = await service.verifyLoginCode(
        'tenant-1',
        'user-1',
        encryptedSecretFor(secret),
        'ABCDE-12345',
      );

      expect(result).toBe(true);
      expect(backupCodes.findUnused).toHaveBeenCalledWith('tenant-1', 'user-1', hashBackupCode('ABCDE-12345'));
      expect(backupCodes.markUsed).toHaveBeenCalledWith('tenant-1', 'code-1');
    });

    it('rejects when neither the TOTP code nor any backup code matches', async () => {
      const secret = generateTotpSecret();
      backupCodes.findUnused.mockResolvedValue(null);

      const result = await service.verifyLoginCode(
        'tenant-1',
        'user-1',
        encryptedSecretFor(secret),
        'WRONG-CODE1',
      );

      expect(result).toBe(false);
      expect(backupCodes.markUsed).not.toHaveBeenCalled();
    });
  });

  describe('rememberDevice', () => {
    it('stores a hashed token with a 30-day expiry and returns the raw token', async () => {
      const token = await service.rememberDevice('tenant-1', 'user-1');

      expect(token).toMatch(/^[0-9a-f]{64}$/);
      expect(trustedDevices.create).toHaveBeenCalledWith(
        'tenant-1',
        'user-1',
        hashDeviceToken(token),
        expect.any(Date),
      );

      const [, , , expiresAt] = trustedDevices.create.mock.calls[0];
      const daysUntilExpiry = (expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      expect(daysUntilExpiry).toBeGreaterThan(29);
      expect(daysUntilExpiry).toBeLessThanOrEqual(30);
    });
  });

  describe('isDeviceTrusted', () => {
    it('returns true when a valid record matches the hashed token', async () => {
      trustedDevices.findValid.mockResolvedValue({ id: 'device-1' });

      const result = await service.isDeviceTrusted('tenant-1', 'user-1', 'raw-token');

      expect(result).toBe(true);
      expect(trustedDevices.findValid).toHaveBeenCalledWith('tenant-1', 'user-1', hashDeviceToken('raw-token'));
    });

    it('returns false when no valid record matches', async () => {
      trustedDevices.findValid.mockResolvedValue(null);

      const result = await service.isDeviceTrusted('tenant-1', 'user-1', 'raw-token');

      expect(result).toBe(false);
    });
  });

  describe('forgetAllDevices', () => {
    it('deletes every trusted device without touching MFA state, and records an audit entry', async () => {
      await service.forgetAllDevices(actor);

      expect(trustedDevices.deleteAllForUser).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(users.clearMfa).not.toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'mfa.trusted_devices_forgotten' }),
      );
    });
  });
});
