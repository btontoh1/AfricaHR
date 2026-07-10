import { PrismaService } from '@africahr/platform-database';
import { BenefitsEmployeeRepository } from './benefits-employee.repository';

describe('BenefitsEmployeeRepository', () => {
  let repository: BenefitsEmployeeRepository;
  let tx: { employee: { findFirst: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { employee: { findFirst: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new BenefitsEmployeeRepository(prisma as unknown as PrismaService);
  });

  it('resolves an employee by userId, scoped to the tenant, including baseSalary', async () => {
    await repository.findByUserId('tenant-1', 'user-1');

    expect(tx.employee.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', userId: 'user-1', deletedAt: null },
      select: { id: true, userId: true, baseSalary: true },
    });
  });

  it('finds an employee by id, scoped to the tenant', async () => {
    await repository.findById('tenant-1', 'emp-1');

    expect(tx.employee.findFirst).toHaveBeenCalledWith({
      where: { id: 'emp-1', tenantId: 'tenant-1', deletedAt: null },
      select: { id: true, userId: true, baseSalary: true },
    });
  });
});
