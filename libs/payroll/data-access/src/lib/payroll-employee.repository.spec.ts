import { PrismaService } from '@africahr/platform-database';
import { PayrollEmployeeRepository } from './payroll-employee.repository';

describe('PayrollEmployeeRepository', () => {
  let repository: PayrollEmployeeRepository;
  let tx: { employee: { findMany: jest.Mock; findFirst: jest.Mock }; employeePaymentMethod: { findFirst: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  const EMPLOYEE_SELECT = {
    id: true,
    firstName: true,
    lastName: true,
    baseSalary: true,
    currency: true,
    annualRentPaid: true,
    countryCode: true,
  };

  beforeEach(() => {
    tx = {
      employee: { findMany: jest.fn(), findFirst: jest.fn() },
      employeePaymentMethod: { findFirst: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PayrollEmployeeRepository(prisma as unknown as PrismaService);
  });

  it('lists only active, non-deleted employees in an organization, selecting payroll-relevant fields', async () => {
    await repository.listActiveByOrganization('tenant-1', 'org-1');

    expect(tx.employee.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', organizationId: 'org-1', employmentStatus: 'ACTIVE', deletedAt: null },
      select: EMPLOYEE_SELECT,
    });
  });

  it('finds a single employee by id, scoped to the tenant', async () => {
    await repository.findById('tenant-1', 'emp-1');

    expect(tx.employee.findFirst).toHaveBeenCalledWith({
      where: { id: 'emp-1', tenantId: 'tenant-1', deletedAt: null },
      select: EMPLOYEE_SELECT,
    });
  });

  it('finds an employee by userId, scoped to the tenant', async () => {
    await repository.findByUserId('tenant-1', 'user-1');

    expect(tx.employee.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', userId: 'user-1', deletedAt: null },
      select: { id: true, userId: true },
    });
  });

  it("finds an employee's payment method, scoped to the tenant", async () => {
    await repository.findPaymentMethodByEmployeeId('tenant-1', 'emp-1');

    expect(tx.employeePaymentMethod.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', employeeId: 'emp-1' },
      select: { type: true, bankCode: true, accountNumber: true, accountName: true, mobileMoneyNumber: true },
    });
  });
});
