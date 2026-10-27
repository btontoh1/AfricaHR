import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

/**
 * Reads only the tenant admin's email and the tenant's own operating
 * currency - needed as the customer identity and the allowed wallet
 * top-up currency on a Paystack checkout. scope:billing cannot import
 * tenancy-feature/tenancy-data-access or iam-feature/iam-data-access
 * (Nx module boundary), so this queries the shared "users"/"tenants"
 * tables directly through PrismaService — same cross-bounded-context read
 * pattern as BillingEmployeeCountRepository.
 */
@Injectable()
export class BillingTenantContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAdminEmail(tenantId: string): Promise<string | null> {
    const admin = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.user.findFirst({
        where: { tenantId, role: 'TENANT_ADMIN', deletedAt: null, isActive: true },
        select: { email: true },
        orderBy: { createdAt: 'asc' },
      }),
    );
    return admin?.email ?? null;
  }

  /**
   * The "tenants" table is the root of tenant isolation, not a tenant_id-
   * scoped child table - it has no RLS policy and no withTenantContext
   * wrapper, same as TenantRepository.findById (tenancy-data-access).
   */
  async findCurrency(tenantId: string): Promise<string | null> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: { currency: true },
    });
    return tenant?.currency ?? null;
  }
}
