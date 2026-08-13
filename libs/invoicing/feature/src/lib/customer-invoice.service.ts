import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomerInvoiceStatus as PrismaCustomerInvoiceStatus, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { assertOrganizationScope, RequestUser, SystemRole } from '@africahr/platform-auth';
import { CustomerInvoiceRepository, CustomerInvoiceWithDetails } from '@africahr/invoicing-data-access';
import {
  assertValidInvoiceStatusTransition,
  computeInvoiceTotals,
  generateInvoiceNumber,
} from '@africahr/invoicing-domain';
import { CustomerService } from './customer.service';
import { CreateCustomerInvoiceDto } from './dto/create-customer-invoice.dto';
import { UpdateCustomerInvoiceDto } from './dto/update-customer-invoice.dto';
import { CustomerInvoiceResponseDto } from './dto/customer-invoice-response.dto';

function translateReferenceError(error: unknown, organizationId: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    throw new NotFoundException(`Organization "${organizationId}" not found`);
  }
  throw error;
}

function toResponseDto(invoice: CustomerInvoiceWithDetails): CustomerInvoiceResponseDto {
  return {
    id: invoice.id,
    organizationId: invoice.organizationId,
    customerId: invoice.customerId,
    customerName: invoice.customer.name,
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    currency: invoice.currency,
    status: invoice.status,
    notes: invoice.notes,
    taxRate: invoice.taxRate.toString(),
    subtotal: invoice.subtotal.toString(),
    taxAmount: invoice.taxAmount.toString(),
    total: invoice.total.toString(),
    sentAt: invoice.sentAt?.toISOString() ?? null,
    paidAt: invoice.paidAt?.toISOString() ?? null,
    lineItems: invoice.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      amount: item.amount.toString(),
      sortOrder: item.sortOrder,
    })),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

@Injectable()
export class CustomerInvoiceService {
  constructor(
    private readonly invoices: CustomerInvoiceRepository,
    private readonly customers: CustomerService,
    private readonly audit: AuditService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateCustomerInvoiceDto,
    actor: RequestUser,
  ): Promise<CustomerInvoiceResponseDto> {
    assertOrganizationScope(actor, dto.organizationId);
    // Confirms the customer both exists and belongs to this same
    // organization - findCustomerOrThrow's own assertOrganizationScope call
    // rejects a cross-organization customerId even for a tenant-wide role
    // that would otherwise pass the check above.
    await this.customers.findCustomerOrThrow(tenantId, dto.customerId, actor);

    const nextSequence = (await this.invoices.countByOrganization(tenantId, dto.organizationId)) + 1;
    const invoiceNumber = generateInvoiceNumber(nextSequence);

    const lineItems = dto.lineItems.map((item, index) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
      sortOrder: index,
    }));
    const totals = computeInvoiceTotals(dto.lineItems, dto.taxRate ?? 0);

    let invoice: CustomerInvoiceWithDetails;
    try {
      invoice = await this.invoices.create(tenantId, {
        organizationId: dto.organizationId,
        customerId: dto.customerId,
        invoiceNumber,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        currency: dto.currency,
        notes: dto.notes,
        taxRate: dto.taxRate ?? 0,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        lineItems,
        createdBy: actor.sub,
      });
    } catch (error) {
      translateReferenceError(error, dto.organizationId);
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'customer_invoice.created',
      resourceType: 'CustomerInvoice',
      resourceId: invoice.id,
    });

    return toResponseDto(invoice);
  }

  async findById(tenantId: string, id: string, actor: RequestUser): Promise<CustomerInvoiceResponseDto> {
    const invoice = await this.findInvoiceOrThrow(tenantId, id, actor);
    return toResponseDto(invoice);
  }

  async list(
    tenantId: string,
    organizationId: string | undefined,
    actor: RequestUser,
  ): Promise<CustomerInvoiceResponseDto[]> {
    const scopedOrganizationId =
      actor.role === SystemRole.ORG_ADMIN ? (actor.organizationId ?? undefined) : organizationId;
    const invoices = await this.invoices.list(tenantId, scopedOrganizationId);
    return invoices.map(toResponseDto);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCustomerInvoiceDto,
    actor: RequestUser,
  ): Promise<CustomerInvoiceResponseDto> {
    const existing = await this.findInvoiceOrThrow(tenantId, id, actor);
    if (existing.status !== PrismaCustomerInvoiceStatus.DRAFT) {
      throw new ConflictException('Only a Draft invoice can be edited');
    }

    if (dto.customerId) {
      await this.customers.findCustomerOrThrow(tenantId, dto.customerId, actor);
    }

    const taxRate = dto.taxRate ?? Number(existing.taxRate);
    const lineItemInputs = dto.lineItems ?? existing.lineItems;
    const totals = computeInvoiceTotals(
      lineItemInputs.map((item) => ({ quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })),
      taxRate,
    );

    const updated = await this.invoices.update(tenantId, id, {
      customerId: dto.customerId,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      currency: dto.currency,
      notes: dto.notes,
      taxRate: dto.taxRate,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      lineItems: dto.lineItems?.map((item, index) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
        sortOrder: index,
      })),
      updatedBy: actor.sub,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'customer_invoice.updated',
      resourceType: 'CustomerInvoice',
      resourceId: id,
    });

    return toResponseDto(updated);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: PrismaCustomerInvoiceStatus,
    actor: RequestUser,
  ): Promise<CustomerInvoiceResponseDto> {
    const existing = await this.findInvoiceOrThrow(tenantId, id, actor);
    assertValidInvoiceStatusTransition(existing.status, status);

    await this.invoices.updateStatus(tenantId, id, status, {
      sentAt: status === PrismaCustomerInvoiceStatus.SENT ? new Date() : undefined,
      paidAt: status === PrismaCustomerInvoiceStatus.PAID ? new Date() : undefined,
      updatedBy: actor.sub,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'customer_invoice.status_changed',
      resourceType: 'CustomerInvoice',
      resourceId: id,
      metadata: { from: existing.status, to: status },
    });

    return this.findById(tenantId, id, actor);
  }

  async softDelete(tenantId: string, id: string, actor: RequestUser): Promise<void> {
    const existing = await this.findInvoiceOrThrow(tenantId, id, actor);
    if (existing.status !== PrismaCustomerInvoiceStatus.DRAFT) {
      throw new ConflictException('Only a Draft invoice can be deleted - cancel it instead');
    }

    await this.invoices.softDelete(tenantId, id, actor.sub);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'customer_invoice.deleted',
      resourceType: 'CustomerInvoice',
      resourceId: id,
    });
  }

  /**
   * Internal lookup used by InvoicePdfService too - returns the full Prisma
   * shape (Decimal fields, not stringified) since the PDF renderer needs
   * numeric values to format, not the API-response string shape.
   */
  async findInvoiceOrThrow(tenantId: string, id: string, actor: RequestUser): Promise<CustomerInvoiceWithDetails> {
    const invoice = await this.invoices.findById(tenantId, id);
    if (!invoice) {
      throw new NotFoundException(`Invoice "${id}" not found`);
    }
    assertOrganizationScope(actor, invoice.organizationId);
    return invoice;
  }
}
