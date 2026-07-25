import * as fs from 'node:fs';
import * as path from 'node:path';
import axios from 'axios';
import { login } from './api-client';

export type FixtureRole = 'TENANT_ADMIN' | 'HR_MANAGER' | 'PAYROLL_MANAGER' | 'EMPLOYEE';

export interface FixtureUser {
  id: string;
  email: string;
  password: string;
}

export interface E2eFixtures {
  tenantId: string;
  tenantSlug: string;
  /** A second tenant with no users, for "real user, wrong tenant slug" login tests. */
  otherTenantSlug: string;
  /** A tenant walked TRIAL -> ACTIVE -> SUSPENDED, for org-scoped login rejection tests. */
  suspendedTenantSlug: string;
  users: Record<FixtureRole, FixtureUser>;
}

const FIXTURE_PASSWORD = 'E2eFixture#Pass1234';

export function fixturesPath(): string {
  return path.join(__dirname, '..', '..', 'tmp', 'e2e-fixtures.json');
}

export function readFixtures(): E2eFixtures {
  return JSON.parse(fs.readFileSync(fixturesPath(), 'utf-8'));
}

/**
 * Creates one throwaway tenant with one user per role, once, for the whole
 * e2e run to share (called from global-setup, not per spec file - keeps
 * total login calls against the 5/min throttle to a minimum). The database
 * itself is destroyed at the end of every CI job, so there is no cleanup
 * step here the way there was for the manual audit against a persistent
 * dev database.
 */
export async function bootstrapFixtures(): Promise<E2eFixtures> {
  const seedEmail = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@africahr.local';
  const seedPassword = process.env['SEED_ADMIN_PASSWORD'];
  if (!seedPassword) {
    throw new Error('SEED_ADMIN_PASSWORD must be set to bootstrap e2e fixtures');
  }

  const platform = await login(seedEmail, seedPassword);
  const client = axios.create({
    baseURL: axios.defaults.baseURL,
    headers: { Authorization: `Bearer ${platform.accessToken}` },
  });

  const stamp = Date.now();
  const tenantSlug = `e2e-fixture-${stamp}`;
  const tenantRes = await client.post('/api/tenants', {
    name: `E2E Fixture Co ${stamp}`,
    slug: tenantSlug,
    country: 'GH',
    currency: 'GHS',
    timezone: 'Africa/Accra',
  });
  const tenantId: string = tenantRes.data.id;

  const otherTenantSlug = `e2e-fixture-other-${stamp}`;
  await client.post('/api/tenants', {
    name: `E2E Fixture Other Co ${stamp}`,
    slug: otherTenantSlug,
    country: 'GH',
    currency: 'GHS',
    timezone: 'Africa/Accra',
  });

  const suspendedTenantSlug = `e2e-fixture-suspended-${stamp}`;
  const suspendedTenantRes = await client.post('/api/tenants', {
    name: `E2E Fixture Suspended Co ${stamp}`,
    slug: suspendedTenantSlug,
    country: 'GH',
    currency: 'GHS',
    timezone: 'Africa/Accra',
  });
  // TRIAL -> SUSPENDED directly is not a legal transition; ACTIVE is the
  // required stop in between (see canTransitionTenantStatus).
  await client.patch(`/api/tenants/${suspendedTenantRes.data.id}/status`, { status: 'ACTIVE' });
  await client.patch(`/api/tenants/${suspendedTenantRes.data.id}/status`, { status: 'SUSPENDED' });

  const roles: FixtureRole[] = ['TENANT_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'EMPLOYEE'];
  const users = {} as Record<FixtureRole, FixtureUser>;

  for (const role of roles) {
    const email = `e2e-${role.toLowerCase()}-${stamp}@example.com`;
    const res = await client.post('/api/users', {
      tenantId,
      email,
      password: FIXTURE_PASSWORD,
      firstName: 'E2E',
      lastName: role,
      role,
    });
    users[role] = { id: res.data.id, email, password: FIXTURE_PASSWORD };
  }

  return { tenantId, tenantSlug, otherTenantSlug, suspendedTenantSlug, users };
}
