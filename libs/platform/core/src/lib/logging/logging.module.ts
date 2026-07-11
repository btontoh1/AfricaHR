import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from '../config/app-config.module';
import { AppConfigService } from '../config/app-config.service';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

const SENSITIVE_KEY_PATTERN = /password|secret|token/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Recursively censors any object key matching SENSITIVE_KEY_PATTERN,
 * case-insensitively, anywhere in a log object - covers every current and
 * future *Password/*Secret/*Token field name (e.g. adminPassword) without
 * needing each one hand-enumerated, unlike a static `redact.paths` list
 * (which is exactly what let SetupDto.adminPassword slip through
 * unredacted, since that list only matched the literal keys `password`
 * and `confirmPassword`). Applied as a pino `formatters.log` hook, so it
 * runs on every log line as a whole - not just req.body - meaning it's
 * also safe by construction if request-body logging is ever added later.
 *
 * Only descends into plain objects/arrays (JSON-like data - DTOs, custom
 * log context, etc.), never into class instances. This matters because
 * `formatters.log` sees the merged log object *before* pino-http's own
 * `req`/`res` serializers run, so `req`/`res` are still raw Node
 * IncomingMessage/ServerResponse instances at this point - deeply
 * circular (req.socket, res.req, ...) and full of irrelevant internals
 * that were never meant to be walked or logged. Restricting to plain
 * objects both avoids that crash (confirmed live: an earlier version of
 * this function stack-overflowed on the very first real request) and
 * leaves req/res exactly as pino's own serializers already handle them,
 * rather than accidentally exposing internals those serializers
 * deliberately don't log. `seen` is a belt-and-braces guard against any
 * accidental circular *plain* object too.
 */
export function redactSensitiveKeys<T>(value: T, seen = new WeakSet<object>()): T {
  if (Array.isArray(value)) {
    if (seen.has(value)) return [] as T;
    seen.add(value);
    return value.map((item) => redactSensitiveKeys(item, seen)) as T;
  }
  if (isPlainObject(value)) {
    if (seen.has(value)) return {} as T;
    seen.add(value);
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : redactSensitiveKeys(val, seen),
      ]),
    ) as T;
  }
  return value;
}

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
            // Header names themselves don't contain "password"/"secret"/
            // "token", so these two need to stay explicit - everything
            // else sensitive is caught by the formatters.log hook below.
            paths: ['req.headers.authorization', 'req.headers.cookie'],
            censor: '[REDACTED]',
          },
          formatters: {
            log: redactSensitiveKeys,
          },
          customProps: (req: { id: unknown }) => ({ correlationId: req.id }),
        },
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class AppLoggingModule {}
