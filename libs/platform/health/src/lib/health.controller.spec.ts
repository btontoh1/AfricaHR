import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '@africahr/platform-database';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis-health.indicator';

describe('HealthController', () => {
  let controller: HealthController;
  let health: jest.Mocked<HealthCheckService>;
  let prismaHealth: jest.Mocked<PrismaHealthIndicator>;
  let redisHealth: jest.Mocked<RedisHealthIndicator>;

  beforeEach(() => {
    health = { check: jest.fn().mockResolvedValue({ status: 'ok' }) } as unknown as jest.Mocked<HealthCheckService>;
    prismaHealth = { pingCheck: jest.fn() } as unknown as jest.Mocked<PrismaHealthIndicator>;
    redisHealth = { pingCheck: jest.fn() } as unknown as jest.Mocked<RedisHealthIndicator>;

    controller = new HealthController(
      health,
      prismaHealth,
      redisHealth,
      {} as PrismaService,
    );
  });

  it('checks both database and redis for the aggregate endpoint', async () => {
    await controller.check();

    const indicators = health.check.mock.calls[0][0];
    expect(indicators).toHaveLength(2);
  });

  it('checks only the database for /health/db', async () => {
    await controller.checkDb();

    const indicators = health.check.mock.calls[0][0];
    expect(indicators).toHaveLength(1);
  });

  it('checks only redis for /health/redis', async () => {
    await controller.checkRedis();

    const indicators = health.check.mock.calls[0][0];
    expect(indicators).toHaveLength(1);
  });
});
