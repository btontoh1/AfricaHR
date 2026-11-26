import { PrismaService } from '@africahr/platform-database';
import { WeeklyReportReminderRepository } from './weekly-report-reminder.repository';

describe('WeeklyReportReminderRepository', () => {
  it('calls the cross-tenant lookup function directly (no tenant context)', async () => {
    const queryRaw = jest.fn().mockResolvedValue([{ tenantId: 'tenant-1', userId: 'user-1', employeeId: 'employee-1', firstName: 'Ama' }]);
    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
    const repository = new WeeklyReportReminderRepository(prisma);

    const weekStart = new Date('2026-11-23T00:00:00Z');
    const result = await repository.findEmployeesMissingReport(weekStart);

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ tenantId: 'tenant-1', userId: 'user-1', employeeId: 'employee-1', firstName: 'Ama' }]);
  });
});
