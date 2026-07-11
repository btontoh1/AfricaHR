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
  const tenantRes = await client.post('/api/tenants', {
    name: `E2E Fixture Co ${stamp}`,
    slug: `e2e-fixture-${stamp}`,
    country: 'GH',
    currency: 'GHS',
    timezone: 'Africa/Accra',
  });
  const tenantId: string = tenantRes.data.id;

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

  return { tenantId, users };
}
