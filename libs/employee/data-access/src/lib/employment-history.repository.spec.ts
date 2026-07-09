import { PrismaService } from '@africahr/platform-database';
import { EmploymentHistoryRepository } from './employment-history.repository';

describe('EmploymentHistoryRepository', () => {
  let repository: EmploymentHistoryRepository;
  let tx: { employmentHistoryEntry: { create: jest.Mock; findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { employmentHistoryEntry: { create: jest.fn(), findMany: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new EmploymentHistoryRepository(prisma as unknown as PrismaService);
  });

  it('creates a history entry within the tenant context', async () => {
    const effectiveDate = new Date('2026-01-01');

    await repository.create('tenant-1', {
      employeeId: 'emp-1',
      changeType: 'TITLE_CHANGE',
      fieldName: 'jobTitle',
      oldValue: 'Engineer',
      newValue: 'Senior Engineer',
      effectiveDate,
      createdBy: 'hr-1',
    });

    expect(tx.employmentHistoryEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        changeType: 'TITLE_CHANGE',
        oldValue: 'Engineer',
        newValue: 'Senior Engineer',
      }),
    });
  });

  it('lists history for an employee, most recent first', async () => {
    await repository.listByEmployee('tenant-1', 'emp-1');

    expect(tx.employmentHistoryEntry.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', employeeId: 'emp-1' },
      orderBy: { effectiveDate: 'desc' },
    });
  });
});
