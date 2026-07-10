import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { PerformanceGoalController } from './performance-goal.controller';
import { PerformanceGoalService } from './performance-goal.service';

describe('PerformanceGoalController', () => {
  let controller: PerformanceGoalController;
  let service: jest.Mocked<PerformanceGoalService>;

  const hrManager: RequestUser = {
    sub: 'hr-1',
    email: 'hr@acme.com',
    role: SystemRole.HR_MANAGER,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      list: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<PerformanceGoalService>;

    controller = new PerformanceGoalController(service);
  });

  it('lists with employeeId/status filters within the route tenant', () => {
    controller.list('tenant-1', hrManager, 'emp-1', 'IN_PROGRESS');

    expect(service.list).toHaveBeenCalledWith('tenant-1', { employeeId: 'emp-1', status: 'IN_PROGRESS' });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.findById('tenant-2', 'goal-1', hrManager)).toThrow(ForbiddenException);
  });

  it('delegates update (HR override) with tenant, id, dto, and actor', () => {
    const dto = { status: 'CANCELLED' } as never;

    controller.update('tenant-1', 'goal-1', dto, hrManager);

    expect(service.update).toHaveBeenCalledWith('tenant-1', 'goal-1', dto, 'hr-1');
  });
});
