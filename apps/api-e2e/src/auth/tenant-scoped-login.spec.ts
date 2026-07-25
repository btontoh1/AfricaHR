import axios from 'axios';
import { readFixtures } from '../support/fixtures';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retries past 429s to observe the endpoint's real (non-throttled) response. */
async function attemptTenantLogin(slug: string, email: string, password: string) {
  for (let i = 0; i < 20; i++) {
    const res = await axios.post(
      `/api/tenants/${slug}/login`,
      { email, password },
      { validateStatus: () => true },
    );
    if (res.status !== 429) return res;
    await sleep(5000);
  }
  throw new Error('tenant-scoped login kept 429ing');
}

describe('tenant-scoped login', () => {
  const { tenantSlug, otherTenantSlug, suspendedTenantSlug, users } = readFixtures();
  const admin = users.TENANT_ADMIN;

  it('accepts correct credentials against the real tenant slug', async () => {
    const res = await attemptTenantLogin(tenantSlug, admin.email, admin.password);
    expect(res.status).toBe(200);
    expect(res.data.accessToken).toEqual(expect.any(String));
    expect(res.data.refreshToken).toEqual(expect.any(String));
  });

  it('404s for an unknown tenant slug', async () => {
    const res = await attemptTenantLogin('no-such-tenant-slug', admin.email, admin.password);
    expect(res.status).toBe(404);
  });

  it('404s for a suspended tenant slug, same shape as an unknown slug', async () => {
    const res = await attemptTenantLogin(suspendedTenantSlug, admin.email, admin.password);
    expect(res.status).toBe(404);
    expect(res.data.message).toMatch(/not found/i);
  });

  it("rejects a real user's credentials against a different tenant's slug", async () => {
    const res = await attemptTenantLogin(otherTenantSlug, admin.email, admin.password);
    expect(res.status).toBe(401);
  });

  describe('public tenant lookup', () => {
    it('returns name and slug for an existing, loginable tenant', async () => {
      const res = await axios.get(`/api/tenants/public/${tenantSlug}`, { validateStatus: () => true });
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ name: expect.any(String), slug: tenantSlug });
    });

    it('404s for a suspended tenant, same as an unknown slug', async () => {
      const suspended = await axios.get(`/api/tenants/public/${suspendedTenantSlug}`, {
        validateStatus: () => true,
      });
      const unknown = await axios.get('/api/tenants/public/no-such-tenant-slug', {
        validateStatus: () => true,
      });
      expect(suspended.status).toBe(404);
      expect(unknown.status).toBe(404);
    });
  });

  it('throttles rapid tenant-scoped login attempts', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 10 }, () =>
        axios.post(
          `/api/tenants/${tenantSlug}/login`,
          { email: admin.email, password: 'ThrottleProbeWrongPassword' },
          { validateStatus: () => true },
        ),
      ),
    );
    const throttled = attempts.filter((res) => res.status === 429);
    expect(throttled.length).toBeGreaterThan(0);
  });
});
