import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface BenefitsEligibleEmployee {
  id: string;
  userId: string | null;
  baseSalary: Prisma.Decimal | null;
  firstName: string;
  lastName: string;
}

/**
 * Reads only the Employee fields benefits needs. scope:benefits cannot
 * import employee-data-access's repository/service classes (Nx module
 * boundary), so this queries the shared "employees" table directly through
 * PrismaService — same pattern as payroll's PayrollEmployeeRepository,
 * leave's LeaveEmployeeRepository, and attendance's
 * AttendanceEmployeeRepository. baseSalary is what makes live PERCENTAGE
 * contribution computation possible.
 */
@Injectable()
export class BenefitsEmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(tenantId: string, userId: string): Promise<BenefitsEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { tenantId, userId, deletedAt: null },
        select: { id: true, userId: true, baseSalary: true, firstName: true, lastName: true },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<BenefitsEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: { id: true, userId: true, baseSalary: true, firstName: true, lastName: true },
      }),
    );
  }
}
