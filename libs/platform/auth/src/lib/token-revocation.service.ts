import { Injectable } from '@nestjs/common';
import { RedisService } from '@africahr/platform-redis';

// Outlives the 15m access token TTL so a revocation always covers every
// token that could still be unexpired when it was written, while still
// letting the key expire on its own instead of accumulating forever.
const REVOCATION_TTL_SECONDS = 20 * 60;

@Injectable()
export class TokenRevocationService {
  constructor(private readonly redis: RedisService) {}

  async revokeAllForUser(userId: string): Promise<void> {
    const revokedAtSeconds = Math.floor(Date.now() / 1000);
    await this.redis
      .getClient()
      .set(this.key(userId), revokedAtSeconds.toString(), 'EX', REVOCATION_TTL_SECONDS);
  }

  async isRevoked(userId: string, issuedAt: number): Promise<boolean> {
    const revokedAtSeconds = await this.redis.getClient().get(this.key(userId));
    if (!revokedAtSeconds) {
      return false;
    }
    return issuedAt <= Number(revokedAtSeconds);
  }

  private key(userId: string): string {
    return `auth:revoked-since:${userId}`;
  }
}
