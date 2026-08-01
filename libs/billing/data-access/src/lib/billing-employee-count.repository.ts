import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

/**
 * Reads only the Employee count billing needs. scope:billing cannot import
 * employee-data-access's repository/service classes (Nx module boundary),
 * so this queries the shared "employees" table directly through
 * PrismaService — same cross-bounded-context read pattern as
 * HeadcountReportRepository. Uses the identical "active" definition
 * (deletedAt: null AND employmentStatus != TERMINATED) as the dashboard's
 * "Active employees" stat, so a tenant's invoice line-item count always
 * matches what they see on their own dashboard.
 */
@Injectable()
export class BillingEmployeeCountRepository {
  constructor(private readonly prisma: PrismaService) {}

  countActive(tenantId: string): Promise<number> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.count({
        where: { tenantId, deletedAt: null, employmentStatus: { not: 'TERMINATED' } },
      }),
    );
  }
}
