import { Injectable } from '@nestjs/common';
import { PayslipLineItem, PayslipLineItemType, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreatePayslipLineItemInput {
  payslipId: string;
  type: PayslipLineItemType;
  code: string;
  description?: string;
  amount: Prisma.Decimal | number;
  createdBy?: string;
}

@Injectable()
export class PayslipLineItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreatePayslipLineItemInput): Promise<PayslipLineItem> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payslipLineItem.create({
        data: {
          tenantId,
          payslipId: input.payslipId,
          type: input.type,
          code: input.code,
          description: input.description,
          amount: input.amount,
          createdBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<PayslipLineItem | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payslipLineItem.findFirst({ where: { id, tenantId } }),
    );
  }

  listByPayslip(tenantId: string, payslipId: string): Promise<PayslipLineItem[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payslipLineItem.findMany({ where: { tenantId, payslipId }, orderBy: { createdAt: 'asc' } }),
    );
  }

  delete(tenantId: string, id: string): Promise<PayslipLineItem> {
    return this.prisma.withTenantContext(tenantId, (tx) => tx.payslipLineItem.delete({ where: { id } }));
  }
}
