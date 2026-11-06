import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { PerformanceReviewController } from './performance-review.controller';
import { PerformanceReviewService } from './performance-review.service';

describe('PerformanceReviewController', () => {
  let controller: PerformanceReviewController;
  let service: jest.Mocked<PerformanceReviewService>;

  const hrManager: RequestUser = {
    sub: 'hr-1',
    email: 'hr@acme.com',
    role: SystemRole.HR_MANAGER,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      list: jest.fn(),
      findById: jest.fn(),
      start: jest.fn(),
      submitManagerAssessment: jest.fn(),
      cancel: jest.fn(),
    } as unknown as jest.Mocked<PerformanceReviewService>;

    controller = new PerformanceReviewController(service);
  });

  it('lists with employeeId/cycleId/status filters within the route tenant', () => {
    controller.list('tenant-1', hrManager, 'emp-1', 'cycle-1', 'COMPLETED');

    expect(service.list).toHaveBeenCalledWith('tenant-1', {
      employeeId: 'emp-1',
      cycleId: 'cycle-1',
      status: 'COMPLETED',
    });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.findById('tenant-2', 'rev-1', hrManager)).toThrow(ForbiddenException);
  });

  it('delegates start (on behalf of an employee) with tenant, dto fields, and actor', () => {
    const dto = { employeeId: 'emp-1', cycleId: 'cycle-1' };

    controller.start('tenant-1', dto, hrManager);

    expect(service.start).toHaveBeenCalledWith('tenant-1', 'emp-1', 'cycle-1', 'hr-1');
  });

  it('delegates manager-assessment override with tenant, id, dto, and actor', () => {
    const dto = { managerRating: 5 } as never;

    controller.submitManagerAssessment('tenant-1', 'rev-1', dto, hrManager);

    expect(service.submitManagerAssessment).toHaveBeenCalledWith('tenant-1', 'rev-1', dto, 'hr-1');
  });

  it('delegates cancel with tenant, id, and actor', () => {
    controller.cancel('tenant-1', 'rev-1', hrManager);

    expect(service.cancel).toHaveBeenCalledWith('tenant-1', 'rev-1', 'hr-1');
  });
});
