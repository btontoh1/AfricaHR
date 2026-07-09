import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  const validEnv = {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/africahr',
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

  it('parses CORS_ORIGINS as a trimmed comma-separated list', () => {
    const result = validateEnv({
      ...validEnv,
      CORS_ORIGINS: 'https://a.com, https://b.com ,,',
    });

    expect(result.CORS_ORIGINS).toEqual(['https://a.com', 'https://b.com']);
  });

  it('throws with a readable message when DATABASE_URL is missing', () => {
    expect(() => validateEnv({ NODE_ENV: 'test' })).toThrow(/DATABASE_URL/);
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
});
