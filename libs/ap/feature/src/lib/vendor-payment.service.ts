import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, VendorBillStatus as PrismaVendorBillStatus } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { assertOrganizationScope, RequestUser, SystemRole } from '@africahr/platform-auth';
import { BillUpdateForPayment, VendorBillRepository, VendorPaymentRepository, VendorPaymentWithDetails } from '@africahr/ap-data-access';
import { canReceivePayment, computeBillStatusAfterPayment, computeRemainingBalance } from '@africahr/ap-domain';
import { VendorService } from './vendor.service';
import { CreateVendorPaymentDto } from './dto/create-vendor-payment.dto';
import { VendorPaymentResponseDto } from './dto/vendor-payment-response.dto';

function translateReferenceError(error: unknown, organizationId: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    throw new NotFoundException(`Organization "${organizationId}" not found`);
  }
  throw error;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Emitted once per recorded payment - consumed by finance-feature's
 * ApGlPostingListener to post one Dr Accounts Payable / Cr Cash and Bank
 * entry for the combined amount. Lives as a plain event for the same
 * scope:ap/scope:finance decoupling reason as VENDOR_BILL_STATUS_CHANGED_EVENT.
 */
export const VENDOR_PAYMENT_RECORDED_EVENT = 'ap.vendor_payment.recorded';

export interface VendorPaymentRecordedEvent {
  tenantId: string;
  organizationId: string;
  paymentId: string;
  entryDate: string;
  currency: string;
  amount: number;
}

function toResponseDto(payment: VendorPaymentWithDetails): VendorPaymentResponseDto {
  return {
    id: payment.id,
    organizationId: payment.organizationId,
    vendorId: payment.vendorId,
    vendorName: payment.vendor.name,
    paymentDate: payment.paymentDate.toISOString(),
    currency: payment.currency,
    amount: payment.amount.toString(),
    method: payment.method,
    reference: payment.reference,
    notes: payment.notes,
    allocations: payment.allocations.map((allocation) => ({
      id: allocation.id,
      billId: allocation.billId,
      billNumber: allocation.bill.billNumber,
      amount: allocation.amount.toString(),
    })),
    createdAt: payment.createdAt.toISOString(),
  };
}

@Injectable()
export class VendorPaymentService {
  constructor(
    private readonly payments: VendorPaymentRepository,
    private readonly bills: VendorBillRepository,
    private readonly vendors: VendorService,
    private readonly audit: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Records one real payment, allocated across one or more of the vendor's
   * bills - each allocation is validated against that bill's own remaining
   * balance (never the payment's total), so a payment can legally under- or
   * exactly-cover the sum of what it's allocated to, but never over-cover
   * any single bill. Posts a single combined GL entry (see
   * VendorPaymentRecordedEvent) rather than one per allocation, same "one
   * posting per real-world event" convention as everywhere else in this
   * ledger.
   */
  async create(tenantId: string, dto: CreateVendorPaymentDto, actor: RequestUser): Promise<VendorPaymentResponseDto> {
    assertOrganizationScope(actor, dto.organizationId);
    const vendor = await this.vendors.findVendorOrThrow(tenantId, dto.vendorId, actor);
    if (vendor.organizationId !== dto.organizationId) {
      throw new BadRequestException('Vendor does not belong to this organization');
    }

    const billIds = dto.allocations.map((allocation) => allocation.billId);
    if (new Set(billIds).size !== billIds.length) {
      throw new BadRequestException('Each bill can only be allocated once per payment');
    }

    const bills = await this.bills.findManyByIds(tenantId, billIds);
    const billById = new Map(bills.map((bill) => [bill.id, bill]));

    let totalAmount = 0;
    const billUpdates: BillUpdateForPayment[] = [];
    const paymentDate = new Date(dto.paymentDate);

    for (const allocation of dto.allocations) {
      const bill = billById.get(allocation.billId);
      if (!bill) {
        throw new NotFoundException(`Vendor bill "${allocation.billId}" not found`);
      }
      assertOrganizationScope(actor, bill.organizationId);
      if (bill.organizationId !== dto.organizationId) {
        throw new BadRequestException(`Bill "${bill.billNumber}" does not belong to this organization`);
      }
      if (bill.vendorId !== dto.vendorId) {
        throw new BadRequestException(`Bill "${bill.billNumber}" does not belong to this vendor`);
      }
      if (bill.currency !== dto.currency) {
        throw new BadRequestException(`Bill "${bill.billNumber}" is in ${bill.currency}, not ${dto.currency}`);
      }
      if (!canReceivePayment(bill.status)) {
        throw new ConflictException(`Bill "${bill.billNumber}" is ${bill.status} and cannot receive a payment`);
      }

      const remaining = computeRemainingBalance(Number(bill.total), Number(bill.amountPaid));
      if (allocation.amount > remaining) {
        throw new BadRequestException(
          `Allocation of ${allocation.amount} for bill "${bill.billNumber}" exceeds its remaining balance of ${remaining}`,
        );
      }

      const newAmountPaid = round2(Number(bill.amountPaid) + allocation.amount);
      const newStatus = computeBillStatusAfterPayment(Number(bill.total), newAmountPaid) as PrismaVendorBillStatus;
      totalAmount = round2(totalAmount + allocation.amount);
      billUpdates.push({
        billId: bill.id,
        amountPaid: newAmountPaid,
        status: newStatus,
        paidAt: newStatus === PrismaVendorBillStatus.PAID ? paymentDate : undefined,
      });
    }

    let payment: VendorPaymentWithDetails;
    try {
      payment = await this.payments.create(tenantId, {
        organizationId: dto.organizationId,
        vendorId: dto.vendorId,
        paymentDate,
        currency: dto.currency,
        amount: totalAmount,
        method: dto.method,
        reference: dto.reference,
        notes: dto.notes,
        allocations: dto.allocations.map((allocation) => ({ billId: allocation.billId, amount: allocation.amount })),
        billUpdates,
        createdBy: actor.sub,
      });
    } catch (error) {
      translateReferenceError(error, dto.organizationId);
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'vendor_payment.recorded',
      resourceType: 'VendorPayment',
      resourceId: payment.id,
      metadata: { vendorId: dto.vendorId, currency: dto.currency, amount: totalAmount, billIds },
    });

    const event: VendorPaymentRecordedEvent = {
      tenantId,
      organizationId: dto.organizationId,
      paymentId: payment.id,
      entryDate: paymentDate.toISOString(),
      currency: dto.currency,
      amount: totalAmount,
    };
    this.eventEmitter.emit(VENDOR_PAYMENT_RECORDED_EVENT, event);

    return toResponseDto(payment);
  }

  async findById(tenantId: string, id: string, actor: RequestUser): Promise<VendorPaymentResponseDto> {
    const payment = await this.payments.findById(tenantId, id);
    if (!payment) {
      throw new NotFoundException(`Vendor payment "${id}" not found`);
    }
    assertOrganizationScope(actor, payment.organizationId);
    return toResponseDto(payment);
  }

  async list(
    tenantId: string,
    organizationId: string | undefined,
    vendorId: string | undefined,
    actor: RequestUser,
  ): Promise<VendorPaymentResponseDto[]> {
    const scopedOrganizationId =
      actor.role === SystemRole.ORG_ADMIN ? (actor.organizationId ?? undefined) : organizationId;
    const payments = await this.payments.list(tenantId, scopedOrganizationId, vendorId);
    return payments.map(toResponseDto);
  }
}
