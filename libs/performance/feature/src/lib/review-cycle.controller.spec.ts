import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { ReviewCycleController } from './review-cycle.controller';
import { ReviewCycleService } from './review-cycle.service';

describe('ReviewCycleController', () => {
  let controller: ReviewCycleController;
  let service: jest.Mocked<ReviewCycleService>;

  const hrManager: RequestUser = {
    sub: 'hr-1',
    email: 'hr@acme.com',
    role: SystemRole.HR_MANAGER,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

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
      create: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<ReviewCycleService>;

    controller = new ReviewCycleController(service);
  });

  it('creates within the route tenant when the actor matches', () => {
    const dto = { name: 'Q1 2026 Review', startDate: '2026-01-01', endDate: '2026-03-31' } as never;

    controller.create('tenant-1', dto, hrManager);

    expect(service.create).toHaveBeenCalledWith('tenant-1', dto, 'hr-1');
  });

  it('allows an EMPLOYEE-role actor to list cycles (no permission gate on list)', () => {
    controller.list('tenant-1', employee, undefined);

    expect(service.list).toHaveBeenCalledWith('tenant-1', { status: undefined });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', hrManager, undefined)).toThrow(ForbiddenException);
  });

  it('delegates update with tenant, id, dto, and actor', () => {
    const dto = { status: 'CLOSED' } as never;

    controller.update('tenant-1', 'cycle-1', dto, hrManager);

    expect(service.update).toHaveBeenCalledWith('tenant-1', 'cycle-1', dto, 'hr-1');
  });
});
