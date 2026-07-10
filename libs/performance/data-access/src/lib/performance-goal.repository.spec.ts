import { PrismaService } from '@africahr/platform-database';
import { PerformanceGoalRepository } from './performance-goal.repository';

describe('PerformanceGoalRepository', () => {
  let repository: PerformanceGoalRepository;
  let tx: { performanceGoal: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      performanceGoal: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PerformanceGoalRepository(prisma as unknown as PrismaService);
  });

  it('creates a goal within the tenant context', async () => {
    await repository.create('tenant-1', {
      employeeId: 'emp-1',
      title: 'Ship the Q1 roadmap',
      createdBy: 'emp-1-user',
    });

    expect(tx.performanceGoal.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        title: 'Ship the Q1 roadmap',
      }),
    });
  });

  it('lists goals filtered by employeeId and status', async () => {
    await repository.list('tenant-1', { employeeId: 'emp-1', status: 'IN_PROGRESS' });

    expect(tx.performanceGoal.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, employeeId: 'emp-1', status: 'IN_PROGRESS' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('updates status and progress', async () => {
    await repository.update('tenant-1', 'goal-1', {
      status: 'COMPLETED',
      progressPercent: 100,
      updatedBy: 'emp-1-user',
    });

    expect(tx.performanceGoal.update).toHaveBeenCalledWith({
      where: { id: 'goal-1' },
      data: expect.objectContaining({ status: 'COMPLETED', progressPercent: 100 }),
    });
  });
});
