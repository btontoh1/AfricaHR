import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '@africahr/platform-database';
import { RedisHealthIndicator } from './redis-health.indicator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Aggregate liveness/readiness check (database + cache)' })
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.redisHealth.pingCheck('redis'),
    ]);
  }

  @Get('db')
  @HealthCheck()
  @ApiOperation({ summary: 'Database connectivity check' })
  checkDb() {
    return this.health.check([() => this.prismaHealth.pingCheck('database', this.prisma)]);
  }

  @Get('redis')
  @HealthCheck()
  @ApiOperation({ summary: 'Redis connectivity check' })
  checkRedis() {
    return this.health.check([() => this.redisHealth.pingCheck('redis')]);
  }
}
