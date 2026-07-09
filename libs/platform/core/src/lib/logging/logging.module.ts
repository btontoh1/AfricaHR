import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from '../config/app-config.module';
import { AppConfigService } from '../config/app-config.service';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.logLevel,
          genReqId: (req: { headers: Record<string, string | string[] | undefined> }) =>
            (req.headers[CORRELATION_ID_HEADER] as string) || randomUUID(),
          transport: config.isProduction
            ? undefined
            : {
                target: 'pino-pretty',
                options: { singleLine: true, colorize: true },
              },
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.body.password',
              'req.body.confirmPassword',
              '*.password',
              '*.token',
            ],
            censor: '[REDACTED]',
          },
          customProps: (req: { id: unknown }) => ({ correlationId: req.id }),
        },
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class AppLoggingModule {}
