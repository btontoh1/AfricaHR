import { PrismaService } from '@africahr/platform-database';
import { WeeklyReportCommentRepository } from './weekly-report-comment.repository';

describe('WeeklyReportCommentRepository', () => {
  let repository: WeeklyReportCommentRepository;
  let delegate: { findMany: jest.Mock; create: jest.Mock };
  let withTenantContext: jest.Mock;
  let prisma: { weeklyReportComment: typeof delegate; withTenantContext: jest.Mock };

  beforeEach(() => {
    delegate = { findMany: jest.fn(), create: jest.fn() };
    withTenantContext = jest.fn((_tenantId, fn) => fn({ weeklyReportComment: delegate }));
    prisma = { weeklyReportComment: delegate, withTenantContext };

    repository = new WeeklyReportCommentRepository(prisma as unknown as PrismaService);
  });

  it('create inserts a comment row', async () => {
    delegate.create.mockResolvedValue({ id: 'comment-1' });

    await repository.create('tenant-1', 'report-1', 'actor-1', 'Great work this week');

    expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(delegate.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', weeklyReportId: 'report-1', authorId: 'actor-1', body: 'Great work this week' },
    });
  });

  it('listForReport orders oldest first', async () => {
    delegate.findMany.mockResolvedValue([]);

    await repository.listForReport('tenant-1', 'report-1');

    expect(delegate.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', weeklyReportId: 'report-1' },
      orderBy: { createdAt: 'asc' },
    });
  });
});
