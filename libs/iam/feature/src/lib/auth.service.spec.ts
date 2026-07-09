import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { User, RefreshToken } from '@prisma/client';
import { JwtTokenService, SystemRole } from '@africahr/platform-auth';
import { AuditService } from '@africahr/platform-audit';
import { RefreshTokenRepository, UserRepository } from '@africahr/iam-data-access';
import { AuthService } from './auth.service';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<UserRepository>;
  let refreshTokens: jest.Mocked<RefreshTokenRepository>;
  let tokens: jest.Mocked<JwtTokenService>;
  let audit: jest.Mocked<AuditService>;

  const user: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'hr@acme.com',
    passwordHash: 'hashed',
    firstName: 'Kofi',
    lastName: 'Mensah',
    role: SystemRole.HR_MANAGER,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(() => {
    users = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateLastLogin: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    refreshTokens = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      revoke: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenRepository>;

    tokens = { signAccessToken: jest.fn().mockReturnValue('access-token') } as unknown as jest.Mocked<JwtTokenService>;
    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new AuthService(users, refreshTokens, tokens, audit);
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

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toHaveLength(64); // 32 bytes hex-encoded
      expect(users.updateLastLogin).toHaveBeenCalledWith(user.tenantId, user.id);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.login', actorUserId: user.id }),
      );
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
