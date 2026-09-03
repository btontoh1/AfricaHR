import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  get nodeEnv(): EnvConfig['NODE_ENV'] {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.configService.get('PORT', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  get appDatabaseUrl(): string {
    return this.configService.get('APP_DATABASE_URL', { infer: true });
  }

  get redis(): { host: string; port: number; password?: string } {
    return {
      host: this.configService.get('REDIS_HOST', { infer: true }),
      port: this.configService.get('REDIS_PORT', { infer: true }),
      password: this.configService.get('REDIS_PASSWORD', { infer: true }),
    };
  }

  get storage(): {
    endpoint: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    region: string;
    forcePathStyle: boolean;
  } {
    return {
      endpoint: this.configService.get('STORAGE_ENDPOINT', { infer: true }),
      bucket: this.configService.get('STORAGE_BUCKET', { infer: true }),
      accessKey: this.configService.get('STORAGE_ACCESS_KEY', { infer: true }),
      secretKey: this.configService.get('STORAGE_SECRET_KEY', { infer: true }),
      region: this.configService.get('STORAGE_REGION', { infer: true }),
      forcePathStyle: this.configService.get('STORAGE_FORCE_PATH_STYLE', { infer: true }),
    };
  }

  get logLevel(): EnvConfig['LOG_LEVEL'] {
    return this.configService.get('LOG_LEVEL', { infer: true });
  }

  get corsOrigins(): string[] {
    return this.configService.get('CORS_ORIGINS', { infer: true });
  }

  get jwtAccessSecret(): string | undefined {
    return this.configService.get('JWT_ACCESS_SECRET', { infer: true });
  }

  get jwtRefreshSecret(): string | undefined {
    return this.configService.get('JWT_REFRESH_SECRET', { infer: true });
  }

  get sendgrid(): { apiKey?: string; fromEmail?: string } {
    return {
      apiKey: this.configService.get('SENDGRID_API_KEY', { infer: true }),
      fromEmail: this.configService.get('SENDGRID_FROM_EMAIL', { infer: true }),
    };
  }

  get mfaEncryptionKey(): string | undefined {
    return this.configService.get('MFA_ENCRYPTION_KEY', { infer: true });
  }

  get paystackSecretKey(): string | undefined {
    return this.configService.get('PAYSTACK_SECRET_KEY', { infer: true });
  }

  get paymentMethodEncryptionKey(): string | undefined {
    return this.configService.get('PAYMENT_METHOD_ENCRYPTION_KEY', { infer: true });
  }

  get swaggerBasicAuth(): { user?: string; password?: string } {
    return {
      user: this.configService.get('SWAGGER_BASIC_AUTH_USER', { infer: true }),
      password: this.configService.get('SWAGGER_BASIC_AUTH_PASSWORD', { infer: true }),
    };
  }
}
