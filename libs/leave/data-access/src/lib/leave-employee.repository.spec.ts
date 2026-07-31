import { PrismaService } from '@africahr/platform-database';
import { LeaveEmployeeRepository } from './leave-employee.repository';

describe('LeaveEmployeeRepository', () => {
  let repository: LeaveEmployeeRepository;
  let tx: { employee: { findFirst: jest.Mock; findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { employee: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new LeaveEmployeeRepository(prisma as unknown as PrismaService);
  });

  it('resolves an employee by userId, scoped to the tenant, including managerId and name', async () => {
    await repository.findByUserId('tenant-1', 'user-1');

    expect(tx.employee.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', userId: 'user-1', deletedAt: null },
      select: { id: true, userId: true, managerId: true, firstName: true, lastName: true },
    });
  });

  it('finds an employee by id, scoped to the tenant, including managerId and name', async () => {
    await repository.findById('tenant-1', 'emp-1');

    expect(tx.employee.findFirst).toHaveBeenCalledWith({
      where: { id: 'emp-1', tenantId: 'tenant-1', deletedAt: null },
      select: { id: true, userId: true, managerId: true, firstName: true, lastName: true },
    });
  });

  it('lists direct-report employee ids for a manager', async () => {
    tx.employee.findMany.mockResolvedValue([{ id: 'emp-2' }, { id: 'emp-3' }]);

    const result = await repository.listDirectReportIds('tenant-1', 'mgr-emp-1');

    expect(tx.employee.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', managerId: 'mgr-emp-1', deletedAt: null },
      select: { id: true },
    });
    expect(result).toEqual(['emp-2', 'emp-3']);
  });

  it('finds employee names by id, scoped to the tenant', async () => {
    tx.employee.findMany.mockResolvedValue([{ id: 'emp-1', firstName: 'Kwame', lastName: 'Asante' }]);

    const result = await repository.findManyByIds('tenant-1', ['emp-1', 'emp-2']);

    expect(tx.employee.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', id: { in: ['emp-1', 'emp-2'] }, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });
    expect(result).toEqual([{ id: 'emp-1', firstName: 'Kwame', lastName: 'Asante' }]);
  });
});
