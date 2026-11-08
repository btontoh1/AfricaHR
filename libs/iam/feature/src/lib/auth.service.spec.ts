import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { User, RefreshToken, MfaMethod } from '@prisma/client';
import { JwtTokenService, SystemRole } from '@africahr/platform-auth';
import { AuditService } from '@africahr/platform-audit';
import { RefreshTokenRepository, UserRepository } from '@africahr/iam-data-access';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<UserRepository>;
  let refreshTokens: jest.Mocked<RefreshTokenRepository>;
  let tokens: jest.Mocked<JwtTokenService>;
  let mfa: jest.Mocked<MfaService>;
  let audit: jest.Mocked<AuditService>;

  const user: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    organizationId: null,
    email: 'hr@acme.com',
    passwordHash: 'hashed',
    firstName: 'Kofi',
    lastName: 'Mensah',
    role: SystemRole.HR_MANAGER,
    isActive: true,
    lastLoginAt: null,
    mfaEnabled: false,
    mfaSecretEncrypted: null,
    mfaEnabledAt: null,
    mfaMethod: null,
    phoneNumber: null,
    phoneNumberVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(() => {
    users = {
      findByEmail: jest.fn(),
      findByEmailInTenant: jest.fn(),
      findById: jest.fn(),
      updateLastLogin: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    refreshTokens = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      revoke: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenRepository>;

    tokens = {
      signAccessToken: jest.fn().mockReturnValue('access-token'),
      signMfaChallengeToken: jest.fn().mockReturnValue('challenge-token'),
      verifyMfaChallengeToken: jest.fn(),
    } as unknown as jest.Mocked<JwtTokenService>;

    mfa = {
      verifyLoginCode: jest.fn(),
      verifySmsLoginCode: jest.fn(),
      sendLoginSmsCode: jest.fn().mockResolvedValue(undefined),
      isDeviceTrusted: jest.fn().mockResolvedValue(false),
      rememberDevice: jest.fn(),
    } as unknown as jest.Mocked<MfaService>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new AuthService(users, refreshTokens, tokens, mfa, audit);
  });

  describe('login', () => {
    it('rejects an unknown email without revealing which field was wrong', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(service.login({ email: 'nobody@acme.com', password: 'x' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a deactivated user', async () => {
      users.findByEmail.mockResolvedValue({ ...user, isActive: false });

      await expect(service.login({ email: user.email, password: 'x' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects an incorrect password', async () => {
      users.findByEmail.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: user.email, password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('issues a token pair and records login on success', async () => {
      users.findByEmail.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      users.updateLastLogin.mockResolvedValue(user);
      refreshTokens.create.mockResolvedValue({} as RefreshToken);

      const result = await service.login({ email: user.email, password: 'correct' });
      if ('mfaRequired' in result) {
        throw new Error('expected a token pair, got an MFA challenge');
      }

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toHaveLength(64); // 32 bytes hex-encoded
      expect(users.updateLastLogin).toHaveBeenCalledWith(user.tenantId, user.id);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.login', actorUserId: user.id }),
      );
    });

    it('embeds organizationId in the signed access token for an ORG_ADMIN', async () => {
      users.findByEmail.mockResolvedValue({
        ...user,
        role: SystemRole.ORG_ADMIN,
        organizationId: 'org-1',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      users.updateLastLogin.mockResolvedValue(user);
      refreshTokens.create.mockResolvedValue({} as RefreshToken);

      await service.login({ email: user.email, password: 'correct' });

      expect(tokens.signAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({ role: SystemRole.ORG_ADMIN, organizationId: 'org-1' }),
      );
    });

    it('issues an MFA challenge instead of tokens when MFA is enabled, without touching lastLoginAt', async () => {
      users.findByEmail.mockResolvedValue({ ...user, mfaEnabled: true });
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: user.email, password: 'correct' });

      expect(result).toEqual({ mfaRequired: true, challengeToken: 'challenge-token', mfaMethod: MfaMethod.TOTP });
      expect(tokens.signMfaChallengeToken).toHaveBeenCalledWith({ sub: user.id, tenantId: user.tenantId });
      expect(users.updateLastLogin).not.toHaveBeenCalled();
      expect(refreshTokens.create).not.toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.mfa_challenge_issued', actorUserId: user.id }),
      );
    });

    it('skips the MFA challenge and issues real tokens when a valid trusted-device token is presented', async () => {
      users.findByEmail.mockResolvedValue({ ...user, mfaEnabled: true });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mfa.isDeviceTrusted.mockResolvedValue(true);
      users.updateLastLogin.mockResolvedValue(user);
      refreshTokens.create.mockResolvedValue({} as RefreshToken);

      const result = await service.login({ email: user.email, password: 'correct' }, {}, 'device-token');
      if ('mfaRequired' in result) {
        throw new Error('expected a token pair, got an MFA challenge');
      }

      expect(mfa.isDeviceTrusted).toHaveBeenCalledWith(user.tenantId, user.id, 'device-token');
      expect(result.accessToken).toBe('access-token');
      expect(tokens.signMfaChallengeToken).not.toHaveBeenCalled();
      expect(users.updateLastLogin).toHaveBeenCalledWith(user.tenantId, user.id);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.login', actorUserId: user.id, metadata: { via: 'trusted_device' } }),
      );
    });

    it('still issues a challenge when the presented device token is invalid or untrusted', async () => {
      users.findByEmail.mockResolvedValue({ ...user, mfaEnabled: true });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mfa.isDeviceTrusted.mockResolvedValue(false);

      const result = await service.login({ email: user.email, password: 'correct' }, {}, 'bad-device-token');

      expect(result).toEqual({ mfaRequired: true, challengeToken: 'challenge-token', mfaMethod: MfaMethod.TOTP });
    });

    it('texts a login code and returns the phone last-4 for an SMS-method account', async () => {
      users.findByEmail.mockResolvedValue({
        ...user,
        mfaEnabled: true,
        mfaMethod: MfaMethod.SMS,
        phoneNumber: '+233201234567',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: user.email, password: 'correct' });

      expect(mfa.sendLoginSmsCode).toHaveBeenCalledWith(user.id, '+233201234567');
      expect(result).toEqual({
        mfaRequired: true,
        challengeToken: 'challenge-token',
        mfaMethod: MfaMethod.SMS,
        phoneLast4: '4567',
      });
    });
  });

  describe('loginForTenant', () => {
    it('looks up the user scoped to the given tenant, not the global lookup', async () => {
      users.findByEmailInTenant.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      users.updateLastLogin.mockResolvedValue(user);
      refreshTokens.create.mockResolvedValue({} as RefreshToken);

      await service.loginForTenant('tenant-1', { email: user.email, password: 'correct' });

      expect(users.findByEmailInTenant).toHaveBeenCalledWith('tenant-1', user.email);
      expect(users.findByEmail).not.toHaveBeenCalled();
    });

    it('rejects when the user does not belong to that tenant', async () => {
      users.findByEmailInTenant.mockResolvedValue(null);

      await expect(
        service.loginForTenant('tenant-2', { email: user.email, password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a deactivated user', async () => {
      users.findByEmailInTenant.mockResolvedValue({ ...user, isActive: false });

      await expect(
        service.loginForTenant('tenant-1', { email: user.email, password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      users.findByEmailInTenant.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.loginForTenant('tenant-1', { email: user.email, password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('issues a token pair and records login on success', async () => {
      users.findByEmailInTenant.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      users.updateLastLogin.mockResolvedValue(user);
      refreshTokens.create.mockResolvedValue({} as RefreshToken);

      const result = await service.loginForTenant('tenant-1', {
        email: user.email,
        password: 'correct',
      });
      if ('mfaRequired' in result) {
        throw new Error('expected a token pair, got an MFA challenge');
      }

      expect(result.accessToken).toBe('access-token');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.login', actorUserId: user.id }),
      );
    });
  });

  describe('verifyMfa', () => {
    const mfaUser: User = { ...user, mfaEnabled: true, mfaSecretEncrypted: 'encrypted-secret' };

    it('rejects an invalid or expired challenge token', async () => {
      tokens.verifyMfaChallengeToken.mockImplementation(() => {
        throw new UnauthorizedException('Invalid or expired MFA challenge');
      });

      await expect(service.verifyMfa('bad-token', '123456')).rejects.toThrow(UnauthorizedException);
      expect(users.findById).not.toHaveBeenCalled();
    });

    it('rejects when the user no longer has MFA enabled', async () => {
      tokens.verifyMfaChallengeToken.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-1', iat: 1, exp: 2 });
      users.findById.mockResolvedValue({ ...user, mfaEnabled: false });

      await expect(service.verifyMfa('challenge-token', '123456')).rejects.toThrow(UnauthorizedException);
      expect(mfa.verifyLoginCode).not.toHaveBeenCalled();
    });

    it('rejects an incorrect code without issuing tokens', async () => {
      tokens.verifyMfaChallengeToken.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-1', iat: 1, exp: 2 });
      users.findById.mockResolvedValue(mfaUser);
      mfa.verifyLoginCode.mockResolvedValue(false);

      await expect(service.verifyMfa('challenge-token', '000000')).rejects.toThrow(UnauthorizedException);
      expect(refreshTokens.create).not.toHaveBeenCalled();
      expect(users.updateLastLogin).not.toHaveBeenCalled();
    });

    it('issues a token pair, updates lastLoginAt, and records login on a correct code', async () => {
      tokens.verifyMfaChallengeToken.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-1', iat: 1, exp: 2 });
      users.findById.mockResolvedValue(mfaUser);
      mfa.verifyLoginCode.mockResolvedValue(true);
      users.updateLastLogin.mockResolvedValue(mfaUser);
      refreshTokens.create.mockResolvedValue({} as RefreshToken);

      const result = await service.verifyMfa('challenge-token', '123456');

      expect(mfa.verifyLoginCode).toHaveBeenCalledWith('tenant-1', 'user-1', 'encrypted-secret', '123456');
      expect(result.accessToken).toBe('access-token');
      expect(users.updateLastLogin).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.login', actorUserId: 'user-1', metadata: { via: 'mfa' } }),
      );
    });

    it('does not mint a device token when rememberDevice is not set', async () => {
      tokens.verifyMfaChallengeToken.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-1', iat: 1, exp: 2 });
      users.findById.mockResolvedValue(mfaUser);
      mfa.verifyLoginCode.mockResolvedValue(true);
      refreshTokens.create.mockResolvedValue({} as RefreshToken);

      const result = await service.verifyMfa('challenge-token', '123456');

      expect(mfa.rememberDevice).not.toHaveBeenCalled();
      expect(result.deviceToken).toBeUndefined();
    });

    it('mints and returns a device token when rememberDevice is true', async () => {
      tokens.verifyMfaChallengeToken.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-1', iat: 1, exp: 2 });
      users.findById.mockResolvedValue(mfaUser);
      mfa.verifyLoginCode.mockResolvedValue(true);
      mfa.rememberDevice.mockResolvedValue('raw-device-token');
      refreshTokens.create.mockResolvedValue({} as RefreshToken);

      const result = await service.verifyMfa('challenge-token', '123456', {}, true);

      expect(mfa.rememberDevice).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(result.deviceToken).toBe('raw-device-token');
    });

    it('verifies against verifySmsLoginCode (not verifyLoginCode) for an SMS-method account', async () => {
      const smsUser: User = { ...user, mfaEnabled: true, mfaMethod: MfaMethod.SMS, phoneNumber: '+233201234567' };
      tokens.verifyMfaChallengeToken.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-1', iat: 1, exp: 2 });
      users.findById.mockResolvedValue(smsUser);
      mfa.verifySmsLoginCode.mockResolvedValue(true);
      users.updateLastLogin.mockResolvedValue(smsUser);
      refreshTokens.create.mockResolvedValue({} as RefreshToken);

      const result = await service.verifyMfa('challenge-token', '123456');

      expect(mfa.verifySmsLoginCode).toHaveBeenCalledWith('tenant-1', 'user-1', '123456');
      expect(mfa.verifyLoginCode).not.toHaveBeenCalled();
      expect(result.accessToken).toBe('access-token');
    });

    it('rejects an SMS-method account with no mfaSecretEncrypted (there is none to check)', async () => {
      const smsUser: User = { ...user, mfaEnabled: true, mfaMethod: MfaMethod.SMS, phoneNumber: '+233201234567' };
      tokens.verifyMfaChallengeToken.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-1', iat: 1, exp: 2 });
      users.findById.mockResolvedValue(smsUser);
      mfa.verifySmsLoginCode.mockResolvedValue(false);

      await expect(service.verifyMfa('challenge-token', '000000')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resendMfaSms', () => {
    it('re-sends the login code for an SMS-method account', async () => {
      tokens.verifyMfaChallengeToken.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-1', iat: 1, exp: 2 });
      users.findById.mockResolvedValue({
        ...user,
        mfaEnabled: true,
        mfaMethod: MfaMethod.SMS,
        phoneNumber: '+233201234567',
      });

      await service.resendMfaSms('challenge-token');

      expect(mfa.sendLoginSmsCode).toHaveBeenCalledWith('user-1', '+233201234567');
    });

    it('rejects a TOTP-method account - there is nothing to resend', async () => {
      tokens.verifyMfaChallengeToken.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-1', iat: 1, exp: 2 });
      users.findById.mockResolvedValue({ ...user, mfaEnabled: true, mfaMethod: MfaMethod.TOTP });

      await expect(service.resendMfaSms('challenge-token')).rejects.toThrow(BadRequestException);
      expect(mfa.sendLoginSmsCode).not.toHaveBeenCalled();
    });

    it('rejects an invalid or expired challenge token', async () => {
      tokens.verifyMfaChallengeToken.mockImplementation(() => {
        throw new UnauthorizedException('Invalid or expired MFA challenge');
      });

      await expect(service.resendMfaSms('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const existingToken: RefreshToken = {
      id: 'rt-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      tokenHash: 'irrelevant-in-test',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
    };

    it('rejects an unknown token', async () => {
      refreshTokens.findByTokenHash.mockResolvedValue(null);

      await expect(service.refresh('raw-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an expired token', async () => {
      refreshTokens.findByTokenHash.mockResolvedValue({
        ...existingToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh('raw-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rotates the token and issues a new pair on success', async () => {
      refreshTokens.findByTokenHash.mockResolvedValue(existingToken);
      users.findById.mockResolvedValue(user);
      refreshTokens.revoke.mockResolvedValue(existingToken);
      refreshTokens.create.mockResolvedValue({} as RefreshToken);

      const result = await service.refresh('raw-token');

      expect(refreshTokens.revoke).toHaveBeenCalledWith('tenant-1', 'rt-1');
      expect(result.accessToken).toBe('access-token');
    });
  });

  describe('logout', () => {
    it('is a no-op when the token is not found', async () => {
      refreshTokens.findByTokenHash.mockResolvedValue(null);

      await service.logout('raw-token');

      expect(refreshTokens.revoke).not.toHaveBeenCalled();
    });

    it('revokes the token when found', async () => {
      const existing = {
        id: 'rt-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
      } as RefreshToken;
      refreshTokens.findByTokenHash.mockResolvedValue(existing);

      await service.logout('raw-token');

      expect(refreshTokens.revoke).toHaveBeenCalledWith('tenant-1', 'rt-1');
    });
  });
});
