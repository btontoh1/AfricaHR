import { Client } from 'pg';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set to run a test that connects to Postgres directly`);
  }
  return value;
}

/**
 * Runs `fn` against a connection authenticated as the migration-owner role
 * (DATABASE_URL) - a table owner, which bypasses Row-Level Security
 * entirely regardless of FORCE ROW LEVEL SECURITY (see RLS_CONVENTION.md).
 * Used only for raw fixture setup/teardown in rls-cross-tenant.spec.ts,
 * never to exercise the isolation being tested - that's what
 * withAppRoleTenantContext below is for.
 */
export async function withOwnerClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: requireEnv('DATABASE_URL') });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Runs `fn` against a connection authenticated as the app's own
 * least-privilege runtime role (APP_DATABASE_URL, `africahr_app`), with the
 * tenant GUC set exactly the way PrismaService.withTenantContext sets it in
 * the real app - `SET LOCAL` inside a transaction, so it cannot leak onto a
 * reused connection. Always rolled back, never committed: this helper only
 * ever runs read-only isolation checks against fixture rows another
 * connection already created, not writes of its own.
 */
export async function withAppRoleTenantContext<T>(
  tenantId: string,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({ connectionString: requireEnv('APP_DATABASE_URL') });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant_id', tenantId]);
    const result = await fn(client);
    await client.query('ROLLBACK');
    return result;
  } finally {
    await client.end();
  }
}
