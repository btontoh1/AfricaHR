import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PerformanceReview, PerformanceReviewCycle, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  PerformanceEmployeeRepository,
  PerformanceReviewCycleRepository,
  PerformanceReviewRepository,
} from '@africahr/performance-data-access';
import {
  PERFORMANCE_REVIEW_COMPLETED_EVENT,
  PERFORMANCE_REVIEW_SELF_SUBMITTED_EVENT,
  PerformanceReviewService,
} from './performance-review.service';

describe('PerformanceReviewService', () => {
  let service: PerformanceReviewService;
  let reviews: jest.Mocked<PerformanceReviewRepository>;
  let cycles: jest.Mocked<PerformanceReviewCycleRepository>;
  let employees: jest.Mocked<PerformanceEmployeeRepository>;
  let audit: jest.Mocked<AuditService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  function makeCycle(overrides: Partial<PerformanceReviewCycle> = {}): PerformanceReviewCycle {
    return {
      id: 'cycle-1',
      tenantId: 'tenant-1',
      name: 'Q1 2026 Review',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as PerformanceReviewCycle;
  }

  function makeReview(overrides: Partial<PerformanceReview> = {}): PerformanceReview {
    return {
      id: 'rev-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      cycleId: 'cycle-1',
      status: 'DRAFT',
      selfRating: null,
      selfComments: null,
      selfSubmittedAt: null,
      managerRating: null,
      managerComments: null,
      managerUserId: null,
      managerReviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as PerformanceReview;
  }

  beforeEach(() => {
    reviews = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmployeeAndCycle: jest.fn().mockResolvedValue(null),
      list: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    } as unknown as jest.Mocked<PerformanceReviewRepository>;

    cycles = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(makeCycle()),
      list: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<PerformanceReviewCycleRepository>;

    employees = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      listDirectReportIds: jest.fn().mockResolvedValue([]),
      findManyByIds: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<PerformanceEmployeeRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

    service = new PerformanceReviewService(reviews, cycles, employees, audit, eventEmitter);
  });

  describe('resolveOwnEmployeeId', () => {
    it('throws ForbiddenException when the user has no linked employee', async () => {
      employees.findByUserId.mockResolvedValue(null);

      await expect(service.resolveOwnEmployeeId('tenant-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('start', () => {
    it('throws NotFoundException when the cycle does not exist', async () => {
      cycles.findById.mockResolvedValue(null);

      await expect(service.start('tenant-1', 'emp-1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('rejects starting a second review for the same employee and cycle', async () => {
      reviews.findByEmployeeAndCycle.mockResolvedValue(makeReview());

      await expect(service.start('tenant-1', 'emp-1', 'cycle-1')).rejects.toThrow(ConflictException);
      expect(reviews.create).not.toHaveBeenCalled();
    });

    it('translates a foreign-key violation on employeeId into NotFoundException', async () => {
      reviews.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('FK violation', {
          code: 'P2003',
          clientVersion: '7.8.0',
        }),
      );

      await expect(service.start('tenant-1', 'missing-emp', 'cycle-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates the review and audits on success', async () => {
      const created = makeReview();
      reviews.create.mockResolvedValue(created);

      await service.start('tenant-1', 'emp-1', 'cycle-1', 'emp-1-user');

      expect(reviews.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ employeeId: 'emp-1', cycleId: 'cycle-1' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'performance.review.started', resourceId: created.id }),
      );
    });
  });

  describe('findByIdForSelf', () => {
    it('does not reveal a review belonging to a different employee', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1', userId: 'user-1', managerId: null });
      reviews.findById.mockResolvedValue(makeReview({ employeeId: 'someone-else' }));

      await expect(service.findByIdForSelf('tenant-1', 'user-1', 'rev-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByIdForManager', () => {
    it('rejects a caller who is not the direct manager of the reviewed employee', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1', managerId: null });
      reviews.findById.mockResolvedValue(makeReview({ employeeId: 'emp-1' }));
      employees.findById.mockResolvedValue({ id: 'emp-1', userId: 'user-1', managerId: 'someone-else' });

      await expect(service.findByIdForManager('tenant-1', 'mgr-user-1', 'rev-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows the direct manager to view the review', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1', managerId: null });
      const review = makeReview({ employeeId: 'emp-1' });
      reviews.findById.mockResolvedValue(review);
      employees.findById.mockResolvedValue({ id: 'emp-1', userId: 'user-1', managerId: 'mgr-emp-1' });

      await expect(service.findByIdForManager('tenant-1', 'mgr-user-1', 'rev-1')).resolves.toEqual(
        review,
      );
    });
  });

  describe('listForDirectReports', () => {
    it('returns an empty list when the caller has no direct reports', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1', managerId: null });
      employees.listDirectReportIds.mockResolvedValue([]);

      const result = await service.listForDirectReports('tenant-1', 'mgr-user-1');

      expect(result).toEqual([]);
      expect(reviews.list).not.toHaveBeenCalled();
    });

    it('aggregates reviews across all direct reports, enriched with each report name', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1', managerId: null });
      employees.listDirectReportIds.mockResolvedValue(['emp-1', 'emp-2']);
      employees.findManyByIds.mockResolvedValue([{ id: 'emp-1', firstName: 'Ricky', lastName: 'Report' }]);
      reviews.list
        .mockResolvedValueOnce([makeReview({ id: 'rev-1', employeeId: 'emp-1' })])
        .mockResolvedValueOnce([makeReview({ id: 'rev-2', employeeId: 'emp-2' })]);

      const result = await service.listForDirectReports('tenant-1', 'mgr-user-1');

      expect(result).toHaveLength(2);
      expect(reviews.list).toHaveBeenCalledWith('tenant-1', { employeeId: 'emp-1' });
      expect(reviews.list).toHaveBeenCalledWith('tenant-1', { employeeId: 'emp-2' });
      expect(employees.findManyByIds).toHaveBeenCalledWith('tenant-1', ['emp-1', 'emp-2']);
      expect(result[0]).toMatchObject({ id: 'rev-1', employeeName: 'Ricky Report' });
      // Falls back to the raw id rather than a blank/undefined name if a report has no matching employee row.
      expect(result[1]).toMatchObject({ id: 'rev-2', employeeName: 'emp-2' });
    });
  });

  describe('submitSelfAssessment', () => {
    it('rejects submitting a self-assessment for an already-COMPLETED review', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'COMPLETED' }));

      await expect(
        service.submitSelfAssessment('tenant-1', 'rev-1', { selfRating: 4 }),
      ).rejects.toThrow(ConflictException);
    });

    it('sets status SELF_SUBMITTED and audits on success', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'DRAFT' }));
      reviews.update.mockResolvedValue(makeReview({ status: 'SELF_SUBMITTED' }));

      await service.submitSelfAssessment(
        'tenant-1',
        'rev-1',
        { selfRating: 4, selfComments: 'Good quarter' },
        'emp-1-user',
      );

      expect(reviews.update).toHaveBeenCalledWith(
        'tenant-1',
        'rev-1',
        expect.objectContaining({ status: 'SELF_SUBMITTED', selfRating: 4 }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'performance.review.self_submitted' }),
      );
    });

    it('emits a notification event when the employee has a manager with portal access', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'DRAFT', employeeId: 'emp-1' }));
      reviews.update.mockResolvedValue(makeReview({ status: 'SELF_SUBMITTED', employeeId: 'emp-1' }));
      employees.findById.mockImplementation(async (_tenantId, id) => {
        if (id === 'emp-1') {
          return { id: 'emp-1', userId: 'emp-1-user', managerId: 'mgr-1' };
        }
        if (id === 'mgr-1') {
          return { id: 'mgr-1', userId: 'mgr-user-1', managerId: null };
        }
        return null;
      });
      employees.findManyByIds.mockResolvedValue([{ id: 'emp-1', firstName: 'Kwame', lastName: 'Asante' }]);

      await service.submitSelfAssessment('tenant-1', 'rev-1', { selfRating: 4 }, 'emp-1-user');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PERFORMANCE_REVIEW_SELF_SUBMITTED_EVENT,
        expect.objectContaining({
          tenantId: 'tenant-1',
          managerUserId: 'mgr-user-1',
          employeeName: 'Kwame Asante',
          cycleName: 'Q1 2026 Review',
        }),
      );
    });

    it('emits with a null managerUserId when the employee has no manager', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'DRAFT', employeeId: 'emp-1' }));
      reviews.update.mockResolvedValue(makeReview({ status: 'SELF_SUBMITTED', employeeId: 'emp-1' }));
      employees.findById.mockResolvedValue({ id: 'emp-1', userId: 'emp-1-user', managerId: null });
      employees.findManyByIds.mockResolvedValue([{ id: 'emp-1', firstName: 'Kwame', lastName: 'Asante' }]);

      await service.submitSelfAssessment('tenant-1', 'rev-1', { selfRating: 4 }, 'emp-1-user');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PERFORMANCE_REVIEW_SELF_SUBMITTED_EVENT,
        expect.objectContaining({ tenantId: 'tenant-1', managerUserId: null }),
      );
    });

    it('emits with a null managerUserId when the manager has no portal access', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'DRAFT', employeeId: 'emp-1' }));
      reviews.update.mockResolvedValue(makeReview({ status: 'SELF_SUBMITTED', employeeId: 'emp-1' }));
      employees.findById.mockImplementation(async (_tenantId, id) => {
        if (id === 'emp-1') {
          return { id: 'emp-1', userId: 'emp-1-user', managerId: 'mgr-1' };
        }
        if (id === 'mgr-1') {
          return { id: 'mgr-1', userId: null, managerId: null };
        }
        return null;
      });
      employees.findManyByIds.mockResolvedValue([{ id: 'emp-1', firstName: 'Kwame', lastName: 'Asante' }]);

      await service.submitSelfAssessment('tenant-1', 'rev-1', { selfRating: 4 }, 'emp-1-user');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PERFORMANCE_REVIEW_SELF_SUBMITTED_EVENT,
        expect.objectContaining({ tenantId: 'tenant-1', managerUserId: null }),
      );
    });
  });

  describe('submitManagerAssessmentAsManager', () => {
    it('rejects a caller who is not the direct manager', async () => {
      reviews.findById.mockResolvedValue(makeReview({ employeeId: 'emp-1' }));
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1', managerId: null });
      employees.findById.mockResolvedValue({ id: 'emp-1', userId: 'user-1', managerId: 'someone-else' });

      await expect(
        service.submitManagerAssessmentAsManager('tenant-1', 'mgr-user-1', 'rev-1', { managerRating: 5 }),
      ).rejects.toThrow(ForbiddenException);
      expect(reviews.update).not.toHaveBeenCalled();
    });

    it('allows the direct manager to complete the review', async () => {
      reviews.findById.mockResolvedValue(makeReview({ employeeId: 'emp-1', status: 'SELF_SUBMITTED' }));
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1', managerId: null });
      employees.findById.mockResolvedValue({ id: 'emp-1', userId: 'user-1', managerId: 'mgr-emp-1' });
      reviews.update.mockResolvedValue(makeReview({ status: 'COMPLETED' }));

      await service.submitManagerAssessmentAsManager('tenant-1', 'mgr-user-1', 'rev-1', {
        managerRating: 5,
      });

      expect(reviews.update).toHaveBeenCalledWith(
        'tenant-1',
        'rev-1',
        expect.objectContaining({ status: 'COMPLETED', managerRating: 5, managerUserId: 'mgr-user-1' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'performance.review.completed' }),
      );
    });
  });

  describe('submitManagerAssessment', () => {
    it('allows completing directly from DRAFT (self-assessment skipped)', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'DRAFT' }));
      reviews.update.mockResolvedValue(makeReview({ status: 'COMPLETED' }));

      await service.submitManagerAssessment('tenant-1', 'rev-1', { managerRating: 3 }, 'hr-1');

      expect(reviews.update).toHaveBeenCalledWith(
        'tenant-1',
        'rev-1',
        expect.objectContaining({ status: 'COMPLETED' }),
      );
    });

    it('rejects re-completing an already-COMPLETED review', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'COMPLETED' }));

      await expect(
        service.submitManagerAssessment('tenant-1', 'rev-1', { managerRating: 3 }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects submitting a manager assessment for a CANCELLED review', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'CANCELLED' }));

      await expect(
        service.submitManagerAssessment('tenant-1', 'rev-1', { managerRating: 3 }),
      ).rejects.toThrow(ConflictException);
    });

    it('emits a notification event to the reviewee when they have portal access', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'SELF_SUBMITTED', employeeId: 'emp-1' }));
      reviews.update.mockResolvedValue(makeReview({ status: 'COMPLETED', employeeId: 'emp-1' }));
      employees.findById.mockResolvedValue({ id: 'emp-1', userId: 'emp-1-user', managerId: null });

      await service.submitManagerAssessment('tenant-1', 'rev-1', { managerRating: 3 }, 'mgr-user-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PERFORMANCE_REVIEW_COMPLETED_EVENT,
        expect.objectContaining({
          tenantId: 'tenant-1',
          employeeUserId: 'emp-1-user',
          cycleName: 'Q1 2026 Review',
        }),
      );
    });

    it('does not emit when the reviewee has no portal access', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'SELF_SUBMITTED', employeeId: 'emp-1' }));
      reviews.update.mockResolvedValue(makeReview({ status: 'COMPLETED', employeeId: 'emp-1' }));
      employees.findById.mockResolvedValue({ id: 'emp-1', userId: null, managerId: null });

      await service.submitManagerAssessment('tenant-1', 'rev-1', { managerRating: 3 }, 'mgr-user-1');

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('does not emit when the reviewee can no longer be found', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'SELF_SUBMITTED', employeeId: 'emp-1' }));
      reviews.update.mockResolvedValue(makeReview({ status: 'COMPLETED', employeeId: 'emp-1' }));
      employees.findById.mockResolvedValue(null);

      await service.submitManagerAssessment('tenant-1', 'rev-1', { managerRating: 3 }, 'mgr-user-1');

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('cancels a DRAFT review and audits', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'DRAFT' }));
      reviews.update.mockResolvedValue(makeReview({ status: 'CANCELLED' }));

      await service.cancel('tenant-1', 'rev-1', 'hr-1');

      expect(reviews.update).toHaveBeenCalledWith(
        'tenant-1',
        'rev-1',
        expect.objectContaining({ status: 'CANCELLED' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'performance.review.cancelled' }),
      );
    });

    it('cancels a SELF_SUBMITTED review', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'SELF_SUBMITTED' }));
      reviews.update.mockResolvedValue(makeReview({ status: 'CANCELLED' }));

      await service.cancel('tenant-1', 'rev-1', 'hr-1');

      expect(reviews.update).toHaveBeenCalledWith(
        'tenant-1',
        'rev-1',
        expect.objectContaining({ status: 'CANCELLED' }),
      );
    });

    it('rejects cancelling an already-COMPLETED review', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'COMPLETED' }));

      await expect(service.cancel('tenant-1', 'rev-1')).rejects.toThrow(ConflictException);
      expect(reviews.update).not.toHaveBeenCalled();
    });

    it('rejects cancelling an already-CANCELLED review', async () => {
      reviews.findById.mockResolvedValue(makeReview({ status: 'CANCELLED' }));

      await expect(service.cancel('tenant-1', 'rev-1')).rejects.toThrow(ConflictException);
      expect(reviews.update).not.toHaveBeenCalled();
    });
  });
});
