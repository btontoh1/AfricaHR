import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenService } from './jwt-token.service';
import { TokenRevocationService } from './token-revocation.service';
import { SystemRole } from './system-role';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let tokens: jest.Mocked<JwtTokenService>;
  let revocation: jest.Mocked<TokenRevocationService>;

  function contextWithHeader(authorization?: string, method = 'GET') {
    const request = { headers: { authorization }, method } as unknown as AuthenticatedRequest;
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
      organizationId: null,
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
      organizationId: null,
      iat: 1,
      exp: 2,
    };
    tokens.verifyAccessToken.mockReturnValue(user);
    revocation.isRevoked.mockResolvedValue(true);

    const { context } = contextWithHeader('Bearer revoked-token');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  describe('impersonation read-only enforcement', () => {
    const impersonatingUser = {
      sub: 'target-user-1',
      email: 'sheriff.armarh@nalag.com',
      role: SystemRole.TENANT_ADMIN,
      tenantId: 'tenant-1',
      organizationId: null,
      act: { sub: 'admin-1', email: 'baffour@parothr.com' },
      iat: 1,
      exp: 2,
    };

    it('allows a GET request while impersonating', async () => {
      tokens.verifyAccessToken.mockReturnValue(impersonatingUser);
      const { context } = contextWithHeader('Bearer impersonation-token', 'GET');

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('blocks a POST request while impersonating', async () => {
      tokens.verifyAccessToken.mockReturnValue(impersonatingUser);
      const { context } = contextWithHeader('Bearer impersonation-token', 'POST');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('blocks a DELETE request while impersonating', async () => {
      tokens.verifyAccessToken.mockReturnValue(impersonatingUser);
      const { context } = contextWithHeader('Bearer impersonation-token', 'DELETE');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('allows a POST request for a normal (non-impersonating) session', async () => {
      const normalUser = {
        sub: 'user-1',
        email: 'admin@africahr.com',
        role: SystemRole.PLATFORM_ADMIN,
        tenantId: null,
        organizationId: null,
        iat: 1,
        exp: 2,
      };
      tokens.verifyAccessToken.mockReturnValue(normalUser);
      const { context } = contextWithHeader('Bearer good-token', 'POST');

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });
  });
});
