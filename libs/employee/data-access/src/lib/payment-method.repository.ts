import { Injectable } from '@nestjs/common';
import { EmployeePaymentMethod, PaymentMethodType } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface UpsertPaymentMethodInput {
  type: PaymentMethodType;
  bankName?: string | null;
  bankCode?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  mobileMoneyProvider?: string | null;
  mobileMoneyNumber?: string | null;
  actorId?: string;
}

@Injectable()
export class PaymentMethodRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmployeeId(tenantId: string, employeeId: string): Promise<EmployeePaymentMethod | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employeePaymentMethod.findFirst({ where: { tenantId, employeeId } }),
    );
  }

  /** One record per employee — self-service upsert-in-place, no history kept. */
  upsert(
    tenantId: string,
    employeeId: string,
    input: UpsertPaymentMethodInput,
  ): Promise<EmployeePaymentMethod> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employeePaymentMethod.upsert({
        where: { employeeId },
        create: {
          tenantId,
          employeeId,
          type: input.type,
          bankName: input.bankName,
          bankCode: input.bankCode,
          accountNumber: input.accountNumber,
          accountName: input.accountName,
          mobileMoneyProvider: input.mobileMoneyProvider,
          mobileMoneyNumber: input.mobileMoneyNumber,
          createdBy: input.actorId,
          updatedBy: input.actorId,
        },
        update: {
          type: input.type,
          bankName: input.bankName,
          bankCode: input.bankCode,
          accountNumber: input.accountNumber,
          accountName: input.accountName,
          mobileMoneyProvider: input.mobileMoneyProvider,
          mobileMoneyNumber: input.mobileMoneyNumber,
          // Any edit invalidates a cached Paystack recipient created against
          // the old details (see PayRunService.disburse) - cheaper to always
          // clear it than to work out whether this particular edit changed
          // a field Paystack's recipient actually cares about.
          paystackRecipientCode: null,
          updatedBy: input.actorId,
        },
      }),
    );
  }
}
