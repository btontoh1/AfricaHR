import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface PerformanceEligibleEmployee {
  id: string;
  userId: string | null;
  managerId: string | null;
}

export interface PerformanceEmployeeName {
  id: string;
  firstName: string;
  lastName: string;
}

/**
 * Reads only the Employee fields performance needs. scope:performance
 * cannot import employee-data-access's repository/service classes (Nx
 * module boundary), so this queries the shared "employees" table directly
 * through PrismaService — same pattern as payroll/leave/attendance/
 * benefits' equivalent readers. managerId is what makes the new
 * direct-manager authorization tier possible (see project memory) — the
 * first module to read this field for an authorization decision rather
 * than just hierarchy display.
 */
@Injectable()
export class PerformanceEmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(tenantId: string, userId: string): Promise<PerformanceEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { tenantId, userId, deletedAt: null },
        select: { id: true, userId: true, managerId: true },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<PerformanceEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: { id: true, userId: true, managerId: true },
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

  findManyByIds(tenantId: string, ids: string[]): Promise<PerformanceEmployeeName[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findMany({
        where: { tenantId, id: { in: ids }, deletedAt: null },
        select: { id: true, firstName: true, lastName: true },
      }),
    );
  }
}
