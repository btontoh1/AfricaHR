import { redactSensitiveKeys } from './logging.module';

describe('redactSensitiveKeys', () => {
  it('redacts a top-level key literally named "password"', () => {
    expect(redactSensitiveKeys({ password: 'hunter2' })).toEqual({ password: '[REDACTED]' });
  });

  it('redacts field names that only contain "password" as a substring, e.g. adminPassword', () => {
    // This is the exact gap that shipped unnoticed: SetupDto.adminPassword
    // wasn't covered by a static redact.paths list that only matched the
    // literal keys "password"/"confirmPassword".
    expect(redactSensitiveKeys({ adminPassword: 'hunter2' })).toEqual({
      adminPassword: '[REDACTED]',
    });
  });

  it('redacts secret- and token-like keys too, case-insensitively', () => {
    expect(
      redactSensitiveKeys({ JWT_ACCESS_SECRET: 'x', refreshToken: 'y', TokenHash: 'z' }),
    ).toEqual({
      JWT_ACCESS_SECRET: '[REDACTED]',
      refreshToken: '[REDACTED]',
      TokenHash: '[REDACTED]',
    });
  });

  it('redacts nested objects and arrays at any depth', () => {
    expect(
      redactSensitiveKeys({
        req: { body: { adminPassword: 'hunter2', companyName: 'Acme' } },
        items: [{ password: 'a' }, { password: 'b' }],
      }),
    ).toEqual({
      req: { body: { adminPassword: '[REDACTED]', companyName: 'Acme' } },
      items: [{ password: '[REDACTED]' }, { password: '[REDACTED]' }],
    });
  });

  it('leaves non-sensitive fields untouched', () => {
    const input = { email: 'a@b.com', firstName: 'Ama', age: 30 };
    expect(redactSensitiveKeys(input)).toEqual(input);
  });

  it('passes through primitives and null unchanged', () => {
    expect(redactSensitiveKeys(null)).toBeNull();
    expect(redactSensitiveKeys(42)).toBe(42);
    expect(redactSensitiveKeys('plain string')).toBe('plain string');
  });

  it('does not descend into class instances (e.g. Error, Date), only plain objects/arrays', () => {
    // Deliberate: this is what makes it safe to run on pino's raw req/res
    // before their own serializers run (see the function's doc comment) -
    // an earlier version without this restriction stack-overflowed on a
    // real IncomingMessage's circular internals on the very first request.
    class NotPlain {
      password = 'hunter2';
    }
    const instance = new NotPlain();
    expect(redactSensitiveKeys(instance)).toBe(instance);

    const error = new Error('boom');
    expect(redactSensitiveKeys(error)).toBe(error);

    const date = new Date('2026-01-01');
    expect(redactSensitiveKeys(date)).toBe(date);
  });

  it('does not stack-overflow on a circular plain object', () => {
    const circular: Record<string, unknown> = { password: 'hunter2', companyName: 'Acme' };
    circular['self'] = circular;

    expect(() => redactSensitiveKeys(circular)).not.toThrow();
  });
});
