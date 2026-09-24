import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface PayrollOrganizationInfo {
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
 * Reads only the Organization fields a payslip needs to show its employer
 * header (name/address). scope:payroll cannot import tenancy-data-access's
 * repository/service classes (Nx module boundary), so this queries the
 * shared "organizations" table directly through PrismaService - same
 * pattern as PayrollEmployeeRepository.
 */
@Injectable()
export class PayrollOrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string): Promise<PayrollOrganizationInfo | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: ORGANIZATION_SELECT,
      }),
    );
  }

  /** Batches one query for a set of organization ids, rather than one query per organization - used to enrich payslip lists with the employer's name/address. */
  findManyByIds(tenantId: string, ids: string[]): Promise<PayrollOrganizationInfo[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.findMany({
        where: { id: { in: ids }, tenantId, deletedAt: null },
        select: ORGANIZATION_SELECT,
      }),
    );
  }
}
