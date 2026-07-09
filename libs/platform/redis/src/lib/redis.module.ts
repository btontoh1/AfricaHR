import { Global, Logger, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigModule, AppConfigService } from '@africahr/platform-core';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

const logger = new Logger('RedisModule');

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const { host, port, password } = config.redis;
        const client = new Redis({
          host,
          port,
          password,
          lazyConnect: false,
          maxRetriesPerRequest: 3,
        });

        client.on('error', (error) => logger.error(`Redis connection error: ${error.message}`));
        client.on('connect', () => logger.log(`Connected to Redis at ${host}:${port}`));

        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
