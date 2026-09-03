import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Customer, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { CustomerRepository } from '@africahr/invoicing-data-access';
import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let customers: jest.Mocked<CustomerRepository>;
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

  function makeCustomer(overrides: Partial<Customer> = {}): Customer {
    return {
      id: 'cust-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      name: 'Acme Retail',
      email: null,
      phone: null,
      billingAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as Customer;
  }

  beforeEach(() => {
    customers = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<CustomerRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new CustomerService(customers, audit);
  });

  describe('create', () => {
    it('rejects an ORG_ADMIN creating a customer for a different organization', async () => {
      await expect(
        service.create('tenant-1', { organizationId: 'org-2', name: 'Other Org Customer' }, orgAdmin),
      ).rejects.toThrow(ForbiddenException);

      expect(customers.create).not.toHaveBeenCalled();
    });

    it('allows an ORG_ADMIN to create a customer for their own organization', async () => {
      customers.create.mockResolvedValue(makeCustomer());

      await service.create('tenant-1', { organizationId: 'org-1', name: 'Acme Retail' }, orgAdmin);

      expect(customers.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ organizationId: 'org-1', name: 'Acme Retail', createdBy: 'user-2' }),
      );
    });

    it('translates a foreign-key violation on organizationId into NotFoundException', async () => {
      customers.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('fk violation', { code: 'P2003', clientVersion: '6.0.0' }),
      );

      await expect(
        service.create('tenant-1', { organizationId: 'org-missing', name: 'Ghost Org Customer' }, tenantAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('records an audit entry on success', async () => {
      const created = makeCustomer();
      customers.create.mockResolvedValue(created);

      await service.create('tenant-1', { organizationId: 'org-1', name: 'Acme Retail' }, tenantAdmin);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          actorUserId: 'user-1',
          action: 'customer.created',
          resourceType: 'Customer',
          resourceId: created.id,
        }),
      );
    });
  });

  describe('findCustomerOrThrow / findById', () => {
    it('throws NotFoundException when the customer does not exist', async () => {
      customers.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing', tenantAdmin)).rejects.toThrow(NotFoundException);
    });

    it("does not reveal a customer belonging to a different organization to an ORG_ADMIN", async () => {
      customers.findById.mockResolvedValue(makeCustomer({ organizationId: 'org-2' }));

      await expect(service.findById('tenant-1', 'cust-1', orgAdmin)).rejects.toThrow(ForbiddenException);
    });

    it('returns the customer when it belongs to the ORG_ADMIN\'s own organization', async () => {
      const customer = makeCustomer({ organizationId: 'org-1' });
      customers.findById.mockResolvedValue(customer);

      await expect(service.findById('tenant-1', 'cust-1', orgAdmin)).resolves.toEqual(customer);
    });

    it('lets a tenant-wide role read a customer from any organization', async () => {
      const customer = makeCustomer({ organizationId: 'org-2' });
      customers.findById.mockResolvedValue(customer);

      await expect(service.findById('tenant-1', 'cust-1', tenantAdmin)).resolves.toEqual(customer);
    });
  });

  describe('list', () => {
    it('hard-scopes an ORG_ADMIN to their own organization regardless of the requested filter', async () => {
      customers.list.mockResolvedValue([]);

      await service.list('tenant-1', 'org-2', orgAdmin);

      expect(customers.list).toHaveBeenCalledWith('tenant-1', 'org-1');
    });

    it('respects the requested organization filter for a tenant-wide role', async () => {
      customers.list.mockResolvedValue([]);

      await service.list('tenant-1', 'org-2', tenantAdmin);

      expect(customers.list).toHaveBeenCalledWith('tenant-1', 'org-2');
    });
  });

  describe('update', () => {
    it("rejects updating a customer outside the ORG_ADMIN's own organization", async () => {
      customers.findById.mockResolvedValue(makeCustomer({ organizationId: 'org-2' }));

      await expect(
        service.update('tenant-1', 'cust-1', { name: 'Renamed' }, orgAdmin),
      ).rejects.toThrow(ForbiddenException);
      expect(customers.update).not.toHaveBeenCalled();
    });

    it('updates and audits on success', async () => {
      customers.findById.mockResolvedValue(makeCustomer());
      const updated = makeCustomer({ name: 'Acme Retail Ltd' });
      customers.update.mockResolvedValue(updated);

      const result = await service.update('tenant-1', 'cust-1', { name: 'Acme Retail Ltd' }, tenantAdmin);

      expect(result).toEqual(updated);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'customer.updated', resourceId: 'cust-1' }),
      );
    });
  });

  describe('softDelete', () => {
    it('rejects deleting a customer outside the ORG_ADMIN\'s own organization', async () => {
      customers.findById.mockResolvedValue(makeCustomer({ organizationId: 'org-2' }));

      await expect(service.softDelete('tenant-1', 'cust-1', orgAdmin)).rejects.toThrow(ForbiddenException);
      expect(customers.softDelete).not.toHaveBeenCalled();
    });

    it('soft-deletes and audits on success', async () => {
      customers.findById.mockResolvedValue(makeCustomer());
      const deleted = makeCustomer({ deletedAt: new Date() });
      customers.softDelete.mockResolvedValue(deleted);

      await service.softDelete('tenant-1', 'cust-1', tenantAdmin);

      expect(customers.softDelete).toHaveBeenCalledWith('tenant-1', 'cust-1', 'user-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'customer.deleted', resourceId: 'cust-1' }),
      );
    });
  });
});
