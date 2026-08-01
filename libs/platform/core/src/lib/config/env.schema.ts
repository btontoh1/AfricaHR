import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Owner/superuser connection, used only for running migrations (see prisma.config.ts).
  DATABASE_URL: z.string().url(),
  // Least-privilege runtime connection the app actually queries through, so Postgres
  // Row-Level Security applies (RLS is unconditionally bypassed by superusers and table
  // owners regardless of FORCE ROW LEVEL SECURITY — see RLS_CONVENTION.md).
  APP_DATABASE_URL: z.string().url(),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // S3-compatible object storage (MinIO locally, real S3/Spaces/R2 in prod)
  // for verification-document uploads — see libs/platform/storage.
  STORAGE_ENDPOINT: z.string().url().default('http://localhost:9000'),
  STORAGE_BUCKET: z.string().default('africahr-verification-docs'),
  STORAGE_ACCESS_KEY: z.string().default('africahr'),
  STORAGE_SECRET_KEY: z.string().default('africahr-storage-secret'),
  STORAGE_REGION: z.string().default('us-east-1'),
  // MinIO requires path-style URLs (http://host/bucket/key); real S3 uses
  // virtual-hosted style (http://bucket.host/key) and should set this false.
  // z.coerce.boolean() is a trap for a string env var: JS's Boolean("false")
  // is true (any non-empty string is truthy), so it would silently ignore
  // an explicit "false" - this enum+transform parses the literal text instead.
  STORAGE_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),

  // Real email delivery for the EMAIL notification channel. Optional -
  // when unset, NotificationsFeatureModule falls back to
  // LogNotificationDispatcher (logs instead of sending) rather than
  // failing to boot, so local/dev/CI environments never need a real key.
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),

  // AES-256 key (64-char hex = 32 bytes) for encrypting TOTP secrets at
  // rest. Optional at the env-schema level only so the Zod validator's
  // error message isn't the one doing the enforcement - MfaService derives
  // this at construction time (Nest instantiates providers eagerly), so a
  // missing/malformed key fails the whole app's boot with a clear error,
  // same posture as JWT_ACCESS_SECRET.
  MFA_ENCRYPTION_KEY: z.string().optional(),

  // Real payment collection (billing/subscriptions) via Paystack. Optional -
  // when unset, PaystackClient falls back to a placeholder that logs
  // instead of calling the real API (same "optional at schema level,
  // enforced by the consuming service" posture as SENDGRID_API_KEY), so
  // local/dev/CI environments never need a real key.
  PAYSTACK_SECRET_KEY: z.string().optional(),

  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return result.data;
}
