import { PrismaService } from '@africahr/platform-database';
import { InventoryVendorRepository } from './inventory-vendor.repository';

describe('InventoryVendorRepository', () => {
  let repository: InventoryVendorRepository;
  let tx: { vendor: { findFirst: jest.Mock; findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { vendor: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InventoryVendorRepository(prisma as unknown as PrismaService);
  });

  it('finds a vendor by id, scoped to the tenant', async () => {
    await repository.findById('tenant-1', 'vendor-1');

    expect(tx.vendor.findFirst).toHaveBeenCalledWith({
      where: { id: 'vendor-1', tenantId: 'tenant-1', deletedAt: null },
      select: { id: true, organizationId: true, name: true, email: true, phone: true },
    });
  });

  it('lists vendors, optionally scoped to one organization', async () => {
    await repository.list('tenant-1', 'org-1');

    expect(tx.vendor.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', organizationId: 'org-1', deletedAt: null },
      select: { id: true, organizationId: true, name: true, email: true, phone: true },
      orderBy: { name: 'asc' },
    });
  });
});
