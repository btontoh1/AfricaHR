import { Injectable } from '@nestjs/common';
import { CustomerInvoice, CustomerInvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export type CustomerInvoiceWithDetails = Prisma.CustomerInvoiceGetPayload<{
  include: { lineItems: true; customer: true; organization: true };
}>;

export interface InvoiceLineItemInput {
  description: string;
  quantity: Prisma.Decimal | number;
  unitPrice: Prisma.Decimal | number;
  amount: Prisma.Decimal | number;
  sortOrder: number;
}

export interface CreateCustomerInvoiceInput {
  organizationId: string;
  customerId: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  notes?: string;
  taxRate: Prisma.Decimal | number;
  subtotal: Prisma.Decimal | number;
  taxAmount: Prisma.Decimal | number;
  total: Prisma.Decimal | number;
  lineItems: InvoiceLineItemInput[];
  createdBy?: string;
}

export interface UpdateCustomerInvoiceInput {
  customerId?: string;
  issueDate?: Date;
  dueDate?: Date;
  currency?: string;
  notes?: string;
  taxRate?: Prisma.Decimal | number;
  subtotal?: Prisma.Decimal | number;
  taxAmount?: Prisma.Decimal | number;
  total?: Prisma.Decimal | number;
  lineItems?: InvoiceLineItemInput[];
  updatedBy?: string;
}

@Injectable()
export class CustomerInvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every invoice ever created for the organization, drafts included —
   * used only to derive the next sequence number for generateInvoiceNumber,
   * never displayed. Deliberately counts soft-deleted rows too, so deleting
   * a draft never frees its number up for reuse.
   */
  countByOrganization(tenantId: string, organizationId: string): Promise<number> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.customerInvoice.count({ where: { tenantId, organizationId } }),
    );
  }

  create(tenantId: string, input: CreateCustomerInvoiceInput): Promise<CustomerInvoiceWithDetails> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.customerInvoice.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          customerId: input.customerId,
          invoiceNumber: input.invoiceNumber,
          issueDate: input.issueDate,
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
        include: { lineItems: true, customer: true, organization: true },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<CustomerInvoiceWithDetails | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.customerInvoice.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, customer: true, organization: true },
      }),
    );
  }

  list(tenantId: string, organizationId?: string): Promise<CustomerInvoiceWithDetails[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.customerInvoice.findMany({
        where: { tenantId, organizationId, deletedAt: null },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, customer: true, organization: true },
        orderBy: { issueDate: 'desc' },
      }),
    );
  }

  /**
   * Line items are replaced wholesale (delete all, recreate) rather than
   * diffed and patched individually - same convention as
   * CustomerInvoiceLineItem's own doc comment. Only reachable pre-write by
   * CustomerInvoiceService while the invoice is still DRAFT.
   */
  async update(
    tenantId: string,
    id: string,
    input: UpdateCustomerInvoiceInput,
  ): Promise<CustomerInvoiceWithDetails> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      if (input.lineItems) {
        await tx.customerInvoiceLineItem.deleteMany({ where: { invoiceId: id } });
      }

      return tx.customerInvoice.update({
        where: { id },
        data: {
          customerId: input.customerId,
          issueDate: input.issueDate,
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
        include: { lineItems: { orderBy: { sortOrder: 'asc' } }, customer: true, organization: true },
      });
    });
  }

  updateStatus(
    tenantId: string,
    id: string,
    status: CustomerInvoiceStatus,
    extra: { sentAt?: Date; paidAt?: Date; updatedBy?: string },
  ): Promise<CustomerInvoice> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.customerInvoice.update({
        where: { id },
        data: {
          status,
          sentAt: extra.sentAt,
          paidAt: extra.paidAt,
          updatedBy: extra.updatedBy,
        },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<CustomerInvoice> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.customerInvoice.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy },
      }),
    );
  }
}
