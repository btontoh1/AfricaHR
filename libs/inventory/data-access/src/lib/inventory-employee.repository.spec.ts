import { PrismaService } from '@africahr/platform-database';
import { InventoryEmployeeRepository } from './inventory-employee.repository';

describe('InventoryEmployeeRepository', () => {
  let repository: InventoryEmployeeRepository;
  let tx: { employee: { findFirst: jest.Mock; findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { employee: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InventoryEmployeeRepository(prisma as unknown as PrismaService);
  });

  it('resolves an employee by userId, scoped to the tenant', async () => {
    await repository.findByUserId('tenant-1', 'user-1');

    expect(tx.employee.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', userId: 'user-1', deletedAt: null },
      select: { id: true, userId: true, managerId: true, firstName: true, lastName: true },
    });
  });

  it('finds an employee by id, scoped to the tenant', async () => {
    await repository.findById('tenant-1', 'emp-1');

    expect(tx.employee.findFirst).toHaveBeenCalledWith({
      where: { id: 'emp-1', tenantId: 'tenant-1', deletedAt: null },
      select: { id: true, userId: true, managerId: true, firstName: true, lastName: true },
    });
  });

  it('finds employees by ids, scoped to the tenant', async () => {
    tx.employee.findMany.mockResolvedValue([{ id: 'emp-1', firstName: 'Ricky', lastName: 'Report' }]);

    const result = await repository.findManyByIds('tenant-1', ['emp-1', 'emp-2']);

    expect(tx.employee.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', id: { in: ['emp-1', 'emp-2'] }, deletedAt: null },
      select: { id: true, userId: true, managerId: true, firstName: true, lastName: true },
    });
    expect(result).toEqual([{ id: 'emp-1', firstName: 'Ricky', lastName: 'Report' }]);
  });
});
