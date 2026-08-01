import { Injectable } from '@nestjs/common';
import { Invoice, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateInvoiceInput {
  tenantId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  employeeCountAtIssue: number;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  paystackReference?: string;
  checkoutUrl?: string;
  createdBy?: string;
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  paidAt?: Date;
  paystackReference?: string;
  checkoutUrl?: string;
  updatedBy?: string;
}

/**
 * Every read/write here is tenant-scoped — the one exception, resolving an
 * invoice from a Paystack webhook payload (which has no tenant context),
 * lives on PlatformBillingRepository instead, via the same §5 SECURITY
 * DEFINER pattern as UserRepository.findByEmail.
 */
@Injectable()
export class InvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateInvoiceInput): Promise<Invoice> {
    return this.prisma.withTenantContext(input.tenantId, (tx) =>
      tx.invoice.create({
        data: {
          tenantId: input.tenantId,
          subscriptionId: input.subscriptionId,
          amount: input.amount,
          currency: input.currency,
          employeeCountAtIssue: input.employeeCountAtIssue,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          dueDate: input.dueDate,
          paystackReference: input.paystackReference,
          checkoutUrl: input.checkoutUrl,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  listByTenant(tenantId: string): Promise<Invoice[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.invoice.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
    );
  }

  findById(tenantId: string, id: string): Promise<Invoice | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.invoice.findFirst({ where: { id, tenantId } }),
    );
  }

  update(tenantId: string, id: string, input: UpdateInvoiceInput): Promise<Invoice> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.invoice.update({ where: { id }, data: input }),
    );
  }
}
