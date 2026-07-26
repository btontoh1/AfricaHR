import { EmploymentStatus, EmploymentType } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { EmployeeRepository } from './employee.repository';

describe('EmployeeRepository', () => {
  let repository: EmployeeRepository;
  let tx: {
    employee: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      employee: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new EmployeeRepository(prisma as unknown as PrismaService);
  });

  it('creates an employee within the tenant context', async () => {
    await repository.create('tenant-1', {
      organizationId: 'org-1',
      employeeNumber: 'EMP-0001',
      firstName: 'Ama',
      lastName: 'Owusu',
      jobTitle: 'Software Engineer',
      employmentType: EmploymentType.FULL_TIME,
      hireDate: new Date('2026-01-01'),
      countryCode: 'GH',
    });

    expect(prisma.withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(tx.employee.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        employeeNumber: 'EMP-0001',
        firstName: 'Ama',
      }),
    });
  });

  it('scopes findById to the tenant and excludes soft-deleted rows', async () => {
    await repository.findById('tenant-1', 'emp-1');

    expect(tx.employee.findFirst).toHaveBeenCalledWith({
      where: { id: 'emp-1', tenantId: 'tenant-1', deletedAt: null },
    });
  });

  it('finds an employee by userId, scoped to the tenant', async () => {
    await repository.findByUserId('tenant-1', 'user-1');

    expect(tx.employee.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', userId: 'user-1', deletedAt: null },
    });
  });

  it('filters list by organizationUnitId when given', async () => {
    await repository.list('tenant-1', { organizationUnitId: 'unit-1' });

    expect(tx.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationUnitId: 'unit-1' }),
      }),
    );
  });

  it('updateStatus sets the termination date when provided', async () => {
    const terminationDate = new Date('2026-06-01');

    await repository.updateStatus(
      'tenant-1',
      'emp-1',
      EmploymentStatus.TERMINATED,
      'hr-1',
      terminationDate,
    );

    expect(tx.employee.update).toHaveBeenCalledWith({
      where: { id: 'emp-1' },
      data: { employmentStatus: EmploymentStatus.TERMINATED, terminationDate, updatedBy: 'hr-1' },
    });
  });
});
