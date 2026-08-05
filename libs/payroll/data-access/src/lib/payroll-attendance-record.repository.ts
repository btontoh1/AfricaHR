import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

/**
 * Reads only the attendance fields payroll needs to pay overtime during
 * pay-run processing. scope:payroll cannot import attendance-data-access's
 * repository/service classes (Nx module boundary), so this queries the
 * shared "attendance_records"/"attendance_policies" tables directly through
 * PrismaService - same cross-scope pattern as PayrollLeaveRequestRepository
 * reading "leave_requests"/"leave_types" directly.
 */
@Injectable()
export class PayrollAttendanceRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sum of overtimeHours across every AttendanceRecord falling within
   * [periodStart, periodEnd] - a record with a null overtimeHours (still
   * clocked in, or no clock-out yet) contributes 0, same "not yet computed"
   * treatment as a null hoursWorked.
   */
  async sumOvertimeHours(
    tenantId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    const records = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.attendanceRecord.findMany({
        where: {
          tenantId,
          employeeId,
          deletedAt: null,
          date: { gte: periodStart, lte: periodEnd },
        },
        select: { overtimeHours: true },
      }),
    );
    return records.reduce((sum, record) => sum + Number(record.overtimeHours ?? 0), 0);
  }

  /** The tenant's single AttendancePolicy.standardDailyHours, or null when the tenant hasn't configured one - see overtime-pay.ts (payroll-domain) for how the caller handles that case. */
  async findStandardDailyHours(tenantId: string): Promise<number | null> {
    const policy = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.attendancePolicy.findUnique({ where: { tenantId } }),
    );
    return policy ? Number(policy.standardDailyHours) : null;
  }
}
