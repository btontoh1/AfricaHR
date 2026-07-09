import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppConfigService } from '@africahr/platform-core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const config = app.get(AppConfigService);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.enableCors({
    origin: config.corsOrigins.length > 0 ? config.corsOrigins : true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AfricaHR API')
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
