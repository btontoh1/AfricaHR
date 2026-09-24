import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, Vendor } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { VendorRepository } from '@africahr/ap-data-access';
import { VendorService } from './vendor.service';

describe('VendorService', () => {
  let service: VendorService;
  let vendors: jest.Mocked<VendorRepository>;
  let audit: jest.Mocked<AuditService>;

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

  function makeVendor(overrides: Partial<Vendor> = {}): Vendor {
    return {
      id: 'vendor-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      name: 'Acme Supplies',
      email: null,
      phone: null,
      address: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as Vendor;
  }

  beforeEach(() => {
    vendors = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<VendorRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new VendorService(vendors, audit);
  });

  describe('create', () => {
    it('rejects an ORG_ADMIN creating a vendor for a different organization', async () => {
      await expect(
        service.create('tenant-1', { organizationId: 'org-2', name: 'Other Org Vendor' }, orgAdmin),
      ).rejects.toThrow(ForbiddenException);

      expect(vendors.create).not.toHaveBeenCalled();
    });

    it('allows an ORG_ADMIN to create a vendor for their own organization', async () => {
      vendors.create.mockResolvedValue(makeVendor());

      await service.create('tenant-1', { organizationId: 'org-1', name: 'Acme Supplies' }, orgAdmin);

      expect(vendors.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ organizationId: 'org-1', name: 'Acme Supplies', createdBy: 'user-2' }),
      );
    });

    it('translates a foreign-key violation on organizationId into NotFoundException', async () => {
      vendors.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('fk violation', { code: 'P2003', clientVersion: '6.0.0' }),
      );

      await expect(
        service.create('tenant-1', { organizationId: 'org-missing', name: 'Ghost Org Vendor' }, tenantAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('records an audit entry on success', async () => {
      const created = makeVendor();
      vendors.create.mockResolvedValue(created);

      await service.create('tenant-1', { organizationId: 'org-1', name: 'Acme Supplies' }, tenantAdmin);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          actorUserId: 'user-1',
          action: 'vendor.created',
          resourceType: 'Vendor',
          resourceId: created.id,
        }),
      );
    });
  });

  describe('findVendorOrThrow / findById', () => {
    it('throws NotFoundException when the vendor does not exist', async () => {
      vendors.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing', tenantAdmin)).rejects.toThrow(NotFoundException);
    });

    it('does not reveal a vendor belonging to a different organization to an ORG_ADMIN', async () => {
      vendors.findById.mockResolvedValue(makeVendor({ organizationId: 'org-2' }));

      await expect(service.findById('tenant-1', 'vendor-1', orgAdmin)).rejects.toThrow(ForbiddenException);
    });

    it("returns the vendor when it belongs to the ORG_ADMIN's own organization", async () => {
      const vendor = makeVendor({ organizationId: 'org-1' });
      vendors.findById.mockResolvedValue(vendor);

      await expect(service.findById('tenant-1', 'vendor-1', orgAdmin)).resolves.toEqual(vendor);
    });

    it('lets a tenant-wide role read a vendor from any organization', async () => {
      const vendor = makeVendor({ organizationId: 'org-2' });
      vendors.findById.mockResolvedValue(vendor);

      await expect(service.findById('tenant-1', 'vendor-1', tenantAdmin)).resolves.toEqual(vendor);
    });
  });

  describe('list', () => {
    it('hard-scopes an ORG_ADMIN to their own organization regardless of the requested filter', async () => {
      vendors.list.mockResolvedValue([]);

      await service.list('tenant-1', 'org-2', orgAdmin);

      expect(vendors.list).toHaveBeenCalledWith('tenant-1', 'org-1');
    });

    it('respects the requested organization filter for a tenant-wide role', async () => {
      vendors.list.mockResolvedValue([]);

      await service.list('tenant-1', 'org-2', tenantAdmin);

      expect(vendors.list).toHaveBeenCalledWith('tenant-1', 'org-2');
    });
  });

  describe('update', () => {
    it("rejects updating a vendor outside the ORG_ADMIN's own organization", async () => {
      vendors.findById.mockResolvedValue(makeVendor({ organizationId: 'org-2' }));

      await expect(service.update('tenant-1', 'vendor-1', { name: 'Renamed' }, orgAdmin)).rejects.toThrow(
        ForbiddenException,
      );
      expect(vendors.update).not.toHaveBeenCalled();
    });

    it('updates and audits on success', async () => {
      vendors.findById.mockResolvedValue(makeVendor());
      const updated = makeVendor({ name: 'Acme Supplies Ltd' });
      vendors.update.mockResolvedValue(updated);

      const result = await service.update('tenant-1', 'vendor-1', { name: 'Acme Supplies Ltd' }, tenantAdmin);

      expect(result).toEqual(updated);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'vendor.updated', resourceId: 'vendor-1' }),
      );
    });
  });

  describe('softDelete', () => {
    it("rejects deleting a vendor outside the ORG_ADMIN's own organization", async () => {
      vendors.findById.mockResolvedValue(makeVendor({ organizationId: 'org-2' }));

      await expect(service.softDelete('tenant-1', 'vendor-1', orgAdmin)).rejects.toThrow(ForbiddenException);
      expect(vendors.softDelete).not.toHaveBeenCalled();
    });

    it('soft-deletes and audits on success', async () => {
      vendors.findById.mockResolvedValue(makeVendor());
      const deleted = makeVendor({ deletedAt: new Date() });
      vendors.softDelete.mockResolvedValue(deleted);

      await service.softDelete('tenant-1', 'vendor-1', tenantAdmin);

      expect(vendors.softDelete).toHaveBeenCalledWith('tenant-1', 'vendor-1', 'user-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'vendor.deleted', resourceId: 'vendor-1' }),
      );
    });
  });
});
