import { randomUUID } from 'node:crypto';
import { asUser, login } from '../support/api-client';
import { readFixtures } from '../support/fixtures';
import { withAppRoleTenantContext, withOwnerClient } from '../support/db-client';

/**
 * Proves Postgres Row-Level Security itself blocks a cross-tenant read -
 * not the application's own tenantId WHERE clauses (see
 * tenant-isolation.spec.ts for that, HTTP-layer, proof, which would still
 * pass even if every RLS policy in the database were silently dropped).
 * Connects directly as `africahr_app` - the same least-privilege role the
 * running API itself uses (see docker/postgres-init/01-create-app-role.sh)
 * - with only the tenant GUC set via SET LOCAL, exactly like
 * PrismaService.withTenantContext, and runs a deliberately UNFILTERED
 * `SELECT * FROM <table>` (no `WHERE tenant_id = ...` at all) to simulate
 * an application-level filter being forgotten. If FORCE ROW LEVEL SECURITY
 * is actually doing its job, the other tenant's row must still be
 * invisible with no app-level help.
 *
 * This is the automated regression test flagged as missing in the
 * pre-sales security audit: RLS has already broken once in a subtle,
 * load-dependent way (see RLS_CONVENTION.md §4's 2026-07-11 incident), and
 * until this file existed nothing proved the fix - or any other table's
 * policy - actually holds against the live schema. A future migration that
 * adds a tenant-scoped table without an RLS policy, or a policy that
 * regresses to `USING (true)`, fails here.
 */
