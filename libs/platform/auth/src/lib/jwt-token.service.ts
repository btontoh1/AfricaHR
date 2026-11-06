import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '@africahr/platform-core';
import { JwtPayload, RequestUser } from './jwt-payload.interface';

const ACCESS_TOKEN_TTL = '15m';
const MFA_CHALLENGE_TOKEN_TTL = '5m';
/** Longer than a normal access token on purpose - see UserService.impersonateForTenant's doc comment for why a support session gets a bit more room than a normal sign-in before it has to be re-started. */
export const IMPERSONATION_TOKEN_TTL_SECONDS = 30 * 60;

export interface MfaChallengePayload {
  sub: string;
  tenantId: string | null;
}

export interface MfaChallengeClaims extends MfaChallengePayload {
  iat: number;
  exp: number;
}

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });
  }

  /**
   * Same secret and verification path as a normal access token (it's
   * verified by the exact same JwtAuthGuard.verifyAccessToken) - only the
   * `act` claim inside `payload` and this longer TTL distinguish it. No
   * matching refresh token is ever issued: when this expires, the session
   * is simply over, by design (see jwt-payload.interface.ts's doc comment
   * on `act` and JwtAuthGuard's read-only enforcement) - a support
   * engineer who still needs access starts a fresh impersonation session,
   * each one independently reasoned and audited, rather than one that
   * silently renews itself indefinitely.
   */
  signImpersonationToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, { expiresIn: IMPERSONATION_TOKEN_TTL_SECONDS });
  }

  verifyAccessToken(token: string): RequestUser {
    try {
      return this.jwtService.verify<RequestUser>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Signed with JWT_REFRESH_SECRET, not the access secret, so a challenge
   * token can never pass JwtAuthGuard.verifyAccessToken - structurally, not
   * by convention, even if some route only checks for *any* valid bearer
   * token. JWT_REFRESH_SECRET is otherwise unused today (real refresh
   * tokens are opaque random bytes, not JWTs - see AuthService), so
   * there's no collision risk repurposing it here.
   */
  signMfaChallengeToken(payload: MfaChallengePayload): string {
    return this.jwtService.sign(payload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: MFA_CHALLENGE_TOKEN_TTL,
    });
  }

  verifyMfaChallengeToken(token: string): MfaChallengeClaims {
    try {
      return this.jwtService.verify<MfaChallengeClaims>(token, {
        secret: this.config.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA challenge');
    }
  }
}
