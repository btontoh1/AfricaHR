import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AppConfigModule } from './config/app-config.module';
import { AppLoggingModule } from './logging/logging.module';
import { GlobalExceptionFilter } from './exceptions/global-exception.filter';
import { createValidationPipe } from './validation/create-validation-pipe';

@Module({
  imports: [AppConfigModule, AppLoggingModule],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_PIPE, useFactory: createValidationPipe },
  ],
  exports: [AppConfigModule, AppLoggingModule],
})
export class CoreModule {}
