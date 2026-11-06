import { PrismaService } from '@africahr/platform-database';
import { VendorRepository } from './vendor.repository';

describe('VendorRepository', () => {
  let repository: VendorRepository;
  let tx: { vendor: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      vendor: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new VendorRepository(prisma as unknown as PrismaService);
  });

  it('creates a vendor scoped to the tenant and organization', async () => {
    await repository.create('tenant-1', {
      organizationId: 'org-1',
      name: 'Acme Supplies',
      email: 'billing@acmesupplies.test',
      phone: '+233200000000',
      address: '10 Independence Ave, Accra',
      createdBy: 'user-1',
    });

    expect(tx.vendor.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        name: 'Acme Supplies',
        email: 'billing@acmesupplies.test',
        phone: '+233200000000',
        address: '10 Independence Ave, Accra',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      },
    });
  });

  it('finds a vendor by id, scoped to the tenant and excluding soft-deleted rows', async () => {
    await repository.findById('tenant-1', 'vendor-1');

    expect(tx.vendor.findFirst).toHaveBeenCalledWith({
      where: { id: 'vendor-1', tenantId: 'tenant-1', deletedAt: null },
    });
  });

  it('lists vendors scoped to the tenant and an optional organization, ordered by name', async () => {
    await repository.list('tenant-1', 'org-1');

    expect(tx.vendor.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', organizationId: 'org-1', deletedAt: null },
      orderBy: { name: 'asc' },
    });
  });

  it('lists across all organizations in the tenant when none is given', async () => {
    await repository.list('tenant-1', undefined);

    expect(tx.vendor.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', organizationId: undefined, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  });

  it('updates only the provided fields', async () => {
    await repository.update('tenant-1', 'vendor-1', { name: 'Acme Supplies Ltd', updatedBy: 'user-1' });

    expect(tx.vendor.update).toHaveBeenCalledWith({
      where: { id: 'vendor-1' },
      data: {
        name: 'Acme Supplies Ltd',
        email: undefined,
        phone: undefined,
        address: undefined,
        updatedBy: 'user-1',
      },
    });
  });

  it('soft-deletes by setting deletedAt instead of removing the row', async () => {
    await repository.softDelete('tenant-1', 'vendor-1', 'user-1');

    expect(tx.vendor.update).toHaveBeenCalledWith({
      where: { id: 'vendor-1' },
      data: { deletedAt: expect.any(Date), updatedBy: 'user-1' },
    });
  });
});
