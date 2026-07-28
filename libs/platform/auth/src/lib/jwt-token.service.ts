import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '@africahr/platform-core';
import { JwtPayload, RequestUser } from './jwt-payload.interface';

const ACCESS_TOKEN_TTL = '15m';
const MFA_CHALLENGE_TOKEN_TTL = '5m';

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
