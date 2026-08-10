import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { MyPerformanceGoalController } from './my-performance-goal.controller';
import { PerformanceGoalService } from './performance-goal.service';

describe('MyPerformanceGoalController', () => {
  let controller: MyPerformanceGoalController;
  let service: jest.Mocked<PerformanceGoalService>;

  const employee: RequestUser = {
    sub: 'emp-user-1',
    email: 'ama@acme.com',
    role: SystemRole.EMPLOYEE,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      listForSelf: jest.fn(),
      createForSelf: jest.fn(),
      updateForSelf: jest.fn(),
    } as unknown as jest.Mocked<PerformanceGoalService>;

    controller = new MyPerformanceGoalController(service);
  });

  it('lists the caller’s own goals via their user id', () => {
    controller.list('tenant-1', employee);

    expect(service.listForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1');
  });

  it('creates a goal for the caller via their user id', () => {
    const dto = { title: 'Ship the Q1 roadmap' } as never;

    controller.create('tenant-1', dto, employee);

    expect(service.createForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1', dto);
  });

  it('updates the caller’s own goal via their user id', () => {
    const dto = { progressPercent: 50 } as never;

    controller.update('tenant-1', 'goal-1', dto, employee);

    expect(service.updateForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1', 'goal-1', dto);
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', employee)).toThrow(ForbiddenException);
  });
});
