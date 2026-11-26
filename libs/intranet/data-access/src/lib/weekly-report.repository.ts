import { Injectable } from '@nestjs/common';
import { WeeklyReport, WeeklyReportStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface SubmitWeeklyReportInput {
  tenantId: string;
  employeeId: string;
  weekStart: Date;
  answers: string[];
  actorId?: string;
}

export interface WeeklyReportEmployee {
  id: string;
  firstName: string;
  lastName: string;
  organizationUnitId: string | null;
}

export interface WeeklyReportWithEmployee extends WeeklyReport {
  employee: WeeklyReportEmployee;
}

const EMPLOYEE_SELECT = { id: true, firstName: true, lastName: true, organizationUnitId: true } as const;

@Injectable()
export class WeeklyReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Upsert by (employeeId, weekStart) - resubmitting the same week overwrites rather than duplicating. */
  submit(input: SubmitWeeklyReportInput): Promise<WeeklyReport> {
    return this.prisma.withTenantContext(input.tenantId, (tx) =>
      tx.weeklyReport.upsert({
        where: { employeeId_weekStart: { employeeId: input.employeeId, weekStart: input.weekStart } },
        create: {
          tenantId: input.tenantId,
          employeeId: input.employeeId,
          weekStart: input.weekStart,
          answers: input.answers,
          status: WeeklyReportStatus.SUBMITTED,
          submittedAt: new Date(),
          createdBy: input.actorId,
          updatedBy: input.actorId,
        },
        update: {
          answers: input.answers,
          status: WeeklyReportStatus.SUBMITTED,
          submittedAt: new Date(),
          updatedBy: input.actorId,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<WeeklyReportWithEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.weeklyReport.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: { employee: { select: EMPLOYEE_SELECT } },
      }),
    );
  }

  listForEmployee(tenantId: string, employeeId: string): Promise<WeeklyReport[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.weeklyReport.findMany({
        where: { tenantId, employeeId, deletedAt: null },
        orderBy: { weekStart: 'desc' },
      }),
    );
  }

  listForOrganizationUnit(
    tenantId: string,
    organizationUnitId: string,
    weekStart?: Date,
  ): Promise<WeeklyReportWithEmployee[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.weeklyReport.findMany({
        where: {
          tenantId,
          deletedAt: null,
          employee: { organizationUnitId },
          ...(weekStart ? { weekStart } : {}),
        },
        include: { employee: { select: EMPLOYEE_SELECT } },
        orderBy: [{ weekStart: 'desc' }, { employee: { firstName: 'asc' } }],
      }),
    );
  }

  listForTenant(tenantId: string, weekStart?: Date): Promise<WeeklyReportWithEmployee[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.weeklyReport.findMany({
        where: { tenantId, deletedAt: null, ...(weekStart ? { weekStart } : {}) },
        include: { employee: { select: EMPLOYEE_SELECT } },
        orderBy: [{ weekStart: 'desc' }, { employee: { firstName: 'asc' } }],
      }),
    );
  }
}
