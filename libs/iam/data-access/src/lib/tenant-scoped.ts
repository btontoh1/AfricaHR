import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export type ScopedClient = PrismaService | Prisma.TransactionClient;

/**
 * Runs `fn` under RLS tenant scoping when `tenantId` is present, or directly
 * (no scoping — this is the platform-admin case) when it's null. Shared by
 * every repository in this lib whose rows can belong to a platform admin
 * (tenantId null) or a tenant (tenantId set) — see RLS_CONVENTION.md.
 */
export function withScope<T>(
  prisma: PrismaService,
  tenantId: string | null,
  fn: (client: ScopedClient) => Promise<T>,
): Promise<T> {
  return tenantId ? prisma.withTenantContext(tenantId, fn) : fn(prisma);
}
