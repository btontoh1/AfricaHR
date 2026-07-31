import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface LeaveEligibleEmployee {
  id: string;
  userId: string | null;
  managerId: string | null;
  firstName: string;
  lastName: string;
}

export interface LeaveEmployeeName {
  id: string;
  firstName: string;
  lastName: string;
}

/**
 * Reads only the Employee fields leave management needs. scope:leave cannot
 * import employee-data-access's repository/service classes (Nx module
 * boundary), so this queries the shared "employees" table directly through
 * PrismaService — same pattern as payroll's PayrollEmployeeRepository.
 * findByUserId is what makes self-service possible: resolving "the caller's
 * own Employee record" from the JWT's User id. managerId/listDirectReportIds
 * mirror PerformanceEmployeeRepository's direct-manager authorization tier.
 */
@Injectable()
export class LeaveEmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(tenantId: string, userId: string): Promise<LeaveEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { tenantId, userId, deletedAt: null },
        select: { id: true, userId: true, managerId: true, firstName: true, lastName: true },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<LeaveEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: { id: true, userId: true, managerId: true, firstName: true, lastName: true },
      }),
    );
  }

  async listDirectReportIds(tenantId: string, managerEmployeeId: string): Promise<string[]> {
    const reports = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findMany({
        where: { tenantId, managerId: managerEmployeeId, deletedAt: null },
        select: { id: true },
      }),
    );
    return reports.map((report) => report.id);
  }

  findManyByIds(tenantId: string, ids: string[]): Promise<LeaveEmployeeName[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findMany({
        where: { tenantId, id: { in: ids }, deletedAt: null },
        select: { id: true, firstName: true, lastName: true },
      }),
    );
  }
}
