import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VendorBillStatus as PrismaVendorBillStatus, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { assertOrganizationScope, RequestUser, SystemRole } from '@africahr/platform-auth';
import { VendorBillRepository, VendorBillWithDetails } from '@africahr/ap-data-access';
import {
  assertValidBillStatusTransition,
  computeBillTotals,
  computeRemainingBalance,
  generateBillNumber,
  PAYMENT_DRIVEN_STATUSES,
} from '@africahr/ap-domain';
import { VendorService } from './vendor.service';
import { CreateVendorBillDto } from './dto/create-vendor-bill.dto';
import { UpdateVendorBillDto } from './dto/update-vendor-bill.dto';
import { VendorBillResponseDto } from './dto/vendor-bill-response.dto';

function translateReferenceError(error: unknown, organizationId: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    throw new NotFoundException(`Organization "${organizationId}" not found`);
  }
  throw error;
}

/**
 * Emitted on every status transition this service makes (APPROVED included)
 * - consumed by finance-feature's ApGlPostingListener to post the bill's GL
 * journal entry (it ignores every other status). Never fired with toStatus
 * PARTIALLY_PAID/PAID - those are only ever reached via
 * VendorPaymentService.create, which emits its own VENDOR_PAYMENT_RECORDED
 * event instead (one payment can cover several bills, so a single bill's
 * status change isn't the right unit for that posting). Lives as a plain
 * event rather than a direct call because scope:ap is not allowed to depend
 * on scope:finance (see eslint.config.mjs module boundaries), same
 * decoupling reasoning as invoicing's CUSTOMER_INVOICE_STATUS_CHANGED_EVENT.
 * total is passed as a plain number (not Prisma.Decimal) since scope:finance
 * can't share a Prisma-typed contract across the boundary.
 */
export const VENDOR_BILL_STATUS_CHANGED_EVENT = 'ap.vendor_bill.status_changed';

export interface VendorBillStatusChangedEvent {
  tenantId: string;
  organizationId: string;
  billId: string;
  billNumber: string;
  fromStatus: string;
  toStatus: string;
  /** ISO timestamp of the transition (approvedAt). */
  entryDate: string;
  currency: string;
  total: number;
}

function toResponseDto(bill: VendorBillWithDetails): VendorBillResponseDto {
  return {
    id: bill.id,
    organizationId: bill.organizationId,
    vendorId: bill.vendorId,
    vendorName: bill.vendor.name,
    billNumber: bill.billNumber,
    vendorReference: bill.vendorReference,
    billDate: bill.billDate.toISOString(),
    dueDate: bill.dueDate.toISOString(),
    currency: bill.currency,
    status: bill.status,
    notes: bill.notes,
    taxRate: bill.taxRate.toString(),
    subtotal: bill.subtotal.toString(),
    taxAmount: bill.taxAmount.toString(),
    total: bill.total.toString(),
    amountPaid: bill.amountPaid.toString(),
    balanceDue: computeRemainingBalance(Number(bill.total), Number(bill.amountPaid)).toString(),
    approvedAt: bill.approvedAt?.toISOString() ?? null,
    paidAt: bill.paidAt?.toISOString() ?? null,
    lineItems: bill.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      amount: item.amount.toString(),
      sortOrder: item.sortOrder,
    })),
    createdAt: bill.createdAt.toISOString(),
    updatedAt: bill.updatedAt.toISOString(),
  };
}

@Injectable()
export class VendorBillService {
  constructor(
    private readonly bills: VendorBillRepository,
    private readonly vendors: VendorService,
    private readonly audit: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(tenantId: string, dto: CreateVendorBillDto, actor: RequestUser): Promise<VendorBillResponseDto> {
    assertOrganizationScope(actor, dto.organizationId);
    // Confirms the vendor both exists and belongs to this same organization -
    // findVendorOrThrow's own assertOrganizationScope call rejects a
    // cross-organization vendorId even for a tenant-wide role that would
    // otherwise pass the check above.
    await this.vendors.findVendorOrThrow(tenantId, dto.vendorId, actor);

    const nextSequence = (await this.bills.countByOrganization(tenantId, dto.organizationId)) + 1;
    const billNumber = generateBillNumber(nextSequence);

    const lineItems = dto.lineItems.map((item, index) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
      sortOrder: index,
    }));
    const totals = computeBillTotals(dto.lineItems, dto.taxRate ?? 0);

