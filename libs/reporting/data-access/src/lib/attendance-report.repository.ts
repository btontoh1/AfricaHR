import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface AttendanceReportParams {
  organizationId?: string;
  from: Date;
  to: Date;
}

export interface AttendanceSummary {
  recordCount: number;
  employeeCount: number;
  totalHoursWorked: number;
  totalOvertimeHours: number;
}

/**
 * Reads AttendanceRecord fields attendance reporting needs, via the shared
 * PrismaService directly (same cross-bounded-context read pattern as
 * HeadcountReportRepository). Only clocked-out records (hoursWorked not
 * null) count toward totals — a still-open clock-in has nothing to sum yet.
 */
@Injectable()
export class AttendanceReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async summarize(tenantId: string, params: AttendanceReportParams): Promise<AttendanceSummary> {
    const records = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.attendanceRecord.findMany({
        where: {
          tenantId,
          deletedAt: null,
          date: { gte: params.from, lte: params.to },
          hoursWorked: { not: null },
          employee: params.organizationId ? { organizationId: params.organizationId } : undefined,
        },
        select: { employeeId: true, hoursWorked: true, overtimeHours: true },
      }),
    );

    const employeeIds = new Set<string>();
    let totalHoursWorked = 0;
    let totalOvertimeHours = 0;

    for (const record of records) {
      employeeIds.add(record.employeeId);
      totalHoursWorked += record.hoursWorked?.toNumber() ?? 0;
      totalOvertimeHours += record.overtimeHours?.toNumber() ?? 0;
    }

    return {
      recordCount: records.length,
      employeeCount: employeeIds.size,
      totalHoursWorked,
      totalOvertimeHours,
    };
  }
}
