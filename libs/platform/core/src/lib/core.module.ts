import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/app-config.module';
import { AppLoggingModule } from './logging/logging.module';
import { GlobalExceptionFilter } from './exceptions/global-exception.filter';
import { createValidationPipe } from './validation/create-validation-pipe';

@Module({
  imports: [
    AppConfigModule,
    AppLoggingModule,
    // Baseline for every route; endpoints that need a stricter limit (e.g.
    // login) override it with their own @Throttle(...).
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [AppConfigModule, AppLoggingModule],
})
export class CoreModule {}
