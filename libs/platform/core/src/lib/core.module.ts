import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
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
    // Registered once here (EventEmitterModule.forRoot() is @Global()) so
    // any feature module can inject EventEmitter2 or use @OnEvent without
    // importing anything extra. This is what lets a scope:leave module
    // notify a scope:notifications listener without violating the Nx
    // module boundary that forbids scope:leave from depending on
    // scope:notifications directly (see eslint.config.mjs) — leave only
    // ever depends on this external npm package, never on the
    // notifications library itself.
    EventEmitterModule.forRoot(),
    // Also registered once here, also @Global() - lets a feature module
    // use @Cron/@Interval/@Timeout (e.g. payroll's disbursement
    // reconciliation sweep) without importing anything extra, same
    // reasoning as EventEmitterModule above.
    ScheduleModule.forRoot(),
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [AppConfigModule, AppLoggingModule],
})
export class CoreModule {}
