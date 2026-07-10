import { PrismaService } from '@africahr/platform-database';
import { PerformanceReviewRepository } from './performance-review.repository';

describe('PerformanceReviewRepository', () => {
  let repository: PerformanceReviewRepository;
  let tx: {
    performanceReview: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      performanceReview: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PerformanceReviewRepository(prisma as unknown as PrismaService);
  });

  it('creates a review within the tenant context', async () => {
    await repository.create('tenant-1', {
      employeeId: 'emp-1',
      cycleId: 'cycle-1',
      createdBy: 'emp-1-user',
    });

    expect(tx.performanceReview.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: 'tenant-1', employeeId: 'emp-1', cycleId: 'cycle-1' }),
    });
  });

  it('finds a review by employee and cycle', async () => {
    await repository.findByEmployeeAndCycle('tenant-1', 'emp-1', 'cycle-1');

    expect(tx.performanceReview.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', employeeId: 'emp-1', cycleId: 'cycle-1', deletedAt: null },
    });
  });

  it('updates with self-assessment fields', async () => {
    const selfSubmittedAt = new Date('2026-02-01');

    await repository.update('tenant-1', 'rev-1', {
      status: 'SELF_SUBMITTED',
      selfRating: 4,
      selfComments: 'Good quarter',
      selfSubmittedAt,
      updatedBy: 'emp-1-user',
    });

    expect(tx.performanceReview.update).toHaveBeenCalledWith({
      where: { id: 'rev-1' },
      data: expect.objectContaining({
        status: 'SELF_SUBMITTED',
        selfRating: 4,
        selfComments: 'Good quarter',
        selfSubmittedAt,
      }),
    });
  });

  it('updates with manager-assessment fields', async () => {
    const managerReviewedAt = new Date('2026-02-05');

    await repository.update('tenant-1', 'rev-1', {
      status: 'COMPLETED',
      managerRating: 5,
      managerComments: 'Exceeded expectations',
      managerUserId: 'mgr-user-1',
      managerReviewedAt,
      updatedBy: 'mgr-user-1',
    });

    expect(tx.performanceReview.update).toHaveBeenCalledWith({
      where: { id: 'rev-1' },
      data: expect.objectContaining({
        status: 'COMPLETED',
        managerRating: 5,
        managerUserId: 'mgr-user-1',
        managerReviewedAt,
      }),
    });
  });
});
