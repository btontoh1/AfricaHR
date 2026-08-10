import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { MyPerformanceReviewController } from './my-performance-review.controller';
import { PerformanceReviewService } from './performance-review.service';

describe('MyPerformanceReviewController', () => {
  let controller: MyPerformanceReviewController;
  let service: jest.Mocked<PerformanceReviewService>;

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
      startForSelf: jest.fn(),
      findByIdForSelf: jest.fn(),
      submitSelfAssessmentForSelf: jest.fn(),
    } as unknown as jest.Mocked<PerformanceReviewService>;

    controller = new MyPerformanceReviewController(service);
  });

  it('lists the caller’s own reviews via their user id', () => {
    controller.list('tenant-1', employee);

    expect(service.listForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1');
  });

  it('starts a review for the caller via their user id', () => {
    const dto = { cycleId: 'cycle-1' };

    controller.start('tenant-1', dto, employee);

    expect(service.startForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1', 'cycle-1');
  });

  it('submits the caller’s self-assessment via their user id', () => {
    const dto = { selfRating: 4 } as never;

    controller.submitSelfAssessment('tenant-1', 'rev-1', dto, employee);

    expect(service.submitSelfAssessmentForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1', 'rev-1', dto);
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', employee)).toThrow(ForbiddenException);
  });
});
