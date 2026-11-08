import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { TeamPerformanceReviewController } from './team-performance-review.controller';
import { PerformanceReviewService } from './performance-review.service';

describe('TeamPerformanceReviewController', () => {
  let controller: TeamPerformanceReviewController;
  let service: jest.Mocked<PerformanceReviewService>;

  const manager: RequestUser = {
    sub: 'mgr-user-1',
    email: 'kwame@acme.com',
    role: SystemRole.EMPLOYEE,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      listForDirectReports: jest.fn(),
      findByIdForManager: jest.fn(),
      submitManagerAssessmentAsManager: jest.fn(),
    } as unknown as jest.Mocked<PerformanceReviewService>;

    controller = new TeamPerformanceReviewController(service);
  });

  it('lists reviews for the caller’s direct reports via their user id', () => {
    controller.list('tenant-1', manager);

    expect(service.listForDirectReports).toHaveBeenCalledWith('tenant-1', 'mgr-user-1');
  });

  it('finds a review, delegating the direct-manager check to the service', () => {
    controller.findById('tenant-1', 'rev-1', manager);

    expect(service.findByIdForManager).toHaveBeenCalledWith('tenant-1', 'mgr-user-1', 'rev-1');
  });

  it('submits a manager assessment, delegating the direct-manager check to the service', () => {
    const dto = { managerRating: 5 } as never;

    controller.submitManagerAssessment('tenant-1', 'rev-1', dto, manager);

    expect(service.submitManagerAssessmentAsManager).toHaveBeenCalledWith(
      'tenant-1',
      'mgr-user-1',
      'rev-1',
      dto,
    );
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', manager)).toThrow(ForbiddenException);
  });
});
