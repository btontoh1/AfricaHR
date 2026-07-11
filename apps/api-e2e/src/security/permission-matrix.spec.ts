import axios from 'axios';
import { asUser, login } from '../support/api-client';
import { FixtureRole, readFixtures } from '../support/fixtures';

/**
 * Focused, cross-module regression net for the permission matrix: one
 * "correctly allowed" and one "correctly denied" check per feature area.
 * Not exhaustive (see the full manual audit for that) - this exists so a
 * future change to a guard or a @RequirePermissions decorator fails CI
 * immediately instead of being caught by hand months later.
 */
describe('permission matrix', () => {
  let tenantId: string;
  const tokens: Partial<Record<FixtureRole, string>> = {};

  beforeAll(async () => {
    const fixtures = readFixtures();
    tenantId = fixtures.tenantId;
    for (const role of Object.keys(fixtures.users) as FixtureRole[]) {
      const user = fixtures.users[role];
      const result = await login(user.email, user.password);
      tokens[role] = result.accessToken;
    }
  });

  interface Check {
    area: string;
    path: string;
    role: FixtureRole;
    expectStatus: number;
  }

  const checks: Check[] = [
    { area: 'tenancy/organizations', path: `/api/tenants/{t}/organizations`, role: 'HR_MANAGER', expectStatus: 200 },
    { area: 'tenancy/organizations', path: `/api/tenants/{t}/organizations`, role: 'EMPLOYEE', expectStatus: 403 },

    { area: 'employees', path: `/api/tenants/{t}/employees`, role: 'HR_MANAGER', expectStatus: 200 },
    { area: 'employees', path: `/api/tenants/{t}/employees`, role: 'EMPLOYEE', expectStatus: 403 },

    { area: 'leave', path: `/api/tenants/{t}/leave-requests`, role: 'HR_MANAGER', expectStatus: 200 },
    { area: 'leave', path: `/api/tenants/{t}/leave-requests`, role: 'EMPLOYEE', expectStatus: 403 },
    { area: 'leave', path: `/api/tenants/{t}/leave-requests`, role: 'PAYROLL_MANAGER', expectStatus: 403 },

    { area: 'attendance', path: `/api/tenants/{t}/attendance`, role: 'HR_MANAGER', expectStatus: 200 },
    { area: 'attendance', path: `/api/tenants/{t}/attendance`, role: 'EMPLOYEE', expectStatus: 403 },

    { area: 'benefits', path: `/api/tenants/{t}/benefit-enrollments`, role: 'HR_MANAGER', expectStatus: 200 },
    { area: 'benefits', path: `/api/tenants/{t}/benefit-enrollments`, role: 'EMPLOYEE', expectStatus: 403 },

    { area: 'payroll', path: `/api/tenants/{t}/pay-runs`, role: 'HR_MANAGER', expectStatus: 200 },
    { area: 'payroll', path: `/api/tenants/{t}/pay-runs`, role: 'EMPLOYEE', expectStatus: 403 },

    { area: 'performance', path: `/api/tenants/{t}/performance-reviews`, role: 'HR_MANAGER', expectStatus: 200 },
    { area: 'performance', path: `/api/tenants/{t}/performance-reviews`, role: 'EMPLOYEE', expectStatus: 403 },

    { area: 'recruitment', path: `/api/tenants/{t}/job-requisitions`, role: 'HR_MANAGER', expectStatus: 200 },
    { area: 'recruitment', path: `/api/tenants/{t}/job-requisitions`, role: 'EMPLOYEE', expectStatus: 403 },

    { area: 'reporting', path: `/api/tenants/{t}/reports/headcount`, role: 'HR_MANAGER', expectStatus: 200 },
    { area: 'reporting', path: `/api/tenants/{t}/reports/headcount`, role: 'PAYROLL_MANAGER', expectStatus: 200 },
    { area: 'reporting', path: `/api/tenants/{t}/reports/headcount`, role: 'EMPLOYEE', expectStatus: 403 },

    { area: 'notifications', path: `/api/tenants/{t}/notifications`, role: 'HR_MANAGER', expectStatus: 200 },
    { area: 'notifications', path: `/api/tenants/{t}/notifications`, role: 'EMPLOYEE', expectStatus: 403 },

    { area: 'team-members', path: `/api/users`, role: 'HR_MANAGER', expectStatus: 200 },
    { area: 'team-members', path: `/api/users`, role: 'EMPLOYEE', expectStatus: 403 },

    { area: 'tenants (platform-only)', path: `/api/tenants`, role: 'TENANT_ADMIN', expectStatus: 403 },
  ];

  it.each(checks)('$area :: $role -> $expectStatus on $path', async ({ path, role, expectStatus }) => {
    const url = path.replace('{t}', tenantId);
    const res = await asUser(tokens[role] as string).get(url);
    expect(res.status).toBe(expectStatus);
  });

  it('setup status is reachable with no token at all (public endpoint)', async () => {
    const res = await axios.get('/api/setup/status');
    expect(res.status).toBe(200);
    expect(typeof res.data.needsSetup).toBe('boolean');
  });
});
