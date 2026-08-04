import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

/**
 * Reads only the leave-request fields payroll needs to deduct unpaid
 * leave during pay-run processing. scope:payroll cannot import
 * leave-data-access's repository/service classes (Nx module boundary),
 * so this queries the shared "leave_requests"/"leave_types" tables
 * directly through PrismaService — same cross-scope pattern as
 * PayrollBenefitEnrollmentRepository reading "benefit_enrollments"/
 * "benefit_plans" directly.
 */
@Injectable()
export class PayrollLeaveRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sum of daysRequested for every APPROVED leave request on an unpaid
   * LeaveType that falls entirely within [periodStart, periodEnd] - a
   * request spanning a pay-period boundary is deliberately not counted
   * (or split across periods) in v1, matching leave-domain's own "no
   * public holiday calendar in v1" style scope cut.
   */
  async sumUnpaidDays(
    tenantId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    const requests = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveRequest.findMany({
        where: {
          tenantId,
          employeeId,
          status: 'APPROVED',
          deletedAt: null,
          startDate: { gte: periodStart },
          endDate: { lte: periodEnd },
          leaveType: { isPaid: false },
        },
        select: { daysRequested: true },
      }),
    );
    return requests.reduce((sum, request) => sum + Number(request.daysRequested), 0);
  }
}
