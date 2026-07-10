import { ConflictException, NotFoundException } from '@nestjs/common';
import { PerformanceReviewCycle, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { PerformanceReviewCycleRepository } from '@africahr/performance-data-access';
import { ReviewCycleService } from './review-cycle.service';

describe('ReviewCycleService', () => {
  let service: ReviewCycleService;
  let cycles: jest.Mocked<PerformanceReviewCycleRepository>;
  let audit: jest.Mocked<AuditService>;

  function makeCycle(overrides: Partial<PerformanceReviewCycle> = {}): PerformanceReviewCycle {
    return {
      id: 'cycle-1',
      tenantId: 'tenant-1',
      name: 'Q1 2026 Review',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      status: 'UPCOMING',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as PerformanceReviewCycle;
  }

  beforeEach(() => {
    cycles = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<PerformanceReviewCycleRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new ReviewCycleService(cycles, audit);
  });

  describe('create', () => {
    it('translates a duplicate name into ConflictException', async () => {
      cycles.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique violation', {
          code: 'P2002',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.create('tenant-1', { name: 'Q1 2026 Review', startDate: '2026-01-01', endDate: '2026-03-31' }),
      ).rejects.toThrow(ConflictException);
    });

    it('records an audit entry on success', async () => {
      const created = makeCycle();
      cycles.create.mockResolvedValue(created);

      await service.create(
        'tenant-1',
        { name: 'Q1 2026 Review', startDate: '2026-01-01', endDate: '2026-03-31' },
        'hr-1',
      );

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'performance.cycle.created', resourceId: created.id }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the cycle does not exist', async () => {
      cycles.findById.mockResolvedValue(null);

      await expect(service.update('tenant-1', 'missing', {})).rejects.toThrow(NotFoundException);
      expect(cycles.update).not.toHaveBeenCalled();
    });

    it('updates and audits on success', async () => {
      cycles.findById.mockResolvedValue(makeCycle());
      cycles.update.mockResolvedValue(makeCycle({ status: 'ACTIVE' }));

      await service.update('tenant-1', 'cycle-1', { status: 'ACTIVE' }, 'hr-1');

      expect(cycles.update).toHaveBeenCalledWith(
        'tenant-1',
        'cycle-1',
        expect.objectContaining({ status: 'ACTIVE' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'performance.cycle.updated' }),
      );
    });
  });
});
