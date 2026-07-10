import { Injectable } from '@nestjs/common';
import { EmploymentType, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface HeadcountReportParams {
  organizationId?: string;
  from?: Date;
  to?: Date;
}

export interface HeadcountByEmploymentType {
  employmentType: EmploymentType;
  count: number;
}

export interface HeadcountByOrganizationUnit {
  organizationUnitId: string | null;
  count: number;
}

/**
 * Reads only the Employee fields headcount reporting needs. scope:reporting
 * cannot import employee-data-access's repository/service classes (Nx
 * module boundary), so this queries the shared "employees" table directly
 * through PrismaService — same cross-bounded-context read pattern used by
 * every module since Payroll, applied five times over here since Reporting
 * legitimately reads from five other modules' tables, not one.
 * "Headcount" is current-snapshot only: anyone not TERMINATED counts,
 * reconstructing historical point-in-time headcount from
 * EmploymentHistoryEntry is a deliberate v1 scope cut.
 */
@Injectable()
export class HeadcountReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  countActive(tenantId: string, params: HeadcountReportParams = {}): Promise<number> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.count({
        where: {
          tenantId,
          deletedAt: null,
          organizationId: params.organizationId,
          employmentStatus: { not: 'TERMINATED' },
        },
      }),
    );
  }

  async countByEmploymentType(
    tenantId: string,
    params: HeadcountReportParams = {},
  ): Promise<HeadcountByEmploymentType[]> {
    const rows = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.groupBy({
        by: ['employmentType'],
        where: {
          tenantId,
          deletedAt: null,
          organizationId: params.organizationId,
          employmentStatus: { not: 'TERMINATED' },
        },
        _count: { _all: true },
      }),
    );
    return rows.map((row) => ({ employmentType: row.employmentType, count: row._count._all }));
  }

  async countByOrganizationUnit(
    tenantId: string,
    params: HeadcountReportParams = {},
  ): Promise<HeadcountByOrganizationUnit[]> {
    const rows = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.groupBy({
        by: ['organizationUnitId'],
        where: {
          tenantId,
          deletedAt: null,
          organizationId: params.organizationId,
          employmentStatus: { not: 'TERMINATED' },
        },
        _count: { _all: true },
      }),
    );
    return rows.map((row) => ({
      organizationUnitId: row.organizationUnitId,
      count: row._count._all,
    }));
  }

  countHiresInPeriod(tenantId: string, params: HeadcountReportParams = {}): Promise<number> {
    const where: Prisma.EmployeeWhereInput = {
      tenantId,
      deletedAt: null,
      organizationId: params.organizationId,
      hireDate: { gte: params.from, lte: params.to },
    };
    return this.prisma.withTenantContext(tenantId, (tx) => tx.employee.count({ where }));
  }

  countTerminationsInPeriod(tenantId: string, params: HeadcountReportParams = {}): Promise<number> {
    const where: Prisma.EmployeeWhereInput = {
      tenantId,
      deletedAt: null,
      organizationId: params.organizationId,
      terminationDate: { gte: params.from, lte: params.to },
    };
    return this.prisma.withTenantContext(tenantId, (tx) => tx.employee.count({ where }));
  }
}
