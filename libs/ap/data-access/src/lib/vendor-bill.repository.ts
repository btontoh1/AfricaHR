import { Injectable } from '@nestjs/common';
import { Prisma, VendorBill, VendorBillStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export type VendorBillWithDetails = Prisma.VendorBillGetPayload<{
  include: { lineItems: true; vendor: true; organization: true };
}>;

export interface BillLineItemInput {
  description: string;
  quantity: Prisma.Decimal | number;
  unitPrice: Prisma.Decimal | number;
  amount: Prisma.Decimal | number;
  sortOrder: number;
}

export interface CreateVendorBillInput {
  organizationId: string;
  vendorId: string;
  billNumber: string;
  vendorReference?: string;
  billDate: Date;
  dueDate: Date;
  currency: string;
  notes?: string;
  taxRate: Prisma.Decimal | number;
  subtotal: Prisma.Decimal | number;
  taxAmount: Prisma.Decimal | number;
  total: Prisma.Decimal | number;
  lineItems: BillLineItemInput[];
  createdBy?: string;
}

export interface UpdateVendorBillInput {
  vendorId?: string;
  vendorReference?: string;
  billDate?: Date;
  dueDate?: Date;
  currency?: string;
  notes?: string;
  taxRate?: Prisma.Decimal | number;
  subtotal?: Prisma.Decimal | number;
  taxAmount?: Prisma.Decimal | number;
  total?: Prisma.Decimal | number;
  lineItems?: BillLineItemInput[];
  updatedBy?: string;
}

@Injectable()
export class VendorBillRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every bill ever created for the organization, drafts included - used
   * only to derive the next sequence number for generateBillNumber, same
   * convention as CustomerInvoiceRepository.countByOrganization.
   */
  countByOrganization(tenantId: string, organizationId: string): Promise<number> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendorBill.count({ where: { tenantId, organizationId } }),
    );
  }

  create(tenantId: string, input: CreateVendorBillInput): Promise<VendorBillWithDetails> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendorBill.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          vendorId: input.vendorId,
          billNumber: input.billNumber,
          vendorReference: input.vendorReference,
          billDate: input.billDate,
          dueDate: input.dueDate,
          currency: input.currency,
          notes: input.notes,
          taxRate: input.taxRate,
          subtotal: input.subtotal,
          taxAmount: input.taxAmount,
          total: input.total,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
          lineItems: {
            create: input.lineItems.map((item) => ({
              tenantId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
              sortOrder: item.sortOrder,
              createdBy: input.createdBy,
            })),
          },
        },
        include: { lineItems: true, vendor: true, organization: true },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<VendorBillWithDetails | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendorBill.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, vendor: true, organization: true },
      }),
    );
  }

  list(tenantId: string, organizationId?: string): Promise<VendorBillWithDetails[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendorBill.findMany({
        where: { tenantId, organizationId, deletedAt: null },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, vendor: true, organization: true },
        orderBy: { billDate: 'desc' },
      }),
    );
  }

  /** VendorPaymentService's pre-write read - fetches every bill an
   * allocation references in one query, so it can validate each is this
   * vendor's, still open, and has enough remaining balance before ever
   * calling VendorPaymentRepository.create. */
  findManyByIds(tenantId: string, ids: string[]): Promise<VendorBillWithDetails[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendorBill.findMany({
        where: { id: { in: ids }, tenantId, deletedAt: null },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, vendor: true, organization: true },
      }),
    );
  }

  /**
   * Line items are replaced wholesale (delete all, recreate) rather than
   * diffed and patched individually - same convention as
   * CustomerInvoiceRepository.update. Only reachable pre-write by
   * VendorBillService while the bill is still DRAFT.
   */
  async update(tenantId: string, id: string, input: UpdateVendorBillInput): Promise<VendorBillWithDetails> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      if (input.lineItems) {
        await tx.vendorBillLineItem.deleteMany({ where: { billId: id } });
      }

      return tx.vendorBill.update({
        where: { id },
        data: {
          vendorId: input.vendorId,
          vendorReference: input.vendorReference,
          billDate: input.billDate,
          dueDate: input.dueDate,
          currency: input.currency,
          notes: input.notes,
          taxRate: input.taxRate,
          subtotal: input.subtotal,
          taxAmount: input.taxAmount,
          total: input.total,
          updatedBy: input.updatedBy,
          lineItems: input.lineItems
            ? {
                create: input.lineItems.map((item) => ({
                  tenantId,
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  amount: item.amount,
                  sortOrder: item.sortOrder,
                  createdBy: input.updatedBy,
                })),
              }
            : undefined,
        },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, vendor: true, organization: true },
      });
    });
  }

  updateStatus(
    tenantId: string,
    id: string,
    status: VendorBillStatus,
    extra: { approvedAt?: Date; paidAt?: Date; updatedBy?: string },
  ): Promise<VendorBill> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendorBill.update({
        where: { id },
        data: {
          status,
          approvedAt: extra.approvedAt,
          paidAt: extra.paidAt,
          updatedBy: extra.updatedBy,
        },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<VendorBill> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendorBill.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy },
      }),
    );
  }
}
