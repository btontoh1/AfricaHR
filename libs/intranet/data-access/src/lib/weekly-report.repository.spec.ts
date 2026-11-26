import { PrismaService } from '@africahr/platform-database';
import { WeeklyReportRepository } from './weekly-report.repository';

describe('WeeklyReportRepository', () => {
  let repository: WeeklyReportRepository;
  let delegate: { findFirst: jest.Mock; findMany: jest.Mock; upsert: jest.Mock };
  let withTenantContext: jest.Mock;
  let prisma: { weeklyReport: typeof delegate; withTenantContext: jest.Mock };

  beforeEach(() => {
    delegate = { findFirst: jest.fn(), findMany: jest.fn(), upsert: jest.fn() };
    withTenantContext = jest.fn((_tenantId, fn) => fn({ weeklyReport: delegate }));
    prisma = { weeklyReport: delegate, withTenantContext };

    repository = new WeeklyReportRepository(prisma as unknown as PrismaService);
  });

  describe('submit', () => {
    it('upserts by employeeId + weekStart, marking it submitted', async () => {
      delegate.upsert.mockResolvedValue({ id: 'report-1' });
      const weekStart = new Date('2026-11-23T00:00:00Z');

      await repository.submit({
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        weekStart,
        answers: ['a', 'b', 'c'],
        actorId: 'actor-1',
      });

      expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
      const call = delegate.upsert.mock.calls[0][0];
      expect(call.where).toEqual({ employeeId_weekStart: { employeeId: 'employee-1', weekStart } });
      expect(call.create).toMatchObject({ tenantId: 'tenant-1', employeeId: 'employee-1', status: 'SUBMITTED' });
      expect(call.update).toMatchObject({ answers: ['a', 'b', 'c'], status: 'SUBMITTED' });
    });
  });

  describe('listForOrganizationUnit', () => {
    it('filters by the employee relation and includes employee details', async () => {
      delegate.findMany.mockResolvedValue([]);

      await repository.listForOrganizationUnit('tenant-1', 'unit-1');

      const call = delegate.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ tenantId: 'tenant-1', deletedAt: null, employee: { organizationUnitId: 'unit-1' } });
      expect(call.include.employee).toBeDefined();
    });

    it('adds a weekStart filter when given', async () => {
      delegate.findMany.mockResolvedValue([]);
      const weekStart = new Date('2026-11-23T00:00:00Z');

      await repository.listForOrganizationUnit('tenant-1', 'unit-1', weekStart);

      const call = delegate.findMany.mock.calls[0][0];
      expect(call.where.weekStart).toEqual(weekStart);
    });
  });

  describe('listForTenant', () => {
    it('has no employee-relation filter', async () => {
      delegate.findMany.mockResolvedValue([]);

      await repository.listForTenant('tenant-1');

      const call = delegate.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ tenantId: 'tenant-1', deletedAt: null });
    });
  });
});
