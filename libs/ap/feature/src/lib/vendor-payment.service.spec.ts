import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { VendorBillRepository, VendorBillWithDetails, VendorPaymentRepository, VendorPaymentWithDetails } from '@africahr/ap-data-access';
import { VendorPaymentService } from './vendor-payment.service';
import { VendorService } from './vendor.service';

describe('VendorPaymentService', () => {
  let service: VendorPaymentService;
  let payments: jest.Mocked<VendorPaymentRepository>;
  let bills: jest.Mocked<VendorBillRepository>;
  let vendors: jest.Mocked<VendorService>;
  let audit: jest.Mocked<AuditService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const tenantAdmin: RequestUser = {
    sub: 'user-1',
    email: 'hr@acme.com',
    role: SystemRole.TENANT_ADMIN,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  const orgAdmin: RequestUser = {
    sub: 'user-2',
    email: 'owner@subsidiary.com',
    role: SystemRole.ORG_ADMIN,
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    iat: 1,
    exp: 2,
  };

  function makeBill(overrides: Partial<VendorBillWithDetails> = {}): VendorBillWithDetails {
    return {
      id: 'bill-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      vendorId: 'vendor-1',
      billNumber: 'BILL-0001',
      currency: 'GHS',
      status: 'APPROVED',
      total: new Prisma.Decimal(1000),
      amountPaid: new Prisma.Decimal(0),
      vendor: { id: 'vendor-1', name: 'Acme Supplies' },
      ...overrides,
    } as unknown as VendorBillWithDetails;
  }

  function makePayment(overrides: Partial<VendorPaymentWithDetails> = {}): VendorPaymentWithDetails {
    return {
      id: 'payment-1',
      organizationId: 'org-1',
      vendorId: 'vendor-1',
      paymentDate: new Date('2026-04-01'),
      currency: 'GHS',
      amount: new Prisma.Decimal(1000),
      method: 'BANK_TRANSFER',
      reference: null,
      notes: null,
      createdAt: new Date('2026-04-01'),
      vendor: { id: 'vendor-1', name: 'Acme Supplies' },
      allocations: [
        {
          id: 'alloc-1',
          billId: 'bill-1',
          amount: new Prisma.Decimal(1000),
          bill: { billNumber: 'BILL-0001' },
        },
      ],
      ...overrides,
    } as unknown as VendorPaymentWithDetails;
  }

  beforeEach(() => {
    payments = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
    } as unknown as jest.Mocked<VendorPaymentRepository>;

    bills = {
      findManyByIds: jest.fn(),
    } as unknown as jest.Mocked<VendorBillRepository>;

    vendors = {
      findVendorOrThrow: jest.fn().mockResolvedValue({ id: 'vendor-1', organizationId: 'org-1', name: 'Acme Supplies' }),
    } as unknown as jest.Mocked<VendorService>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

    service = new VendorPaymentService(payments, bills, vendors, audit, eventEmitter);
  });

  describe('create', () => {
    const dto = {
      organizationId: 'org-1',
      vendorId: 'vendor-1',
      paymentDate: '2026-04-01',
      currency: 'GHS',
      method: 'BANK_TRANSFER' as const,
      reference: 'TXN-1',
      allocations: [{ billId: 'bill-1', amount: 1000 }],
    };

    it('rejects an ORG_ADMIN paying on behalf of a different organization', async () => {
      await expect(service.create('tenant-1', { ...dto, organizationId: 'org-2' }, orgAdmin)).rejects.toThrow(
        ForbiddenException,
      );
      expect(bills.findManyByIds).not.toHaveBeenCalled();
    });

    it('rejects when the vendor does not belong to the given organization', async () => {
      vendors.findVendorOrThrow.mockResolvedValue({ id: 'vendor-1', organizationId: 'org-2', name: 'Acme' } as never);

      await expect(service.create('tenant-1', dto, tenantAdmin)).rejects.toThrow(BadRequestException);
    });

    it('rejects the same bill being allocated twice in one payment', async () => {
      await expect(
        service.create(
          'tenant-1',
          { ...dto, allocations: [{ billId: 'bill-1', amount: 500 }, { billId: 'bill-1', amount: 500 }] },
          tenantAdmin,
        ),
      ).rejects.toThrow('Each bill can only be allocated once per payment');
      expect(bills.findManyByIds).not.toHaveBeenCalled();
    });

    it('rejects when an allocated bill does not exist', async () => {
      bills.findManyByIds.mockResolvedValue([]);

      await expect(service.create('tenant-1', dto, tenantAdmin)).rejects.toThrow(NotFoundException);
    });

    it('rejects when the bill belongs to a different vendor', async () => {
      bills.findManyByIds.mockResolvedValue([makeBill({ vendorId: 'vendor-2' })]);

      await expect(service.create('tenant-1', dto, tenantAdmin)).rejects.toThrow(
        'Bill "BILL-0001" does not belong to this vendor',
      );
    });

    it('rejects when the bill currency does not match the payment currency', async () => {
      bills.findManyByIds.mockResolvedValue([makeBill({ currency: 'USD' })]);

      await expect(service.create('tenant-1', dto, tenantAdmin)).rejects.toThrow(
        'Bill "BILL-0001" is in USD, not GHS',
      );
    });

    it('rejects a bill that cannot currently receive a payment (e.g. still Draft)', async () => {
      bills.findManyByIds.mockResolvedValue([makeBill({ status: 'DRAFT' })]);

      await expect(service.create('tenant-1', dto, tenantAdmin)).rejects.toThrow(ConflictException);
    });

    it('rejects an allocation that exceeds the bill remaining balance', async () => {
      bills.findManyByIds.mockResolvedValue([makeBill({ total: new Prisma.Decimal(500), amountPaid: new Prisma.Decimal(0) })]);

      await expect(service.create('tenant-1', dto, tenantAdmin)).rejects.toThrow(
        'Allocation of 1000 for bill "BILL-0001" exceeds its remaining balance of 500',
      );
    });

    it('pays a single bill in full, setting it PAID with paidAt, and emits the posting event', async () => {
      bills.findManyByIds.mockResolvedValue([makeBill({ total: new Prisma.Decimal(1000), amountPaid: new Prisma.Decimal(0) })]);
      payments.create.mockResolvedValue(makePayment());

      const result = await service.create('tenant-1', dto, tenantAdmin);

      expect(payments.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          organizationId: 'org-1',
          vendorId: 'vendor-1',
          currency: 'GHS',
          amount: 1000,
          method: 'BANK_TRANSFER',
          allocations: [{ billId: 'bill-1', amount: 1000 }],
          billUpdates: [{ billId: 'bill-1', amountPaid: 1000, status: 'PAID', paidAt: new Date('2026-04-01') }],
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'ap.vendor_payment.recorded',
        expect.objectContaining({ tenantId: 'tenant-1', organizationId: 'org-1', paymentId: 'payment-1', amount: 1000 }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'vendor_payment.recorded', resourceId: 'payment-1' }),
      );
      expect(result.vendorName).toBe('Acme Supplies');
      expect(result.allocations[0]).toEqual({ id: 'alloc-1', billId: 'bill-1', billNumber: 'BILL-0001', amount: '1000' });
    });

    it('leaves a bill PARTIALLY_PAID, without paidAt, when the allocation does not cover the full balance', async () => {
      bills.findManyByIds.mockResolvedValue([makeBill({ total: new Prisma.Decimal(1000), amountPaid: new Prisma.Decimal(0) })]);
      payments.create.mockResolvedValue(makePayment());

      await service.create('tenant-1', { ...dto, allocations: [{ billId: 'bill-1', amount: 400 }] }, tenantAdmin);

      expect(payments.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          billUpdates: [{ billId: 'bill-1', amountPaid: 400, status: 'PARTIALLY_PAID', paidAt: undefined }],
        }),
      );
    });

    it('sums allocations across multiple bills into one combined payment total', async () => {
      bills.findManyByIds.mockResolvedValue([
        makeBill({ id: 'bill-1', total: new Prisma.Decimal(1000), amountPaid: new Prisma.Decimal(600) }),
        makeBill({ id: 'bill-2', billNumber: 'BILL-0002', total: new Prisma.Decimal(500), amountPaid: new Prisma.Decimal(0) }),
      ]);
      payments.create.mockResolvedValue(makePayment());

      await service.create(
        'tenant-1',
        { ...dto, allocations: [{ billId: 'bill-1', amount: 400 }, { billId: 'bill-2', amount: 500 }] },
        tenantAdmin,
      );

      expect(payments.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          amount: 900,
          billUpdates: expect.arrayContaining([
            { billId: 'bill-1', amountPaid: 1000, status: 'PAID', paidAt: new Date('2026-04-01') },
            { billId: 'bill-2', amountPaid: 500, status: 'PAID', paidAt: new Date('2026-04-01') },
          ]),
        }),
      );
    });

    it('translates a foreign-key violation into a NotFoundException', async () => {
      bills.findManyByIds.mockResolvedValue([makeBill()]);
      payments.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('fk violation', { code: 'P2003', clientVersion: '6.0.0' }),
      );

      await expect(service.create('tenant-1', dto, tenantAdmin)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the payment does not exist', async () => {
      payments.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing', tenantAdmin)).rejects.toThrow(NotFoundException);
    });

    it('does not reveal a payment belonging to a different organization to an ORG_ADMIN', async () => {
      payments.findById.mockResolvedValue(makePayment({ organizationId: 'org-2' }));

      await expect(service.findById('tenant-1', 'payment-1', orgAdmin)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('list', () => {
    it('hard-scopes an ORG_ADMIN to their own organization regardless of the requested filter', async () => {
      payments.list.mockResolvedValue([]);

      await service.list('tenant-1', 'org-2', undefined, orgAdmin);

      expect(payments.list).toHaveBeenCalledWith('tenant-1', 'org-1', undefined);
    });

    it('respects the requested organization/vendor filters for a tenant-wide role', async () => {
      payments.list.mockResolvedValue([]);

      await service.list('tenant-1', 'org-2', 'vendor-1', tenantAdmin);

      expect(payments.list).toHaveBeenCalledWith('tenant-1', 'org-2', 'vendor-1');
    });
  });
});
