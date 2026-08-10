import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { MyBenefitEnrollmentController } from './my-benefit-enrollment.controller';
import { BenefitEnrollmentService } from './benefit-enrollment.service';

describe('MyBenefitEnrollmentController', () => {
  let controller: MyBenefitEnrollmentController;
  let service: jest.Mocked<BenefitEnrollmentService>;

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
      enrollForSelf: jest.fn(),
      cancelForSelf: jest.fn(),
    } as unknown as jest.Mocked<BenefitEnrollmentService>;

    controller = new MyBenefitEnrollmentController(service);
  });

  it('lists the caller’s own enrollments via their user id', () => {
    controller.list('tenant-1', employee);

    expect(service.listForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1');
  });

  it('enrolls the caller via their user id', () => {
    const dto = { benefitPlanId: 'plan-1' } as never;

    controller.enroll('tenant-1', dto, employee);

    expect(service.enrollForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1', dto);
  });

  it('cancels the caller’s own enrollment via their user id', () => {
    controller.cancel('tenant-1', 'enr-1', employee);

    expect(service.cancelForSelf).toHaveBeenCalledWith('tenant-1', 'emp-user-1', 'enr-1');
  });

  it('rejects an actor acting on a different tenant even for self-service routes', () => {
    expect(() => controller.list('tenant-2', employee)).toThrow(ForbiddenException);
  });
});
