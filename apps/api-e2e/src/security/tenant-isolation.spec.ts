import { asUser, login } from '../support/api-client';
import { readFixtures } from '../support/fixtures';

/**
 * Proves Row-Level Security is doing real isolation work at the database
 * layer, not just the application's assertTenantScope(actor, tenantId) URL
 * check. A request using the caller's OWN correct :tenantId (so
 * assertTenantScope passes) for a resource ID that belongs to a different
 * tenant must still come back 404 - if RLS regressed to a no-op, the
 * repository query would leak the other tenant's row through instead.
 */
describe('cross-tenant RLS isolation', () => {
  let tenantAId: string;
  let tenantAHr: { accessToken: string };
  let tenantBId: string;
  let tenantBHr: { accessToken: string };
  let tenantAEmployeeId: string;

  beforeAll(async () => {
    const fixtures = readFixtures();
    tenantAId = fixtures.tenantId;
    tenantAHr = await login(fixtures.users.HR_MANAGER.email, fixtures.users.HR_MANAGER.password);
    // Organization creation needs ORGANIZATION_MANAGE, which only
    // TENANT_ADMIN (and PLATFORM_ADMIN) hold - HR_MANAGER only has
    // ORGANIZATION_READ, so it must not be used for the create call below.
    const tenantAAdmin = await login(fixtures.users.TENANT_ADMIN.email, fixtures.users.TENANT_ADMIN.password);

    const seedEmail = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@africahr.local';
    const seedPassword = process.env['SEED_ADMIN_PASSWORD'];
    if (!seedPassword) throw new Error('SEED_ADMIN_PASSWORD must be set');
    const platform = await login(seedEmail, seedPassword);
    const platformClient = asUser(platform.accessToken);

    const stamp = Date.now();
    const tenantBRes = await platformClient.post('/api/tenants', {
      name: `E2E Isolation Co ${stamp}`,
      slug: `e2e-isolation-${stamp}`,
      country: 'GH',
      currency: 'GHS',
      timezone: 'Africa/Accra',
    });
    tenantBId = tenantBRes.data.id;

    const tenantBHrEmail = `e2e-isolation-hr-${stamp}@example.com`;
    const tenantBHrPassword = 'E2eFixture#Pass1234';
    await platformClient.post('/api/users', {
      tenantId: tenantBId,
      email: tenantBHrEmail,
      password: tenantBHrPassword,
      firstName: 'Isolation',
      lastName: 'HR',
      role: 'HR_MANAGER',
    });
    tenantBHr = await login(tenantBHrEmail, tenantBHrPassword);

    const orgRes = await asUser(tenantAAdmin.accessToken).post(`/api/tenants/${tenantAId}/organizations`, {
      legalName: 'Isolation Test Org',
      countryCode: 'GH',
      registrationNumber: `REG-${stamp}`,
    });
    const empRes = await asUser(tenantAHr.accessToken).post(`/api/tenants/${tenantAId}/employees`, {
      organizationId: orgRes.data.id,
      firstName: 'Tenant',
      lastName: 'A-Employee',
      jobTitle: 'Test',
      employmentType: 'FULL_TIME',
      hireDate: '2026-01-01',
      countryCode: 'GH',
    });
    tenantAEmployeeId = empRes.data.id;
  });

  it("returns 404, not the record, when tenant B requests tenant A's employee by ID under tenant B's own (permission-valid) URL", async () => {
    const res = await asUser(tenantBHr.accessToken).get(
      `/api/tenants/${tenantBId}/employees/${tenantAEmployeeId}`,
      { validateStatus: () => true },
    );
    expect(res.status).toBe(404);
  });

  it("still 403s the coarser case of tenant B's URL param naming tenant A directly", async () => {
    const res = await asUser(tenantBHr.accessToken).get(`/api/tenants/${tenantAId}/employees`, {
      validateStatus: () => true,
    });
    expect(res.status).toBe(403);
  });

  it("confirms the employee genuinely exists and is readable under tenant A's own token", async () => {
    const res = await asUser(tenantAHr.accessToken).get(
      `/api/tenants/${tenantAId}/employees/${tenantAEmployeeId}`,
    );
    expect(res.status).toBe(200);
    expect(res.data.id).toBe(tenantAEmployeeId);
  });
});
