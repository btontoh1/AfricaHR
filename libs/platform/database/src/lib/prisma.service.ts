import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { AppConfigService } from '@africahr/platform-core';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Sentinel value for "no tenant" (platform-admin) requests. Deliberately
 * NOT SQL NULL: once a Postgres session has SET a custom GUC even once,
 * current_setting(name, true) can never return NULL for it again for the
 * life of that session/connection - not via RESET, not via
 * set_config(name, NULL, is_local). On a pooled connection reused across
 * requests, that made the old "tenant_id IS NULL AND current_setting(...)
 * IS NULL" RLS policy fail unpredictably for platform-admin rows once a
 * connection had ever served a tenant-scoped query. A real, explicit
 * string is deterministic regardless of a connection's prior history. Must
 * match RLS_CONVENTION.md §4 and every "tenant_isolation" policy's
 * platform-admin branch.
 */
export const PLATFORM_SCOPE_SENTINEL = '__platform__';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: AppConfigService) {
    super({ adapter: new PrismaPg({ connectionString: config.appDatabaseUrl }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Runs `fn` inside a transaction with the tenant GUC set via `SET LOCAL`,
   * which Postgres RLS policies read via `current_setting('app.current_tenant_id')`.
   * `SET LOCAL` is transaction-scoped, so it cannot leak onto a pooled
   * connection once the transaction commits or rolls back.
   */
  async withTenantContext<T>(
    tenantId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
      return fn(tx);
    });
  }

  /**
   * Same guarantee as withTenantContext, for the platform-admin (no tenant)
   * case: explicitly sets the GUC to PLATFORM_SCOPE_SENTINEL inside its own
   * SET LOCAL-scoped transaction, rather than running the query on
   * whatever state a pooled connection happens to be in (or trying to
   * "unset" the GUC, which Postgres cannot reliably do once it's been
   * touched - see PLATFORM_SCOPE_SENTINEL's own docs).
   */
  async withPlatformScope<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${PLATFORM_SCOPE_SENTINEL}, true)`;
      return fn(tx);
    });
  }

  /**
   * Whole-database disk usage - a platform-wide operational metric, not
   * tenant data, so this deliberately doesn't go through
   * withTenantContext/withPlatformScope (same "direct, unscoped raw query"
   * posture as UserRepository.findByEmail).
   */
  async getDatabaseSizeBytes(): Promise<number> {
    const rows = await this.$queryRaw<
      { size: bigint }[]
    >`SELECT pg_database_size(current_database()) as size`;
    return Number(rows[0].size);
  }
}
