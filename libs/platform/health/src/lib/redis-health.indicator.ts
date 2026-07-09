import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { RedisService } from '@africahr/platform-redis';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly redisService: RedisService,
  ) {}

  async pingCheck<Key extends string>(key: Key): Promise<HealthIndicatorResult<Key>> {
    const indicator = this.healthIndicatorService.check(key);
    const isUp = await this.redisService.ping();

    return isUp ? indicator.up() : indicator.down('Redis did not respond to PING');
  }
}
