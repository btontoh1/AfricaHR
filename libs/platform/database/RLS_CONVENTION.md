# Tenant isolation convention

AfricaHR uses a shared database, shared schema. Every table belonging to a
tenant-scoped domain (i.e. everything except platform-level tables like
migrations metadata) must follow this pattern.

## 1. Prisma model

```prisma
model Employee {
  id       String @id @default(uuid())
  tenantId String @map("tenant_id")
  // ...domain fields

  @@index([tenantId])
  @@map("employees")
}
```

## 2. Row-Level Security policy

Prisma does not manage RLS, so after generating a migration
(`prisma migrate dev --create-only`), hand-add the policy to the generated
SQL file:

```sql
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employees" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "employees"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
```

`tenantId` is stored as Postgres `TEXT` (Prisma's `String @default(uuid())` does not map to
the native `uuid` type), so the policy compares as text — do not add a `::uuid` cast, since
`current_setting` also returns text and `text = uuid` has no operator.

`FORCE ROW LEVEL SECURITY` matters: without it, the table owner role (which
Prisma's connection typically uses) bypasses RLS entirely.

## 3. Setting the tenant context per request

The database connection is pooled and reused across requests, so the tenant
GUC must be set **inside the same transaction** as the query it protects.
Use `withTenantContext` from `@africahr/platform-database`:

```ts
await this.prisma.withTenantContext(tenantId, (tx) =>
  tx.employee.findMany(),
);
```

This wraps the callback in `SET LOCAL app.current_tenant_id = $1` + the query
+ commit, inside one `$transaction`, so the setting never leaks across
requests sharing a pooled connection.

Application-level `tenantId` filters (e.g. `where: { tenantId }`) are still
required — RLS is the backstop for when a filter is forgotten, not a
replacement for it.

## 4. Nullable tenantId (platform-admin-owned rows)

A few tables (`users`, `refresh_tokens`, `audit_logs`) have a *nullable*
`tenantId` — `NULL` identifies platform-admin-owned data, which isn't scoped
to any tenant. The plain policy above breaks for these: since
`tenant_id = NULL` is never true in SQL, `FORCE ROW LEVEL SECURITY` would
hide platform-admin rows even from platform-admin's own (unscoped) queries.
Use this variant instead:

```sql
CREATE POLICY tenant_isolation ON "users"
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR (tenant_id IS NULL AND current_setting('app.current_tenant_id', true) = '__platform__')
  );
```

A row is visible if its `tenant_id` matches the current tenant context, OR
the row is platform-admin-owned AND the platform sentinel is set. This
keeps both directions strict: a tenant-scoped query never sees
platform-admin rows, and a platform-scoped query never accidentally sees
another tenant's rows.

**Compare against an explicit sentinel string (`'__platform__'`, exported as
`PLATFORM_SCOPE_SENTINEL` from `@africahr/platform-database`), never
`current_setting(...) IS NULL`.** This was the original design and it is
wrong — found the hard way (2026-07-11) as a real, reproducible
`PrismaClientKnownRequestError P2025` on concurrent platform-admin logins.
The mechanism: once a Postgres session has `SET` a custom GUC even a single
time, `current_setting(name, true)` can **never return NULL for it again**
for the life of that session — not via `RESET`, not via
`set_config(name, NULL, is_local)`; both just revert it to an empty string
or the session-level value, never back to true "never touched" NULL
(verified directly against Postgres, not assumed). On a connection that's
never touched the GUC, `IS NULL` happens to work — which is exactly why
this shipped and passed every manual test for weeks: single, low-concurrency
requests kept landing on fresh-enough pooled connections. Under real
concurrent load, a platform-admin query landing on any connection that had
*ever* previously served a tenant-scoped query would have its own row
silently filtered out. Use `this.prisma.withPlatformScope(fn)` (mirrors
`withTenantContext`, sets the sentinel instead of a tenant id) for every
platform-admin-scoped query — never run one bare against `this.prisma`
with no transaction, and never write a policy or a GUC-clearing call that
relies on reaching true NULL.

Note this does **not** make tenant-scoped rows visible to a platform-scoped
query — it only exempts platform-admin rows. A genuinely cross-tenant
unscoped lookup (e.g. login resolving a user by email alone, before any
tenant is known) needs the pattern in §5 instead.

## 5. Genuinely cross-tenant lookups (`SECURITY DEFINER` functions)

Some lookups have no tenant to scope by yet — e.g. login must resolve a
`User` from email alone, since email is globally unique and the tenant
isn't known until *after* that lookup succeeds. The app connects as
`africahr_app`, a least-privilege, non-superuser role (see the
2026-07-09 RLS-bypass fix in project memory), so a plain unscoped query
only ever sees platform-admin rows under the §4 policy — every
tenant-scoped row stays invisible.

For exactly these cases, add a narrow Postgres function, owned by the
migration/owner role (`africahr`, superuser) and marked `SECURITY DEFINER`,
so it runs with the owner's RLS-bypassing privileges regardless of caller —
then grant `EXECUTE` on it to `africahr_app`. This is a deliberate,
auditable exception scoped to exactly the columns the caller needs, not a
general RLS bypass:

```sql
CREATE FUNCTION find_user_for_login(p_email TEXT)
RETURNS TABLE (id TEXT, "tenantId" TEXT, /* ...only what's needed */ )
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, /* ... */
  FROM users
  WHERE email = p_email AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION find_user_for_login(TEXT) TO africahr_app;
```

Called from the repository via `this.prisma.$queryRaw` (see
`UserRepository.findByEmail`) — never widen `africahr_app`'s own grants to
cover this instead, since that would defeat RLS for every other query the
app role runs on that table.
