import { Injectable } from '@nestjs/common';
import { BenefitContributionType, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface PayrollBenefitEnrollment {
  contributionType: BenefitContributionType;
  employeeContribution: Prisma.Decimal;
  employerContribution: Prisma.Decimal;
}

/**
 * Reads only the active-enrollment/plan-rate fields payroll needs to
 * deduct benefit premiums during pay-run processing. scope:payroll cannot
 * import benefits-data-access's repository/service classes (Nx module
 * boundary), so this queries the shared "benefit_enrollments"/
 * "benefit_plans" tables directly through PrismaService — same
 * cross-scope pattern as PayrollEmployeeRepository reading
 * "employee_payment_methods" directly.
 */
@Injectable()
export class PayrollBenefitEnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** effectiveDate <= asOf so a future-dated enrollment doesn't deduct yet; cancelled enrollments are excluded by the ACTIVE status filter (cancel() flips status immediately, see BenefitEnrollmentRepository.updateStatus). */
  async listActiveForEmployee(
    tenantId: string,
    employeeId: string,
    asOf: Date,
  ): Promise<PayrollBenefitEnrollment[]> {
    const enrollments = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.benefitEnrollment.findMany({
        where: {
          tenantId,
          employeeId,
          status: 'ACTIVE',
          deletedAt: null,
          effectiveDate: { lte: asOf },
        },
        select: {
          benefitPlan: {
            select: { contributionType: true, employeeContribution: true, employerContribution: true },
          },
        },
      }),
    );

    return enrollments.map((enrollment) => enrollment.benefitPlan);
  }
}
