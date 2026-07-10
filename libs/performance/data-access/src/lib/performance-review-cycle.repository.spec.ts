import { PrismaService } from '@africahr/platform-database';
import { PerformanceReviewCycleRepository } from './performance-review-cycle.repository';

describe('PerformanceReviewCycleRepository', () => {
  let repository: PerformanceReviewCycleRepository;
  let tx: {
    performanceReviewCycle: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      performanceReviewCycle: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PerformanceReviewCycleRepository(prisma as unknown as PrismaService);
  });

  it('creates a cycle within the tenant context', async () => {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-03-31');

    await repository.create('tenant-1', {
      name: 'Q1 2026 Review',
      startDate,
      endDate,
      createdBy: 'hr-1',
    });

    expect(tx.performanceReviewCycle.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: 'tenant-1', name: 'Q1 2026 Review', startDate, endDate }),
    });
  });

  it('lists cycles filtered by status, most recent first', async () => {
    await repository.list('tenant-1', { status: 'ACTIVE' });

    expect(tx.performanceReviewCycle.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
    });
  });

  it('updates the cycle status', async () => {
    await repository.update('tenant-1', 'cycle-1', { status: 'CLOSED', updatedBy: 'hr-1' });

    expect(tx.performanceReviewCycle.update).toHaveBeenCalledWith({
      where: { id: 'cycle-1' },
      data: expect.objectContaining({ status: 'CLOSED', updatedBy: 'hr-1' }),
    });
  });
});
