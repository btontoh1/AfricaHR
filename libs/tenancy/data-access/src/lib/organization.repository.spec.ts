import { PrismaService } from '@africahr/platform-database';
import { OrganizationRepository } from './organization.repository';

describe('OrganizationRepository', () => {
  let repository: OrganizationRepository;
  let tx: {
    organization: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      organization: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = {
      withTenantContext: jest.fn((_tenantId, fn) => fn(tx)),
    };
    repository = new OrganizationRepository(prisma as unknown as PrismaService);
  });

  it('creates an organization within the tenant context', async () => {
    await repository.create('tenant-1', {
      legalName: 'Acme Ghana Ltd',
      countryCode: 'GH',
      registrationNumber: 'BN-12345',
    });

    expect(prisma.withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(tx.organization.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        legalName: 'Acme Ghana Ltd',
        registrationNumber: 'BN-12345',
      }),
    });
  });

  it('scopes findById to the tenant and excludes soft-deleted rows', async () => {
    await repository.findById('tenant-1', 'org-1');

    expect(tx.organization.findFirst).toHaveBeenCalledWith({
      where: { id: 'org-1', tenantId: 'tenant-1', deletedAt: null },
    });
  });

  it('lists organizations scoped to the tenant', async () => {
    await repository.listByTenant('tenant-1');

    expect(tx.organization.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  });
});
