import axios from 'axios';
import { TOTP, Secret } from 'otpauth';
import { asUser, login } from '../support/api-client';
import { readFixtures } from '../support/fixtures';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function codeFor(secretBase32: string): string {
  return new TOTP({ secret: Secret.fromBase32(secretBase32) }).generate();
}

/**
 * Retries past 429s - the login endpoint has its own 5/min-per-IP throttle.
 * deviceToken, when given, is sent the same way the web BFF forwards its
 * remembered-device cookie - as the X-Device-Token header.
 */
async function attemptLogin(email: string, password: string, deviceToken?: string) {
  for (let i = 0; i < 20; i++) {
    const res = await axios.post(
      '/api/auth/login',
      { email, password },
      {
        validateStatus: () => true,
        headers: deviceToken ? { 'X-Device-Token': deviceToken } : undefined,
      },
    );
    if (res.status !== 429) return res;
    await sleep(5000);
  }
  throw new Error('login kept 429ing');
}

/** Retries past 429s - mfa/verify has its own separate 5/min-per-IP throttle bucket. */
async function attemptVerify(challengeToken: string, code: string, rememberDevice?: boolean) {
  for (let i = 0; i < 20; i++) {
    const res = await axios.post(
      '/api/auth/mfa/verify',
      { challengeToken, code, rememberDevice },
      { validateStatus: () => true },
    );
    if (res.status !== 429) return res;
    await sleep(5000);
  }
  throw new Error('mfa/verify kept 429ing');
}

/**
 * Uses a dedicated throwaway user in the shared fixture tenant, never one of
 * the role fixtures from readFixtures().users - other spec files rely on
 * those logging in without an MFA challenge, so enabling MFA on a shared
 * fixture user here would break auth-lifecycle/tenant-scoped-login/
 * permission-matrix/tenant-isolation out from under them.
 */
