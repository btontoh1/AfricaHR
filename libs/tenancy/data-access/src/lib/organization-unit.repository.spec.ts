import { PrismaService } from '@africahr/platform-database';
import { OrganizationUnitRepository } from './organization-unit.repository';

describe('OrganizationUnitRepository', () => {
  let repository: OrganizationUnitRepository;
  let tx: {
    organizationUnit: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    employee: {
      count: jest.Mock;
    };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      organizationUnit: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      employee: {
        count: jest.fn(),
      },
    };
    prisma = {
      withTenantContext: jest.fn((_tenantId, fn) => fn(tx)),
    };
    repository = new OrganizationUnitRepository(prisma as unknown as PrismaService);
  });

  it('creates a root unit when no parentId is given', async () => {
    await repository.create('tenant-1', {
      organizationId: 'org-1',
      name: 'Human Resources',
      code: 'HR',
    });

    expect(tx.organizationUnit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        parentId: null,
        name: 'Human Resources',
        code: 'HR',
      }),
    });
  });

  it('lists units scoped to tenant and organization', async () => {
    await repository.listByOrganization('tenant-1', 'org-1');

    expect(tx.organizationUnit.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', organizationId: 'org-1', deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('updates the parent of a unit', async () => {
    await repository.updateParent('tenant-1', 'unit-2', 'unit-1', 'ops-user-1');

    expect(tx.organizationUnit.update).toHaveBeenCalledWith({
      where: { id: 'unit-2' },
      data: { parentId: 'unit-1', updatedBy: 'ops-user-1' },
    });
  });

  it('updates name and code', async () => {
    await repository.update('tenant-1', 'unit-1', { name: 'Payroll', code: 'PAY' }, 'ops-user-1');

    expect(tx.organizationUnit.update).toHaveBeenCalledWith({
      where: { id: 'unit-1' },
      data: { name: 'Payroll', code: 'PAY', updatedBy: 'ops-user-1' },
    });
  });

  it('counts child units', async () => {
    tx.organizationUnit.count.mockResolvedValue(2);

    const count = await repository.countChildren('tenant-1', 'unit-1');

    expect(count).toBe(2);
    expect(tx.organizationUnit.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', parentId: 'unit-1', deletedAt: null },
    });
  });

  it('counts employees assigned to a unit', async () => {
    tx.employee.count.mockResolvedValue(3);

    const count = await repository.countEmployees('tenant-1', 'unit-1');

    expect(count).toBe(3);
    expect(tx.employee.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', organizationUnitId: 'unit-1', deletedAt: null },
    });
  });

  it('soft-deletes a unit', async () => {
    await repository.softDelete('tenant-1', 'unit-1', 'ops-user-1');

    expect(tx.organizationUnit.update).toHaveBeenCalledWith({
      where: { id: 'unit-1' },
      data: { deletedAt: expect.any(Date), updatedBy: 'ops-user-1' },
    });
  });
});
