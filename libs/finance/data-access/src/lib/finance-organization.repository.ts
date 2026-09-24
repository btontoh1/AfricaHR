import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface FinanceOrganizationInfo {
  id: string;
  legalName: string;
  address: string | null;
}

const ORGANIZATION_SELECT = {
  id: true,
  legalName: true,
  address: true,
} as const;

/**
 * Reads only the Organization fields a report PDF needs for its letterhead
 * (name/address). scope:finance cannot import tenancy-data-access's
 * repository/service classes (Nx module boundary), so this queries the
 * shared "organizations" table directly through PrismaService - same
 * pattern as payroll-data-access's PayrollOrganizationRepository.
 */
@Injectable()
export class FinanceOrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string): Promise<FinanceOrganizationInfo | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: ORGANIZATION_SELECT,
      }),
    );
  }
}
