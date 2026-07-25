import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppConfigService } from '@africahr/platform-core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ParrotHR API')
    .setDescription('Enterprise multi-tenant HR & Payroll platform for Africa')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  await app.listen(config.port);
  logger.log(`Application running on http://localhost:${config.port}/${globalPrefix}`, 'Bootstrap');
  logger.log(`Swagger docs at http://localhost:${config.port}/${globalPrefix}/docs`, 'Bootstrap');
}

bootstrap();
