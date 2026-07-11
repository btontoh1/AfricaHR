import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export type ScopedClient = PrismaService | Prisma.TransactionClient;

/**
 * Runs `fn` under RLS tenant scoping when `tenantId` is present, or under
 * the platform-admin (no tenant) scope when it's null. Both branches run
 * inside their own transaction that explicitly sets the GUC to the right
 * value — never bare against `prisma` with no transaction, which was found
 * to intermittently leak a stale tenant GUC from a pooled connection under
 * concurrent load (see PrismaService.withPlatformScope). Shared by every
 * repository in this lib whose rows can belong to a platform admin
 * (tenantId null) or a tenant (tenantId set) — see RLS_CONVENTION.md.
 */
export function withScope<T>(
  prisma: PrismaService,
  tenantId: string | null,
  fn: (client: ScopedClient) => Promise<T>,
): Promise<T> {
  return tenantId ? prisma.withTenantContext(tenantId, fn) : prisma.withPlatformScope(fn);
}
