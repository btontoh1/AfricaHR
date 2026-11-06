import { Injectable } from '@nestjs/common';
import { Prisma, VendorBillStatus, VendorPaymentMethod } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export type VendorPaymentWithDetails = Prisma.VendorPaymentGetPayload<{
  include: { vendor: true; allocations: { include: { bill: true } } };
}>;

export interface CreatePaymentAllocationInput {
  billId: string;
  amount: Prisma.Decimal | number;
}

/** What VendorPaymentService has already computed each allocated bill's new
 * amountPaid/status to be - applied in the same transaction as the payment
 * itself. */
export interface BillUpdateForPayment {
  billId: string;
  amountPaid: Prisma.Decimal | number;
  status: VendorBillStatus;
  paidAt?: Date;
}

export interface CreateVendorPaymentInput {
  organizationId: string;
  vendorId: string;
  paymentDate: Date;
  currency: string;
  amount: Prisma.Decimal | number;
  method: VendorPaymentMethod;
  reference?: string;
  notes?: string;
  allocations: CreatePaymentAllocationInput[];
  billUpdates: BillUpdateForPayment[];
  createdBy?: string;
}

@Injectable()
export class VendorPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates the payment + its allocations and updates every allocated
   * bill's amountPaid/status/paidAt, all in one transaction (withTenantContext
   * already wraps its callback in $transaction) - unlike
   * RecurringJournalEntryPoster's post-then-markRun flow, there's no daily
   * sweep to retry a vendor payment on a later day, so a partial write here
   * (payment recorded but a bill's balance not updated) would be a
   * permanent, undetectable inconsistency rather than a self-healing gap.
   */
  create(tenantId: string, input: CreateVendorPaymentInput): Promise<VendorPaymentWithDetails> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      const payment = await tx.vendorPayment.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          vendorId: input.vendorId,
          paymentDate: input.paymentDate,
          currency: input.currency,
          amount: input.amount,
          method: input.method,
          reference: input.reference,
          notes: input.notes,
          createdBy: input.createdBy,
          allocations: {
            create: input.allocations.map((allocation) => ({
              tenantId,
              billId: allocation.billId,
              amount: allocation.amount,
            })),
          },
        },
        include: { vendor: true, allocations: { include: { bill: true } } },
      });

      for (const update of input.billUpdates) {
        await tx.vendorBill.update({
          where: { id: update.billId },
          data: { amountPaid: update.amountPaid, status: update.status, paidAt: update.paidAt },
        });
      }

      return payment;
    });
  }

  findById(tenantId: string, id: string): Promise<VendorPaymentWithDetails | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendorPayment.findFirst({
        where: { id, tenantId },
        include: { vendor: true, allocations: { include: { bill: true } } },
      }),
    );
  }

  list(tenantId: string, organizationId?: string, vendorId?: string): Promise<VendorPaymentWithDetails[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendorPayment.findMany({
        where: { tenantId, organizationId, vendorId },
        include: { vendor: true, allocations: { include: { bill: true } } },
        orderBy: { paymentDate: 'desc' },
      }),
    );
  }
}
