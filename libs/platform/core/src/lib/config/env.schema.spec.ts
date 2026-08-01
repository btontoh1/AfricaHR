import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  const validEnv = {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/africahr',
    APP_DATABASE_URL: 'postgresql://app_user:pass@localhost:5432/africahr',
  };

  it('applies defaults for optional fields', () => {
    const result = validateEnv(validEnv);

    expect(result.PORT).toBe(3000);
    expect(result.LOG_LEVEL).toBe('info');
    expect(result.REDIS_HOST).toBe('localhost');
    expect(result.REDIS_PORT).toBe(6379);
    expect(result.CORS_ORIGINS).toEqual([]);
  });

  it('coerces PORT and REDIS_PORT to numbers', () => {
    const result = validateEnv({ ...validEnv, PORT: '4000', REDIS_PORT: '6380' });

    expect(result.PORT).toBe(4000);
    expect(result.REDIS_PORT).toBe(6380);
  });

  it('defaults STORAGE_FORCE_PATH_STYLE to true when unset', () => {
    expect(validateEnv(validEnv).STORAGE_FORCE_PATH_STYLE).toBe(true);
  });

  it('parses the literal string "false" as false, not just "non-empty = true"', () => {
    expect(
      validateEnv({ ...validEnv, STORAGE_FORCE_PATH_STYLE: 'false' }).STORAGE_FORCE_PATH_STYLE,
    ).toBe(false);
  });

  it('parses the literal string "true" as true', () => {
    expect(
      validateEnv({ ...validEnv, STORAGE_FORCE_PATH_STYLE: 'true' }).STORAGE_FORCE_PATH_STYLE,
    ).toBe(true);
  });

  it('rejects a STORAGE_FORCE_PATH_STYLE value that is neither "true" nor "false"', () => {
    expect(() =>
      validateEnv({ ...validEnv, STORAGE_FORCE_PATH_STYLE: 'yes' }),
    ).toThrow(/STORAGE_FORCE_PATH_STYLE/);
  });

  it('parses CORS_ORIGINS as a trimmed comma-separated list', () => {
    const result = validateEnv({
      ...validEnv,
      CORS_ORIGINS: 'https://a.com, https://b.com ,,',
    });

    expect(result.CORS_ORIGINS).toEqual(['https://a.com', 'https://b.com']);
  });

  it('throws with a readable message when DATABASE_URL is missing', () => {
    expect(() => validateEnv({ NODE_ENV: 'test', APP_DATABASE_URL: validEnv.APP_DATABASE_URL })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('throws with a readable message when APP_DATABASE_URL is missing', () => {
    expect(() => validateEnv({ NODE_ENV: 'test', DATABASE_URL: validEnv.DATABASE_URL })).toThrow(
      /APP_DATABASE_URL/,
    );
  });

  it('throws when NODE_ENV is not one of the allowed values', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'staging' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('rejects a JWT secret shorter than 32 characters', () => {
    expect(() =>
      validateEnv({ ...validEnv, JWT_ACCESS_SECRET: 'too-short' }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('leaves SendGrid config undefined when unset', () => {
    const result = validateEnv(validEnv);

    expect(result.SENDGRID_API_KEY).toBeUndefined();
    expect(result.SENDGRID_FROM_EMAIL).toBeUndefined();
  });

  it('rejects a non-email SENDGRID_FROM_EMAIL', () => {
    expect(() =>
      validateEnv({ ...validEnv, SENDGRID_FROM_EMAIL: 'not-an-email' }),
    ).toThrow(/SENDGRID_FROM_EMAIL/);
  });
});
