import { PrismaService } from '@africahr/platform-database';
import { HeadcountReportRepository } from './headcount-report.repository';

describe('HeadcountReportRepository', () => {
  let repository: HeadcountReportRepository;
  let tx: { employee: { count: jest.Mock; groupBy: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { employee: { count: jest.fn(), groupBy: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new HeadcountReportRepository(prisma as unknown as PrismaService);
  });

  it('counts active employees, excluding TERMINATED, scoped to the tenant', async () => {
    tx.employee.count.mockResolvedValue(12);

    const result = await repository.countActive('tenant-1', { organizationId: 'org-1' });

    expect(result).toBe(12);
    expect(tx.employee.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
        organizationId: 'org-1',
        employmentStatus: { not: 'TERMINATED' },
      },
    });
  });

  it('groups active headcount by employment type', async () => {
    tx.employee.groupBy.mockResolvedValue([
      { employmentType: 'FULL_TIME', _count: { _all: 10 } },
      { employmentType: 'CONTRACT', _count: { _all: 2 } },
    ]);

    const result = await repository.countByEmploymentType('tenant-1');

    expect(result).toEqual([
      { employmentType: 'FULL_TIME', count: 10 },
      { employmentType: 'CONTRACT', count: 2 },
    ]);
  });

  it('groups active headcount by organization unit', async () => {
    tx.employee.groupBy.mockResolvedValue([{ organizationUnitId: 'unit-1', _count: { _all: 5 } }]);

    const result = await repository.countByOrganizationUnit('tenant-1');

    expect(result).toEqual([{ organizationUnitId: 'unit-1', count: 5 }]);
  });

  it('counts hires within a date range', async () => {
    tx.employee.count.mockResolvedValue(3);
    const from = new Date('2026-01-01');
    const to = new Date('2026-01-31');

    const result = await repository.countHiresInPeriod('tenant-1', { from, to });

    expect(result).toBe(3);
    expect(tx.employee.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
        organizationId: undefined,
        hireDate: { gte: from, lte: to },
      },
    });
  });

  it('counts terminations within a date range', async () => {
    tx.employee.count.mockResolvedValue(1);
    const from = new Date('2026-01-01');
    const to = new Date('2026-01-31');

    const result = await repository.countTerminationsInPeriod('tenant-1', { from, to });

    expect(result).toBe(1);
    expect(tx.employee.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
        organizationId: undefined,
        terminationDate: { gte: from, lte: to },
      },
    });
  });
});
