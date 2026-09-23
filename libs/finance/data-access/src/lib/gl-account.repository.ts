import { Injectable } from '@nestjs/common';
import { GlAccount } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { DEFAULT_CHART_OF_ACCOUNTS } from '@africahr/finance-domain';

@Injectable()
export class GlAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent - upserts each of the six fixed default accounts by
   * (tenantId, code). Cheap enough to call unconditionally before every
   * posting/report operation rather than hooking tenant provisioning, so
   * tenants created before this feature shipped get the chart of accounts
   * on their first payroll/invoice/report action instead of needing a
   * backfill migration.
   */
  async ensureDefaultAccounts(tenantId: string): Promise<void> {
    await this.prisma.withTenantContext(tenantId, async (tx) => {
      for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
        await tx.glAccount.upsert({
          where: { tenantId_code: { tenantId, code: account.code } },
          create: { tenantId, code: account.code, name: account.name, type: account.type },
          update: {},
        });
      }
    });
  }

  listByTenant(tenantId: string): Promise<GlAccount[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glAccount.findMany({ where: { tenantId }, orderBy: { code: 'asc' } }),
    );
  }

  /**
   * Renames an account - the only thing the chart of accounts is editable
   * on. `code`/`type` stay fixed, since payroll/invoicing auto-posting
   * (see FinanceService) resolves accounts by code, not name - renaming
   * never risks breaking a posting. RLS scopes this to the tenant; a
   * mismatched id simply matches no row (Prisma throws P2025).
   */
  updateName(tenantId: string, id: string, name: string): Promise<GlAccount> {
    return this.prisma.withTenantContext(tenantId, (tx) => tx.glAccount.update({ where: { id }, data: { name } }));
  }

  /**
   * Resolves every one of `codes` to its account id in one round trip, so
   * posting callers only ever deal in stable account codes, never raw ids.
   * Throws if any code hasn't been seeded yet for this tenant - callers are
   * expected to have called ensureDefaultAccounts first, so this should
   * never actually happen in practice; it's a fail-loud guard, not a normal
   * path.
   */
  async mapCodesToIds(tenantId: string, codes: readonly string[]): Promise<Map<string, string>> {
    const uniqueCodes = [...new Set(codes)];
    const accounts = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glAccount.findMany({ where: { tenantId, code: { in: uniqueCodes } } }),
    );
    const idByCode = new Map(accounts.map((account) => [account.code, account.id]));
    const missing = uniqueCodes.filter((code) => !idByCode.has(code));
    if (missing.length > 0) {
      throw new Error(`GL account code(s) not found for tenant "${tenantId}": ${missing.join(', ')}`);
    }
    return idByCode;
  }
}
