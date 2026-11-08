import { PrismaService } from '@africahr/platform-database';
import { CustomerRepository } from './customer.repository';

describe('CustomerRepository', () => {
  let repository: CustomerRepository;
  let tx: { customer: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      customer: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new CustomerRepository(prisma as unknown as PrismaService);
  });

  it('creates a customer scoped to the tenant and organization', async () => {
    await repository.create('tenant-1', {
      organizationId: 'org-1',
      name: 'Acme Retail',
      email: 'billing@acme.test',
      phone: '+233200000000',
      billingAddress: '10 Independence Ave, Accra',
      createdBy: 'user-1',
    });

    expect(tx.customer.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        name: 'Acme Retail',
        email: 'billing@acme.test',
        phone: '+233200000000',
        billingAddress: '10 Independence Ave, Accra',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      },
    });
  });

  it('finds a customer by id, scoped to the tenant and excluding soft-deleted rows', async () => {
    await repository.findById('tenant-1', 'cust-1');

    expect(tx.customer.findFirst).toHaveBeenCalledWith({
      where: { id: 'cust-1', tenantId: 'tenant-1', deletedAt: null },
    });
  });

  it('lists customers scoped to the tenant and an optional organization, ordered by name', async () => {
    await repository.list('tenant-1', 'org-1');

    expect(tx.customer.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', organizationId: 'org-1', deletedAt: null },
      orderBy: { name: 'asc' },
    });
  });

  it('lists across all organizations in the tenant when none is given', async () => {
    await repository.list('tenant-1', undefined);

    expect(tx.customer.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', organizationId: undefined, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  });

  it('updates only the provided fields', async () => {
    await repository.update('tenant-1', 'cust-1', { name: 'Acme Retail Ltd', updatedBy: 'user-1' });

    expect(tx.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: {
        name: 'Acme Retail Ltd',
        email: undefined,
        phone: undefined,
        billingAddress: undefined,
        updatedBy: 'user-1',
      },
    });
  });

  it('soft-deletes by setting deletedAt instead of removing the row', async () => {
    await repository.softDelete('tenant-1', 'cust-1', 'user-1');

    expect(tx.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: { deletedAt: expect.any(Date), updatedBy: 'user-1' },
    });
  });
});
