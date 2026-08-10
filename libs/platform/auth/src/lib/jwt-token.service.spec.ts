import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '@africahr/platform-core';
import { JwtTokenService } from './jwt-token.service';
import { SystemRole } from './system-role';
import { JwtPayload } from './jwt-payload.interface';

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let jwtService: jest.Mocked<JwtService>;
  let config: jest.Mocked<AppConfigService>;

  const payload: JwtPayload = {
    sub: 'user-1',
    email: 'admin@africahr.com',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
    organizationId: null,
  };

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    config = { jwtRefreshSecret: 'refresh-secret-at-least-32-chars-long' } as unknown as jest.Mocked<AppConfigService>;

    service = new JwtTokenService(jwtService, config);
  });

  it('signs an access token with a 15 minute expiry', () => {
    const token = service.signAccessToken(payload);

    expect(token).toBe('signed-token');
    expect(jwtService.sign).toHaveBeenCalledWith(payload, { expiresIn: '15m' });
  });

  it('verifies a valid token and returns its payload', () => {
    jwtService.verify.mockReturnValue({ ...payload, iat: 1, exp: 2 });

    const result = service.verifyAccessToken('valid-token');

    expect(result).toEqual({ ...payload, iat: 1, exp: 2 });
  });

  it('throws UnauthorizedException for an invalid token', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    expect(() => service.verifyAccessToken('bad-token')).toThrow(UnauthorizedException);
  });

  describe('MFA challenge tokens', () => {
    it('signs with JWT_REFRESH_SECRET and a 5 minute expiry, not the access secret', () => {
      const token = service.signMfaChallengeToken({ sub: 'user-1', tenantId: 'tenant-1' });

      expect(token).toBe('signed-token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1', tenantId: 'tenant-1' },
        { secret: config.jwtRefreshSecret, expiresIn: '5m' },
      );
    });

    it('verifies against JWT_REFRESH_SECRET and returns the claims', () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-1', iat: 1, exp: 2 });

      const result = service.verifyMfaChallengeToken('challenge-token');

      expect(jwtService.verify).toHaveBeenCalledWith('challenge-token', { secret: config.jwtRefreshSecret });
      expect(result).toEqual({ sub: 'user-1', tenantId: 'tenant-1', iat: 1, exp: 2 });
    });

    it('throws UnauthorizedException for an invalid or expired challenge token', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      expect(() => service.verifyMfaChallengeToken('bad-token')).toThrow(UnauthorizedException);
    });

    it('verifies with the refresh secret specifically, not whatever the caller might expect', () => {
      jwtService.verify.mockImplementation((_token, options) => {
        if ((options as { secret?: string })?.secret !== config.jwtRefreshSecret) {
          throw new Error('invalid signature');
        }
        return { sub: 'user-1', tenantId: 'tenant-1', iat: 1, exp: 2 };
      });

      expect(() => service.verifyMfaChallengeToken('a-token')).not.toThrow();
      expect(jwtService.verify).toHaveBeenCalledWith('a-token', { secret: config.jwtRefreshSecret });
    });
  });
});
