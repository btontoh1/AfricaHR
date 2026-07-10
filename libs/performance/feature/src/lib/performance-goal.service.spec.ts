import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PerformanceGoal } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { PerformanceEmployeeRepository, PerformanceGoalRepository } from '@africahr/performance-data-access';
import { PerformanceGoalService } from './performance-goal.service';

describe('PerformanceGoalService', () => {
  let service: PerformanceGoalService;
  let goals: jest.Mocked<PerformanceGoalRepository>;
  let employees: jest.Mocked<PerformanceEmployeeRepository>;
  let audit: jest.Mocked<AuditService>;

  function makeGoal(overrides: Partial<PerformanceGoal> = {}): PerformanceGoal {
    return {
      id: 'goal-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      title: 'Ship the Q1 roadmap',
      description: null,
      targetDate: null,
      status: 'NOT_STARTED',
      progressPercent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as PerformanceGoal;
  }

  beforeEach(() => {
    goals = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<PerformanceGoalRepository>;

    employees = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      listDirectReportIds: jest.fn(),
    } as unknown as jest.Mocked<PerformanceEmployeeRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new PerformanceGoalService(goals, employees, audit);
  });

  describe('resolveOwnEmployeeId', () => {
    it('throws ForbiddenException when the user has no linked employee', async () => {
      employees.findByUserId.mockResolvedValue(null);

      await expect(service.resolveOwnEmployeeId('tenant-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createForSelf', () => {
    it('resolves the caller employeeId and creates the goal, auditing on success', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1', userId: 'user-1', managerId: null });
      const created = makeGoal();
      goals.create.mockResolvedValue(created);

      await service.createForSelf('tenant-1', 'user-1', { title: 'Ship the Q1 roadmap' });

      expect(goals.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ employeeId: 'emp-1', title: 'Ship the Q1 roadmap' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'performance.goal.created', resourceId: created.id }),
      );
    });
  });

  describe('updateForSelf', () => {
    it('does not reveal a goal belonging to a different employee', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1', userId: 'user-1', managerId: null });
      goals.findById.mockResolvedValue(makeGoal({ employeeId: 'someone-else' }));

      await expect(
        service.updateForSelf('tenant-1', 'user-1', 'goal-1', { progressPercent: 50 }),
      ).rejects.toThrow(NotFoundException);
      expect(goals.update).not.toHaveBeenCalled();
    });

    it('updates the goal when it belongs to the caller', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1', userId: 'user-1', managerId: null });
      goals.findById.mockResolvedValue(makeGoal({ employeeId: 'emp-1' }));
      goals.update.mockResolvedValue(makeGoal({ progressPercent: 50 }));

      await service.updateForSelf('tenant-1', 'user-1', 'goal-1', { progressPercent: 50 });

      expect(goals.update).toHaveBeenCalledWith(
        'tenant-1',
        'goal-1',
        expect.objectContaining({ progressPercent: 50 }),
      );
    });
  });
});
