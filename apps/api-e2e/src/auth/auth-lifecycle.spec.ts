import axios from 'axios';
import { login } from '../support/api-client';
import { readFixtures } from '../support/fixtures';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retries past 429s to observe the endpoint's real (non-throttled) response. */
async function attemptLogin(email: string, password: string) {
  for (let i = 0; i < 20; i++) {
    const res = await axios.post('/api/auth/login', { email, password }, { validateStatus: () => true });
    if (res.status !== 429) return res;
    await sleep(5000);
  }
  throw new Error('login kept 429ing');
}

describe('auth lifecycle', () => {
  const { users } = readFixtures();
  const admin = users.TENANT_ADMIN;

  it('accepts correct credentials and returns a token pair', async () => {
    const tokens = await login(admin.email, admin.password);
    expect(tokens.accessToken).toEqual(expect.any(String));
    expect(tokens.refreshToken).toEqual(expect.any(String));
  });

  // Login attempts against the throttled endpoint are expensive (each may
  // wait out a 60s window), so the wrong-password response is computed once
  // and reused by both the "doesn't reveal which field" and "same message
  // as unknown email" assertions below, instead of two separate calls.
  let wrongPasswordResponse: Awaited<ReturnType<typeof attemptLogin>>;

  it('rejects an incorrect password without revealing which field was wrong', async () => {
    wrongPasswordResponse = await attemptLogin(admin.email, 'DefinitelyWrongPassword123');
    expect(wrongPasswordResponse.status).toBe(401);
    expect(JSON.stringify(wrongPasswordResponse.data)).not.toMatch(/password/i);
  });

  it('rejects an unknown email with the same generic message', async () => {
    const unknownEmail = await attemptLogin('nobody-e2e@example.com', admin.password);
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.data.message).toEqual(wrongPasswordResponse.data.message);
  });

  it('rotates the refresh token and rejects the old one after rotation', async () => {
    const tokens = await login(admin.email, admin.password);

    const refreshed = await axios.post('/api/auth/refresh', { refreshToken: tokens.refreshToken });
    expect(refreshed.status).toBe(200);
    expect(refreshed.data.refreshToken).not.toBe(tokens.refreshToken);

    const reuseOldToken = await axios.post(
      '/api/auth/refresh',
      { refreshToken: tokens.refreshToken },
      { validateStatus: () => true },
    );
    expect(reuseOldToken.status).toBe(401);
  });

  it('revokes the refresh token on logout', async () => {
    const tokens = await login(admin.email, admin.password);

    const logoutRes = await axios.post('/api/auth/logout', { refreshToken: tokens.refreshToken });
    expect(logoutRes.status).toBe(204);

    const afterLogout = await axios.post(
      '/api/auth/refresh',
      { refreshToken: tokens.refreshToken },
      { validateStatus: () => true },
    );
    expect(afterLogout.status).toBe(401);
  });

  it('throttles rapid login attempts', async () => {
    // Fire enough rapid, back-to-back attempts that at least one must land
    // outside the 5/min budget regardless of what earlier tests in this
    // file already consumed - not asserting a specific attempt number, to
    // stay robust to ordering and timing.
    const attempts = await Promise.all(
      Array.from({ length: 10 }, () =>
        axios.post(
          '/api/auth/login',
          { email: admin.email, password: 'ThrottleProbeWrongPassword' },
          { validateStatus: () => true },
        ),
      ),
    );
    const throttled = attempts.filter((res) => res.status === 429);
    expect(throttled.length).toBeGreaterThan(0);
  });
});
