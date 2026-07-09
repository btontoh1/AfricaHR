import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenService } from './jwt-token.service';
import { SystemRole } from './system-role';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let tokens: jest.Mocked<JwtTokenService>;

  function contextWithHeader(authorization?: string) {
    const request = { headers: { authorization } } as unknown as AuthenticatedRequest;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { context, request };
  }

  beforeEach(() => {
    tokens = { verifyAccessToken: jest.fn() } as unknown as jest.Mocked<JwtTokenService>;
    guard = new JwtAuthGuard(tokens);
  });

  it('throws when the Authorization header is missing', () => {
    const { context } = contextWithHeader(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws when the header is not a Bearer token', () => {
    const { context } = contextWithHeader('Basic abc123');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('attaches the verified user to the request and allows the request through', () => {
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

    expect(guard.canActivate(context)).toBe(true);
    expect(tokens.verifyAccessToken).toHaveBeenCalledWith('good-token');
    expect(request.user).toEqual(user);
  });
});
