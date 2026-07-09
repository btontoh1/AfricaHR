import { PrismaService } from '@africahr/platform-database';
import { PayrollEmployeeRepository } from './payroll-employee.repository';

describe('PayrollEmployeeRepository', () => {
  let repository: PayrollEmployeeRepository;
  let tx: { employee: { findMany: jest.Mock; findFirst: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { employee: { findMany: jest.fn(), findFirst: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PayrollEmployeeRepository(prisma as unknown as PrismaService);
  });

  it('lists only active, non-deleted employees in an organization, selecting payroll-relevant fields', async () => {
    await repository.listActiveByOrganization('tenant-1', 'org-1');

    expect(tx.employee.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', organizationId: 'org-1', employmentStatus: 'ACTIVE', deletedAt: null },
      select: { id: true, baseSalary: true, currency: true, countryCode: true },
    });
  });

  it('finds a single employee by id, scoped to the tenant', async () => {
    await repository.findById('tenant-1', 'emp-1');

    expect(tx.employee.findFirst).toHaveBeenCalledWith({
      where: { id: 'emp-1', tenantId: 'tenant-1', deletedAt: null },
      select: { id: true, baseSalary: true, currency: true, countryCode: true },
    });
  });
});