    let bill: VendorBillWithDetails;
    try {
      bill = await this.bills.create(tenantId, {
        organizationId: dto.organizationId,
        vendorId: dto.vendorId,
        billNumber,
        vendorReference: dto.vendorReference,
        billDate: new Date(dto.billDate),
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
      action: 'vendor_bill.created',
      resourceType: 'VendorBill',
      resourceId: bill.id,
    });

    return toResponseDto(bill);
  }

  async findById(tenantId: string, id: string, actor: RequestUser): Promise<VendorBillResponseDto> {
    const bill = await this.findBillOrThrow(tenantId, id, actor);
    return toResponseDto(bill);
  }

  async list(
    tenantId: string,
    organizationId: string | undefined,
    actor: RequestUser,
  ): Promise<VendorBillResponseDto[]> {
    const scopedOrganizationId =
      actor.role === SystemRole.ORG_ADMIN ? (actor.organizationId ?? undefined) : organizationId;
    const bills = await this.bills.list(tenantId, scopedOrganizationId);
    return bills.map(toResponseDto);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateVendorBillDto,
    actor: RequestUser,
  ): Promise<VendorBillResponseDto> {
    const existing = await this.findBillOrThrow(tenantId, id, actor);
    if (existing.status !== PrismaVendorBillStatus.DRAFT) {
      throw new ConflictException('Only a Draft bill can be edited');
    }

    if (dto.vendorId) {
      await this.vendors.findVendorOrThrow(tenantId, dto.vendorId, actor);
    }

    const taxRate = dto.taxRate ?? Number(existing.taxRate);
    const lineItemInputs = dto.lineItems ?? existing.lineItems;
    const totals = computeBillTotals(
      lineItemInputs.map((item) => ({ quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })),
      taxRate,
    );

    const updated = await this.bills.update(tenantId, id, {
      vendorId: dto.vendorId,
      vendorReference: dto.vendorReference,
      billDate: dto.billDate ? new Date(dto.billDate) : undefined,
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
      action: 'vendor_bill.updated',
      resourceType: 'VendorBill',
      resourceId: id,
    });

    return toResponseDto(updated);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: PrismaVendorBillStatus,
    actor: RequestUser,
  ): Promise<VendorBillResponseDto> {
    if ((PAYMENT_DRIVEN_STATUSES as string[]).includes(status)) {
      throw new BadRequestException('Record a vendor payment instead of setting this status directly');
    }

    const existing = await this.findBillOrThrow(tenantId, id, actor);
    assertValidBillStatusTransition(existing.status, status);

    const transitionedAt = new Date();
    await this.bills.updateStatus(tenantId, id, status, {
      approvedAt: status === PrismaVendorBillStatus.APPROVED ? transitionedAt : undefined,
      paidAt: status === PrismaVendorBillStatus.PAID ? transitionedAt : undefined,
      updatedBy: actor.sub,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'vendor_bill.status_changed',
      resourceType: 'VendorBill',
      resourceId: id,
      metadata: { from: existing.status, to: status },
    });

    const statusChangedEvent: VendorBillStatusChangedEvent = {
      tenantId,
      organizationId: existing.organizationId,
      billId: id,
      billNumber: existing.billNumber,
      fromStatus: existing.status,
      toStatus: status,
      entryDate: transitionedAt.toISOString(),
      currency: existing.currency,
      total: Number(existing.total),
    };
    this.eventEmitter.emit(VENDOR_BILL_STATUS_CHANGED_EVENT, statusChangedEvent);

    return this.findById(tenantId, id, actor);
  }

  async softDelete(tenantId: string, id: string, actor: RequestUser): Promise<void> {
    const existing = await this.findBillOrThrow(tenantId, id, actor);
    if (existing.status !== PrismaVendorBillStatus.DRAFT) {
      throw new ConflictException('Only a Draft bill can be deleted - cancel it instead');
    }

    await this.bills.softDelete(tenantId, id, actor.sub);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'vendor_bill.deleted',
      resourceType: 'VendorBill',
      resourceId: id,
    });
  }

  async findBillOrThrow(tenantId: string, id: string, actor: RequestUser): Promise<VendorBillWithDetails> {
    const bill = await this.bills.findById(tenantId, id);
    if (!bill) {
      throw new NotFoundException(`Vendor bill "${id}" not found`);
    }
    assertOrganizationScope(actor, bill.organizationId);
    return bill;
  }
}
