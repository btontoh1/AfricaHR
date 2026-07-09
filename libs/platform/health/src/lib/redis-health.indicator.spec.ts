import { HealthIndicatorService } from '@nestjs/terminus';
import { RedisService } from '@africahr/platform-redis';
import { RedisHealthIndicator } from './redis-health.indicator';

describe('RedisHealthIndicator', () => {
  function createIndicator(pingResult: boolean) {
    const healthIndicatorService = new HealthIndicatorService();
    const redisService = { ping: jest.fn().mockResolvedValue(pingResult) } as unknown as RedisService;

    return new RedisHealthIndicator(healthIndicatorService, redisService);
  }

  it('reports up when Redis responds to PING', async () => {
    const indicator = createIndicator(true);

    const result = await indicator.pingCheck('redis');

    expect(result['redis'].status).toBe('up');
  });

  it('reports down when Redis does not respond to PING', async () => {
    const indicator = createIndicator(false);

    const result = await indicator.pingCheck('redis');

    expect(result['redis'].status).toBe('down');
  });
});
