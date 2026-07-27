import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@africahr/platform-redis';

// Outlives the 15m access token TTL so a revocation always covers every
// token that could still be unexpired when it was written, while still
// letting the key expire on its own instead of accumulating forever.
const REVOCATION_TTL_SECONDS = 20 * 60;

@Injectable()
export class TokenRevocationService {
  private readonly logger = new Logger(TokenRevocationService.name);

  constructor(private readonly redis: RedisService) {}

  // Fails open: a Redis outage should degrade to the pre-existing "wait
  // out the token's natural expiry" behavior, not take down every
  // authenticated request in the app. Missing a revocation only re-opens
  // the narrow window this feature closes; treating a Redis hiccup as an
  // app-wide outage would be strictly worse.
  async revokeAllForUser(userId: string): Promise<void> {
    const revokedAtSeconds = Math.floor(Date.now() / 1000);
    try {
      await this.redis
        .getClient()
        .set(this.key(userId), revokedAtSeconds.toString(), 'EX', REVOCATION_TTL_SECONDS);
    } catch (error) {
      this.logger.warn(`Failed to record token revocation for user ${userId}: ${(error as Error).message}`);
    }
  }

  async isRevoked(userId: string, issuedAt: number): Promise<boolean> {
    try {
      const revokedAtSeconds = await this.redis.getClient().get(this.key(userId));
      if (!revokedAtSeconds) {
        return false;
      }
      return issuedAt <= Number(revokedAtSeconds);
    } catch (error) {
      this.logger.warn(`Failed to check token revocation for user ${userId}: ${(error as Error).message}`);
      return false;
    }
  }

  private key(userId: string): string {
    return `auth:revoked-since:${userId}`;
  }
}
