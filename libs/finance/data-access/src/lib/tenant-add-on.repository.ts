import { Injectable } from '@nestjs/common';
import { AddOnModule } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

/**
 * Reads only Tenant.enabledAddOns. scope:finance cannot import
 * tenancy-data-access's repository/service classes (Nx module boundary),
 * so this queries the shared "tenants" table directly through
 * PrismaService - same pattern as FinanceOrganizationRepository. Used by
 * FinanceService's auto-posting methods (postPayrollDisbursement etc.) to
 * skip GL posting for a tenant that hasn't enabled Finance - those methods
 * run from internal event listeners, not HTTP requests, so AddOnGuard
 * (which only runs on the HTTP pipeline) never sees them. "tenants" has no
 * RLS policy, same posture as every other plain Tenant read in this
 * codebase (e.g. PlatformBillingRepository.listTenantNames) - a plain,
 * unscoped query.
 */
@Injectable()
export class TenantAddOnRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(tenantId: string, addOn: AddOnModule): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { enabledAddOns: true },
    });
    return tenant?.enabledAddOns.includes(addOn) ?? false;
  }
}
