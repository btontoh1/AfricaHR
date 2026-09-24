import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { VendorBillRepository, VendorBillWithDetails } from '@africahr/ap-data-access';
import { VendorBillService } from './vendor-bill.service';
import { VendorService } from './vendor.service';

describe('VendorBillService', () => {
  let service: VendorBillService;
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
      vendorReference: null,
      billDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
      currency: 'GHS',
      status: 'DRAFT',
      notes: null,
      taxRate: new Prisma.Decimal(15),
      subtotal: new Prisma.Decimal(1000),
      taxAmount: new Prisma.Decimal(150),
      total: new Prisma.Decimal(1150),
      approvedAt: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      vendor: { id: 'vendor-1', name: 'Acme Supplies' },
      organization: { id: 'org-1', name: 'Acme Ghana' },
      lineItems: [
        {
          id: 'li-1',
          billId: 'bill-1',
          tenantId: 'tenant-1',
          description: 'Office supplies',
          quantity: new Prisma.Decimal(1),
          unitPrice: new Prisma.Decimal(1000),
          amount: new Prisma.Decimal(1000),
          sortOrder: 0,
          createdAt: new Date(),
          createdBy: null,
        },
      ],
      ...overrides,
    } as unknown as VendorBillWithDetails;
  }

  beforeEach(() => {
    bills = {
      countByOrganization: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<VendorBillRepository>;

    vendors = {
      findVendorOrThrow: jest.fn(),
    } as unknown as jest.Mocked<VendorService>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

    service = new VendorBillService(bills, vendors, audit, eventEmitter);
  });

  describe('create', () => {
    const createDto = {
      organizationId: 'org-1',
      vendorId: 'vendor-1',
      billDate: '2026-01-01',
      dueDate: '2026-01-31',
      currency: 'GHS',
      taxRate: 15,
      lineItems: [{ description: 'Office supplies', quantity: 1, unitPrice: 1000 }],
    };

    it('rejects an ORG_ADMIN creating a bill for a different organization', async () => {
      await expect(service.create('tenant-1', { ...createDto, organizationId: 'org-2' }, orgAdmin)).rejects.toThrow(
        ForbiddenException,
      );
      expect(bills.create).not.toHaveBeenCalled();
    });

    it("rejects a vendorId that does not belong to the bill's organization", async () => {
      vendors.findVendorOrThrow.mockRejectedValue(new ForbiddenException('Cannot act on a different organization'));

      await expect(service.create('tenant-1', createDto, tenantAdmin)).rejects.toThrow(ForbiddenException);
      expect(bills.create).not.toHaveBeenCalled();
    });

    it("derives the bill number from the organization's existing bill count + 1", async () => {
      bills.countByOrganization.mockResolvedValue(41);
      bills.create.mockResolvedValue(makeBill());

      await service.create('tenant-1', createDto, tenantAdmin);

      expect(bills.create).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ billNumber: 'BILL-0042' }));
    });

    it('computes totals from the line items and tax rate before persisting', async () => {
      bills.countByOrganization.mockResolvedValue(0);
      bills.create.mockResolvedValue(makeBill());

      await service.create(
        'tenant-1',
        { ...createDto, taxRate: 15, lineItems: [{ description: 'Office supplies', quantity: 2, unitPrice: 500 }] },
        tenantAdmin,
      );

      expect(bills.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ subtotal: 1000, taxAmount: 150, total: 1150 }),
      );
    });

    it('defaults the tax rate to 0 when not provided', async () => {
      bills.countByOrganization.mockResolvedValue(0);
      bills.create.mockResolvedValue(makeBill());

      await service.create('tenant-1', { ...createDto, taxRate: undefined }, tenantAdmin);

      expect(bills.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ taxRate: 0, taxAmount: 0, total: 1000 }),
      );
    });

    it('translates a foreign-key violation on organizationId into NotFoundException', async () => {
      bills.countByOrganization.mockResolvedValue(0);
      bills.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('fk violation', { code: 'P2003', clientVersion: '6.0.0' }),
      );

      await expect(service.create('tenant-1', createDto, tenantAdmin)).rejects.toThrow(NotFoundException);
    });

    it('records an audit entry on success', async () => {
      bills.countByOrganization.mockResolvedValue(0);
      const created = makeBill();
      bills.create.mockResolvedValue(created);

      await service.create('tenant-1', createDto, tenantAdmin);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          actorUserId: 'user-1',
          action: 'vendor_bill.created',
          resourceType: 'VendorBill',
          resourceId: created.id,
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the bill does not exist', async () => {
      bills.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing', tenantAdmin)).rejects.toThrow(NotFoundException);
    });

    it('does not reveal a bill belonging to a different organization to an ORG_ADMIN', async () => {
      bills.findById.mockResolvedValue(makeBill({ organizationId: 'org-2' }));

      await expect(service.findById('tenant-1', 'bill-1', orgAdmin)).rejects.toThrow(ForbiddenException);
    });

    it('serializes Decimal fields to strings in the response', async () => {
      bills.findById.mockResolvedValue(makeBill());

      const result = await service.findById('tenant-1', 'bill-1', tenantAdmin);

      expect(result.subtotal).toBe('1000');
      expect(result.taxAmount).toBe('150');
      expect(result.total).toBe('1150');
      expect(result.vendorName).toBe('Acme Supplies');
    });
  });

  describe('list', () => {
    it('hard-scopes an ORG_ADMIN to their own organization regardless of the requested filter', async () => {
      bills.list.mockResolvedValue([]);

      await service.list('tenant-1', 'org-2', orgAdmin);

      expect(bills.list).toHaveBeenCalledWith('tenant-1', 'org-1');
    });

    it('respects the requested organization filter for a tenant-wide role', async () => {
      bills.list.mockResolvedValue([]);

      await service.list('tenant-1', 'org-2', tenantAdmin);

      expect(bills.list).toHaveBeenCalledWith('tenant-1', 'org-2');
    });
  });

  describe('update', () => {
    it('rejects editing a bill that is not Draft', async () => {
      bills.findById.mockResolvedValue(makeBill({ status: 'APPROVED' }));

      await expect(service.update('tenant-1', 'bill-1', { notes: 'New terms' }, tenantAdmin)).rejects.toThrow(
        ConflictException,
      );
      expect(bills.update).not.toHaveBeenCalled();
    });

    it('recomputes totals when the tax rate changes but line items do not', async () => {
      bills.findById.mockResolvedValue(makeBill({ taxRate: new Prisma.Decimal(15) }));
      bills.update.mockResolvedValue(makeBill());

      await service.update('tenant-1', 'bill-1', { taxRate: 0 }, tenantAdmin);

      expect(bills.update).toHaveBeenCalledWith(
        'tenant-1',
        'bill-1',
        expect.objectContaining({ subtotal: 1000, taxAmount: 0, total: 1000 }),
      );
    });

    it('recomputes totals from new line items when provided, keeping the existing tax rate', async () => {
      bills.findById.mockResolvedValue(makeBill({ taxRate: new Prisma.Decimal(10) }));
      bills.update.mockResolvedValue(makeBill());

      await service.update(
        'tenant-1',
        'bill-1',
        { lineItems: [{ description: 'Revised scope', quantity: 2, unitPrice: 300 }] },
        tenantAdmin,
      );

      expect(bills.update).toHaveBeenCalledWith(
        'tenant-1',
        'bill-1',
        expect.objectContaining({ subtotal: 600, taxAmount: 60, total: 660 }),
      );
    });

    it('validates a replacement vendorId belongs to the same organization', async () => {
      bills.findById.mockResolvedValue(makeBill());
      vendors.findVendorOrThrow.mockRejectedValue(new ForbiddenException());

      await expect(service.update('tenant-1', 'bill-1', { vendorId: 'vendor-other-org' }, tenantAdmin)).rejects.toThrow(
        ForbiddenException,
      );
      expect(bills.update).not.toHaveBeenCalled();
    });

    it('records an audit entry on success', async () => {
      bills.findById.mockResolvedValue(makeBill());
      bills.update.mockResolvedValue(makeBill({ notes: 'Updated' }));

      await service.update('tenant-1', 'bill-1', { notes: 'Updated' }, tenantAdmin);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'vendor_bill.updated', resourceId: 'bill-1' }),
      );
    });
  });

  describe('updateStatus', () => {
    it('rejects an invalid transition (e.g. Draft straight to Paid)', async () => {
      bills.findById.mockResolvedValue(makeBill({ status: 'DRAFT' }));

      await expect(service.updateStatus('tenant-1', 'bill-1', 'PAID', tenantAdmin)).rejects.toThrow(Error);
      expect(bills.updateStatus).not.toHaveBeenCalled();
    });

    it('sets approvedAt when transitioning Draft -> Approved, and emits the GL-posting event', async () => {
      bills.findById.mockResolvedValue(makeBill({ status: 'DRAFT' }));

      await service.updateStatus('tenant-1', 'bill-1', 'APPROVED', tenantAdmin);

      expect(bills.updateStatus).toHaveBeenCalledWith(
        'tenant-1',
        'bill-1',
        'APPROVED',
        expect.objectContaining({ approvedAt: expect.any(Date), paidAt: undefined }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'ap.vendor_bill.status_changed',
        expect.objectContaining({
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          billId: 'bill-1',
          fromStatus: 'DRAFT',
          toStatus: 'APPROVED',
          total: 1150,
        }),
      );
    });

    it('sets paidAt when transitioning Approved -> Paid, and emits the GL-posting event', async () => {
      bills.findById.mockResolvedValue(makeBill({ status: 'APPROVED' }));

      await service.updateStatus('tenant-1', 'bill-1', 'PAID', tenantAdmin);

      expect(bills.updateStatus).toHaveBeenCalledWith(
        'tenant-1',
        'bill-1',
        'PAID',
        expect.objectContaining({ paidAt: expect.any(Date), approvedAt: undefined }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'ap.vendor_bill.status_changed',
        expect.objectContaining({ fromStatus: 'APPROVED', toStatus: 'PAID', total: 1150 }),
      );
    });

    it('rejects any transition out of a terminal Paid bill', async () => {
      bills.findById.mockResolvedValue(makeBill({ status: 'PAID' }));

      await expect(service.updateStatus('tenant-1', 'bill-1', 'CANCELLED', tenantAdmin)).rejects.toThrow(Error);
      expect(bills.updateStatus).not.toHaveBeenCalled();
    });

    it('records an audit entry capturing the from/to status', async () => {
      bills.findById.mockResolvedValue(makeBill({ status: 'DRAFT' }));

      await service.updateStatus('tenant-1', 'bill-1', 'APPROVED', tenantAdmin);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'vendor_bill.status_changed',
          resourceId: 'bill-1',
          metadata: { from: 'DRAFT', to: 'APPROVED' },
        }),
      );
    });
  });

  describe('softDelete', () => {
    it('rejects deleting a bill that is not Draft', async () => {
      bills.findById.mockResolvedValue(makeBill({ status: 'APPROVED' }));

      await expect(service.softDelete('tenant-1', 'bill-1', tenantAdmin)).rejects.toThrow(ConflictException);
      expect(bills.softDelete).not.toHaveBeenCalled();
    });

    it('soft-deletes a Draft bill and audits on success', async () => {
      bills.findById.mockResolvedValue(makeBill({ status: 'DRAFT' }));

      await service.softDelete('tenant-1', 'bill-1', tenantAdmin);

      expect(bills.softDelete).toHaveBeenCalledWith('tenant-1', 'bill-1', 'user-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'vendor_bill.deleted', resourceId: 'bill-1' }),
      );
    });
  });
});
