import { Injectable } from '@nestjs/common';
import { PaymentMethodType, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface PayrollEligibleEmployee {
  id: string;
  firstName: string;
  lastName: string;
  baseSalary: Prisma.Decimal | null;
  currency: string | null;
  annualRentPaid: Prisma.Decimal | null;
  countryCode: string;
}

export interface PayrollEmployeeIdentity {
  id: string;
  userId: string | null;
}

export interface PayrollEmployeePaymentMethod {
  type: PaymentMethodType;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  mobileMoneyNumber: string | null;
  /** Not encrypted - see EmployeePaymentMethod.paystackRecipientCode's schema comment. */
  paystackRecipientCode: string | null;
}

const EMPLOYEE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  baseSalary: true,
  currency: true,
  annualRentPaid: true,
  countryCode: true,
} as const;

/**
 * Reads only the Employee fields payroll needs to compute a pay run and
 * disburse it. scope:payroll cannot import employee-data-access's
 * repository/service classes (Nx module boundary), so this queries the
 * shared "employees"/"employee_payment_methods" tables directly through
 * PrismaService — the same "trust the shared schema" pattern Employee
 * itself uses for its Tenancy/IAM references, extended here from
 * FK-constraint validation to a scoped read.
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
        select: EMPLOYEE_SELECT,
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<PayrollEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: EMPLOYEE_SELECT,
      }),
    );
  }

  /** Resolves the caller's own employeeId for self-service payslip access. */
  findByUserId(tenantId: string, userId: string): Promise<PayrollEmployeeIdentity | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { tenantId, userId, deletedAt: null },
        select: { id: true, userId: true },
      }),
    );
  }

  /** Used by PayRunService.markPaid to resolve where to disburse an employee's pay via Paystack Transfers. */
  findPaymentMethodByEmployeeId(
    tenantId: string,
    employeeId: string,
  ): Promise<PayrollEmployeePaymentMethod | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employeePaymentMethod.findFirst({
        where: { tenantId, employeeId },
        select: {
          type: true,
          bankCode: true,
          accountNumber: true,
          accountName: true,
          mobileMoneyNumber: true,
          paystackRecipientCode: true,
        },
      }),
    );
  }

  /** Caches a newly-created Paystack transfer recipient so later pay runs for this employee reuse it instead of creating a new one each time (see PayRunService.disburse). */
  savePaystackRecipientCode(tenantId: string, employeeId: string, paystackRecipientCode: string): Promise<void> {
    return this.prisma
      .withTenantContext(tenantId, (tx) =>
        tx.employeePaymentMethod.update({
          where: { employeeId },
          data: { paystackRecipientCode },
        }),
      )
      .then(() => undefined);
  }
}