describe('MFA', () => {
  let userEmail: string;
  let userPassword: string;
  let secret: string;
  let backupCodes: string[];

  beforeAll(async () => {
    const fixtures = readFixtures();
    const seedEmail = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@africahr.local';
    const seedPassword = process.env['SEED_ADMIN_PASSWORD'];
    if (!seedPassword) throw new Error('SEED_ADMIN_PASSWORD must be set');

    const platform = await login(seedEmail, seedPassword);
    const platformClient = asUser(platform.accessToken);

    const stamp = Date.now();
    userEmail = `e2e-mfa-${stamp}@example.com`;
    userPassword = 'E2eFixture#Pass1234';
    await platformClient.post('/api/users', {
      tenantId: fixtures.tenantId,
      email: userEmail,
      password: userPassword,
      firstName: 'E2E',
      lastName: 'Mfa',
      role: 'EMPLOYEE',
    });
  });

  it('enrolls: setup returns a secret and otpauth URI, confirm with a valid code enables MFA and issues backup codes', async () => {
    const initial = await login(userEmail, userPassword);

    const setupRes = await asUser(initial.accessToken).post('/api/users/me/mfa/setup');
    expect(setupRes.status).toBe(201);
    secret = setupRes.data.secret;
    expect(setupRes.data.otpauthUri).toContain('otpauth://totp/');

    const confirmRes = await asUser(initial.accessToken).post('/api/users/me/mfa/confirm', {
      code: codeFor(secret),
    });
    expect(confirmRes.status).toBe(201);
    backupCodes = confirmRes.data.backupCodes;
    expect(backupCodes).toHaveLength(10);

    const statusRes = await asUser(initial.accessToken).get('/api/users/me/mfa/status');
    expect(statusRes.data).toEqual({ enabled: true });
  });

  it('login now returns an MFA challenge instead of a token pair', async () => {
    const res = await attemptLogin(userEmail, userPassword);
    expect(res.status).toBe(200);
    expect(res.data.mfaRequired).toBe(true);
    expect(res.data.challengeToken).toEqual(expect.any(String));
    expect(res.data.accessToken).toBeUndefined();
  });

  it('rejects an incorrect TOTP code without issuing tokens', async () => {
    const loginRes = await attemptLogin(userEmail, userPassword);
    const verifyRes = await attemptVerify(loginRes.data.challengeToken, '000000');
    expect(verifyRes.status).toBe(401);
  });

  it('rejects a garbage challenge token', async () => {
    const res = await attemptVerify('not-a-real-token', '123456');
    expect(res.status).toBe(401);
  });

  it('accepts a correct TOTP code and issues a real token pair', async () => {
    const loginRes = await attemptLogin(userEmail, userPassword);
    const verifyRes = await attemptVerify(loginRes.data.challengeToken, codeFor(secret));
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.data.accessToken).toEqual(expect.any(String));
    expect(verifyRes.data.refreshToken).toEqual(expect.any(String));
  });

  it('accepts a backup code as a fallback, then rejects reusing the same one', async () => {
    const code = backupCodes[0];

    const firstLoginRes = await attemptLogin(userEmail, userPassword);
    const firstUse = await attemptVerify(firstLoginRes.data.challengeToken, code);
    expect(firstUse.status).toBe(200);

    const secondLoginRes = await attemptLogin(userEmail, userPassword);
    const reuse = await attemptVerify(secondLoginRes.data.challengeToken, code);
    expect(reuse.status).toBe(401);
  });

  it('works identically through the tenant-scoped login endpoint, since the challenge token carries its own tenantId', async () => {
    const fixtures = readFixtures();
    const res = await axios.post(
      `/api/tenants/${fixtures.tenantSlug}/login`,
      { email: userEmail, password: userPassword },
      { validateStatus: () => true },
    );
    expect(res.status).toBe(200);
    expect(res.data.mfaRequired).toBe(true);

    const verifyRes = await attemptVerify(res.data.challengeToken, codeFor(secret));
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.data.accessToken).toEqual(expect.any(String));
  });

  it('remembering a device on verify returns a deviceToken, and presenting it later skips the challenge entirely', async () => {
    const loginRes = await attemptLogin(userEmail, userPassword);
    const verifyRes = await attemptVerify(loginRes.data.challengeToken, codeFor(secret), true);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.data.deviceToken).toEqual(expect.any(String));

    const deviceToken: string = verifyRes.data.deviceToken;

    const trustedLoginRes = await attemptLogin(userEmail, userPassword, deviceToken);
    expect(trustedLoginRes.status).toBe(200);
    expect(trustedLoginRes.data.mfaRequired).toBeUndefined();
    expect(trustedLoginRes.data.accessToken).toEqual(expect.any(String));
  });

  it('a login without rememberDevice does not mint a deviceToken', async () => {
    const loginRes = await attemptLogin(userEmail, userPassword);
    const verifyRes = await attemptVerify(loginRes.data.challengeToken, codeFor(secret));
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.data.deviceToken).toBeUndefined();
  });

  it('a garbage device token does not bypass the challenge', async () => {
    const res = await attemptLogin(userEmail, userPassword, 'not-a-real-device-token');
    expect(res.status).toBe(200);
    expect(res.data.mfaRequired).toBe(true);
  });

  it('forgetting all devices removes the trust, so a previously-remembered device is challenged again', async () => {
    const loginRes = await attemptLogin(userEmail, userPassword);
    const verifyRes = await attemptVerify(loginRes.data.challengeToken, codeFor(secret), true);
    const deviceToken: string = verifyRes.data.deviceToken;
    const accessToken: string = verifyRes.data.accessToken;

    const forgetRes = await asUser(accessToken).delete('/api/users/me/mfa/trusted-devices');
    expect(forgetRes.status).toBe(204);

    const loginAfterForget = await attemptLogin(userEmail, userPassword, deviceToken);
    expect(loginAfterForget.status).toBe(200);
    expect(loginAfterForget.data.mfaRequired).toBe(true);
  });

  it('disable removes the MFA requirement and immediately revokes the disabling session itself', async () => {
    const loginRes = await attemptLogin(userEmail, userPassword);
    const verifyRes = await attemptVerify(loginRes.data.challengeToken, codeFor(secret));
    const freshAccessToken: string = verifyRes.data.accessToken;

    const disableRes = await asUser(freshAccessToken).post('/api/users/me/mfa/disable', {
      password: userPassword,
    });
    expect(disableRes.status).toBe(204);

    const afterDisable = await asUser(freshAccessToken).get('/api/users/me/mfa/status');
    expect(afterDisable.status).toBe(401);

    const plainLogin = await attemptLogin(userEmail, userPassword);
    expect(plainLogin.status).toBe(200);
    expect(plainLogin.data.mfaRequired).toBeUndefined();
    expect(plainLogin.data.accessToken).toEqual(expect.any(String));
  });
});
