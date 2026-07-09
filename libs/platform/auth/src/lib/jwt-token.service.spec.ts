import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from './jwt-token.service';
import { SystemRole } from './system-role';
import { JwtPayload } from './jwt-payload.interface';

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let jwtService: jest.Mocked<JwtService>;

  const payload: JwtPayload = {
    sub: 'user-1',
    email: 'admin@africahr.com',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
  };

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    service = new JwtTokenService(jwtService);
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
});
