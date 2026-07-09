import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface PayrollEligibleEmployee {
  id: string;
  baseSalary: Prisma.Decimal | null;
  currency: string | null;
  countryCode: string;
}

/**
 * Reads only the Employee fields payroll needs to compute a pay run.
 * scope:payroll cannot import employee-data-access's repository/service
 * classes (Nx module boundary), so this queries the shared "employees"
 * table directly through PrismaService — the same "trust the shared
 * schema" pattern Employee itself uses for its Tenancy/IAM references,
 * extended here from FK-constraint validation to a scoped read.
 */
@Injectable()
export class PayrollEmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  listActiveByOrganization(
    tenantId: string,
    organizationId: string,
  ): Promise<PayrollEligibleEmployee[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findMany({
        where: { tenantId, organizationId, employmentStatus: 'ACTIVE', deletedAt: null },
        select: { id: true, baseSalary: true, currency: true, countryCode: true },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<PayrollEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: { id: true, baseSalary: true, currency: true, countryCode: true },
      }),
    );
  }
}
