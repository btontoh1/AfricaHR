import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenService } from './jwt-token.service';
import { TokenRevocationService } from './token-revocation.service';
import { SystemRole } from './system-role';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let tokens: jest.Mocked<JwtTokenService>;
  let revocation: jest.Mocked<TokenRevocationService>;

  function contextWithHeader(authorization?: string) {
    const request = { headers: { authorization } } as unknown as AuthenticatedRequest;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { context, request };
  }

  beforeEach(() => {
    tokens = { verifyAccessToken: jest.fn() } as unknown as jest.Mocked<JwtTokenService>;
    revocation = { isRevoked: jest.fn().mockResolvedValue(false) } as unknown as jest.Mocked<TokenRevocationService>;
    guard = new JwtAuthGuard(tokens, revocation);
  });

  it('throws when the Authorization header is missing', async () => {
    const { context } = contextWithHeader(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('throws when the header is not a Bearer token', async () => {
    const { context } = contextWithHeader('Basic abc123');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches the verified user to the request and allows the request through', async () => {
    const user = {
      sub: 'user-1',
      email: 'admin@africahr.com',
      role: SystemRole.PLATFORM_ADMIN,
      tenantId: null,
      iat: 1,
      exp: 2,
    };
    tokens.verifyAccessToken.mockReturnValue(user);

    const { context, request } = contextWithHeader('Bearer good-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(tokens.verifyAccessToken).toHaveBeenCalledWith('good-token');
    expect(revocation.isRevoked).toHaveBeenCalledWith('user-1', 1);
    expect(request.user).toEqual(user);
  });

  it('throws when the token has been revoked', async () => {
    const user = {
      sub: 'user-1',
      email: 'admin@africahr.com',
      role: SystemRole.PLATFORM_ADMIN,
      tenantId: null,
      iat: 1,
      exp: 2,
    };
    tokens.verifyAccessToken.mockReturnValue(user);
    revocation.isRevoked.mockResolvedValue(true);

    const { context } = contextWithHeader('Bearer revoked-token');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
