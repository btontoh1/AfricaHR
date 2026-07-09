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
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
```

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