describe('Row-Level Security: raw cross-tenant read isolation (as the app DB role, no app-level filter)', () => {
  let tenantAId: string;
  let tenantBId: string;
  const checksByTable: Record<string, { tenantARowId: string; tenantBRowId: string }> = {};

  beforeAll(async () => {
    const fixtures = readFixtures();
    tenantAId = fixtures.tenantId;
    const tenantAAdmin = await login(fixtures.users.TENANT_ADMIN.email, fixtures.users.TENANT_ADMIN.password);
    const tenantAClient = asUser(tenantAAdmin.accessToken);

    const seedEmail = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@africahr.local';
    const seedPassword = process.env['SEED_ADMIN_PASSWORD'];
    if (!seedPassword) throw new Error('SEED_ADMIN_PASSWORD must be set');
    const platform = await login(seedEmail, seedPassword);
    const platformClient = asUser(platform.accessToken);

    const stamp = Date.now();
    const tenantBRes = await platformClient.post('/api/tenants', {
      name: `E2E RLS Co ${stamp}`,
      slug: `e2e-rls-${stamp}`,
      country: 'GH',
      currency: 'GHS',
      timezone: 'Africa/Accra',
    });
    tenantBId = tenantBRes.data.id;

    const tenantBAdminEmail = `e2e-rls-admin-${stamp}@example.com`;
    const tenantBAdminPassword = 'E2eFixture#Pass1234';
    await platformClient.post('/api/users', {
      tenantId: tenantBId,
      email: tenantBAdminEmail,
      password: tenantBAdminPassword,
      firstName: 'Rls',
      lastName: 'Admin',
      role: 'TENANT_ADMIN',
    });
    const tenantBAdmin = await login(tenantBAdminEmail, tenantBAdminPassword);
    const tenantBClient = asUser(tenantBAdmin.accessToken);

    // One organization + employee per tenant, created through the real API
    // so every FK/validation rule is satisfied correctly. Everything below
    // (leave types/requests, pay runs, payslips) is inserted directly via
    // SQL as the migration-owner role instead - it bypasses RLS by being a
    // table owner, so this is a safe, RLS-independent way to seed fixture
    // rows without needing a full leave-approval or payroll-processing
    // flow just to get one row per table to test against.
    const orgA = await tenantAClient.post(`/api/tenants/${tenantAId}/organizations`, {
      legalName: `RLS Test Org A ${stamp}`,
      countryCode: 'GH',
      registrationNumber: `REG-A-${stamp}`,
    });
    const orgB = await tenantBClient.post(`/api/tenants/${tenantBId}/organizations`, {
      legalName: `RLS Test Org B ${stamp}`,
      countryCode: 'GH',
      registrationNumber: `REG-B-${stamp}`,
    });

    const empA = await tenantAClient.post(`/api/tenants/${tenantAId}/employees`, {
      organizationId: orgA.data.id,
      firstName: 'Rls',
      lastName: 'EmployeeA',
      jobTitle: 'Test',
      employmentType: 'FULL_TIME',
      hireDate: '2026-01-01',
      countryCode: 'GH',
    });
    const empB = await tenantBClient.post(`/api/tenants/${tenantBId}/employees`, {
      organizationId: orgB.data.id,
      firstName: 'Rls',
      lastName: 'EmployeeB',
      jobTitle: 'Test',
      employmentType: 'FULL_TIME',
      hireDate: '2026-01-01',
      countryCode: 'GH',
    });

    checksByTable['employees'] = { tenantARowId: empA.data.id, tenantBRowId: empB.data.id };

    await withOwnerClient(async (db) => {
      const leaveTypeAId = randomUUID();
      const leaveTypeBId = randomUUID();
      await db.query(
        `INSERT INTO leave_types (id, tenant_id, name, code, default_entitlement_days, updated_at)
         VALUES ($1, $2, 'RLS Test Leave', $3, 20, NOW())`,
        [leaveTypeAId, tenantAId, `RLS-A-${stamp}`],
      );
      await db.query(
        `INSERT INTO leave_types (id, tenant_id, name, code, default_entitlement_days, updated_at)
         VALUES ($1, $2, 'RLS Test Leave', $3, 20, NOW())`,
        [leaveTypeBId, tenantBId, `RLS-B-${stamp}`],
      );

      const leaveRequestAId = randomUUID();
      const leaveRequestBId = randomUUID();
      await db.query(
        `INSERT INTO leave_requests (id, tenant_id, employee_id, leave_type_id, start_date, end_date, days_requested, updated_at)
         VALUES ($1, $2, $3, $4, '2026-03-01', '2026-03-03', 3, NOW())`,
        [leaveRequestAId, tenantAId, empA.data.id, leaveTypeAId],
      );
      await db.query(
        `INSERT INTO leave_requests (id, tenant_id, employee_id, leave_type_id, start_date, end_date, days_requested, updated_at)
         VALUES ($1, $2, $3, $4, '2026-03-01', '2026-03-03', 3, NOW())`,
        [leaveRequestBId, tenantBId, empB.data.id, leaveTypeBId],
      );
      checksByTable['leave_requests'] = { tenantARowId: leaveRequestAId, tenantBRowId: leaveRequestBId };

      const payRunAId = randomUUID();
      const payRunBId = randomUUID();
      await db.query(
        `INSERT INTO pay_runs (id, tenant_id, organization_id, period_start, period_end, pay_date, updated_at)
         VALUES ($1, $2, $3, '2026-03-01', '2026-03-31', '2026-04-01', NOW())`,
        [payRunAId, tenantAId, orgA.data.id],
      );
      await db.query(
        `INSERT INTO pay_runs (id, tenant_id, organization_id, period_start, period_end, pay_date, updated_at)
         VALUES ($1, $2, $3, '2026-03-01', '2026-03-31', '2026-04-01', NOW())`,
        [payRunBId, tenantBId, orgB.data.id],
      );
      checksByTable['pay_runs'] = { tenantARowId: payRunAId, tenantBRowId: payRunBId };

      const payslipAId = randomUUID();
      const payslipBId = randomUUID();
      const payslipColumns = `(
        id, tenant_id, pay_run_id, employee_id, country_code,
        basic_salary, gross_pay, taxable_income, paye_tax,
        ssnit_employee, ssnit_employer, total_deductions, net_pay,
        currency, updated_at
      )`;
      const payslipValues = `VALUES ($1, $2, $3, $4, 'GH', 1000, 1000, 945, 89, 55, 130, 144, 856, 'GHS', NOW())`;
      await db.query(`INSERT INTO payslips ${payslipColumns} ${payslipValues}`, [
        payslipAId,
        tenantAId,
        payRunAId,
        empA.data.id,
      ]);
      await db.query(`INSERT INTO payslips ${payslipColumns} ${payslipValues}`, [
        payslipBId,
        tenantBId,
        payRunBId,
        empB.data.id,
      ]);
      checksByTable['payslips'] = { tenantARowId: payslipAId, tenantBRowId: payslipBId };
    });
  });

  it.each(['employees', 'leave_requests', 'pay_runs', 'payslips'])(
    '%s: a connection scoped to tenant A sees its own row but not tenant B\'s, with no WHERE tenant_id clause at all',
    async (table) => {
      const { tenantARowId, tenantBRowId } = checksByTable[table];

      const ids = await withAppRoleTenantContext(tenantAId, async (db) => {
        const result = await db.query(`SELECT id FROM ${table}`);
        return result.rows.map((row) => row.id as string);
      });

      expect(ids).toContain(tenantARowId);
      expect(ids).not.toContain(tenantBRowId);
    },
  );

  it.each(['employees', 'leave_requests', 'pay_runs', 'payslips'])(
    '%s: the same holds in reverse - tenant B sees its own row but not tenant A\'s',
    async (table) => {
      const { tenantARowId, tenantBRowId } = checksByTable[table];

      const ids = await withAppRoleTenantContext(tenantBId, async (db) => {
        const result = await db.query(`SELECT id FROM ${table}`);
        return result.rows.map((row) => row.id as string);
      });

      expect(ids).toContain(tenantBRowId);
      expect(ids).not.toContain(tenantARowId);
    },
  );
});
