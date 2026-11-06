import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtTokenService } from './jwt-token.service';
import { TokenRevocationService } from './token-revocation.service';
import { RequestUser } from './jwt-payload.interface';

/** GET/HEAD/OPTIONS never change state, so they're the only methods an impersonation session (see RequestUser.act) is allowed to make. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: JwtTokenService,
    private readonly revocation: TokenRevocationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const user = this.tokens.verifyAccessToken(token);
    if (await this.revocation.isRevoked(user.sub, user.iat)) {
      throw new UnauthorizedException('Access token has been revoked');
    }

    // An impersonation session (see jwt-payload.interface.ts's `act` claim)
    // is read-only, full stop - not a blocklist of specific dangerous
    // actions, which risks missing one. Anything a support engineer
    // genuinely needs to change is done as themselves, with their own
    // permissions and their own name on the audit entry.
    if (user.act && !SAFE_METHODS.has(request.method)) {
      throw new ForbiddenException(
        'This session is viewing as another user and cannot make changes - exit impersonation first.',
      );
    }

    request.user = user;
    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return undefined;
    }
    return header.slice('Bearer '.length);
  }
}
