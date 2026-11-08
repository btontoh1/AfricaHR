import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppConfigService } from '@africahr/platform-core';
import { AppModule } from './app/app.module';
import { createSwaggerBasicAuthMiddleware } from './app/swagger-basic-auth.middleware';

async function bootstrap() {
  // rawBody: true preserves the unparsed request body alongside Nest's
  // normal JSON parsing, needed to verify the Paystack webhook's
  // x-paystack-signature header (an HMAC over the exact raw bytes) - see
  // PaystackWebhookController.
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  // contentSecurityPolicy is off: helmet's default CSP blocks the inline
  // scripts/styles Swagger UI injects at /api/docs, and a real CSP tuned
  // for this API is a separate, larger effort. Every other helmet default
  // (X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, etc.)
  // still applies.
  app.use(helmet({ contentSecurityPolicy: false }));

  const config = app.get(AppConfigService);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  if (config.corsOrigins.length === 0) {
    // Fail loud rather than falling back to a wildcard - the same posture
    // already used for a missing JWT secret. An empty CORS_ORIGINS is far
    // more likely to be a forgotten env var than an intentional "allow
    // any origin," and reflecting any Origin header is a real
    // misconfiguration risk, not a safe default.
    throw new Error('CORS_ORIGINS must be set to at least one allowed origin');
  }
  app.enableCors({ origin: config.corsOrigins });

  const swaggerPath = `${globalPrefix}/docs`;
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ParotHR API')
    .setDescription('Enterprise multi-tenant HR & Payroll platform for Africa')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Unauthenticated in development/test (local convenience), but never in
  // production - Swagger UI and its raw JSON/YAML document are served
  // outside Nest's guard pipeline, so without this they'd otherwise be a
  // full, unauthenticated map of the API reachable by anyone who finds the
  // URL. Disabled outright (not a hard boot failure) when the Basic Auth
  // credentials aren't configured, since the docs are a convenience, not a
  // requirement - same posture as the optional SendGrid/Paystack config.
  if (!config.isProduction) {
    SwaggerModule.setup(swaggerPath, app, document);
    logger.log(`Swagger docs at http://localhost:${config.port}/${swaggerPath}`, 'Bootstrap');
  } else {
    const { user, password } = config.swaggerBasicAuth;
    if (user && password) {
      app.use([`/${swaggerPath}`, `/${swaggerPath}-json`, `/${swaggerPath}-yaml`], createSwaggerBasicAuthMiddleware(user, password));
      SwaggerModule.setup(swaggerPath, app, document);
      logger.log(`Swagger docs at /${swaggerPath} (Basic Auth required)`, 'Bootstrap');
    } else {
      logger.warn(
        'Swagger docs disabled in production - set SWAGGER_BASIC_AUTH_USER/SWAGGER_BASIC_AUTH_PASSWORD to enable them',
        'Bootstrap',
      );
    }
  }

  await app.listen(config.port);
  logger.log(`Application running on http://localhost:${config.port}/${globalPrefix}`, 'Bootstrap');
}

bootstrap();
