import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { BenefitEnrollmentController } from './benefit-enrollment.controller';
import { BenefitEnrollmentService } from './benefit-enrollment.service';

describe('BenefitEnrollmentController', () => {
  let controller: BenefitEnrollmentController;
  let service: jest.Mocked<BenefitEnrollmentService>;

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
      getContribution: jest.fn(),
      enroll: jest.fn(),
      cancel: jest.fn(),
    } as unknown as jest.Mocked<BenefitEnrollmentService>;

    controller = new BenefitEnrollmentController(service);
  });

  it('lists with employeeId/benefitPlanId/status filters within the route tenant', () => {
    controller.list('tenant-1', hrManager, 'emp-1', 'plan-1', 'ACTIVE');

    expect(service.list).toHaveBeenCalledWith('tenant-1', {
      employeeId: 'emp-1',
      benefitPlanId: 'plan-1',
      status: 'ACTIVE',
    });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.findById('tenant-2', 'enr-1', hrManager)).toThrow(ForbiddenException);
  });

  it('delegates enroll (on behalf of an employee) with tenant, dto fields, and actor', () => {
    const dto = { employeeId: 'emp-1', benefitPlanId: 'plan-1', effectiveDate: '2026-03-01' };

    controller.enroll('tenant-1', dto, hrManager);

    expect(service.enroll).toHaveBeenCalledWith('tenant-1', 'emp-1', 'plan-1', '2026-03-01', 'hr-1');
  });

  it('delegates cancel with tenant, id, and actor', () => {
    controller.cancel('tenant-1', 'enr-1', hrManager);

    expect(service.cancel).toHaveBeenCalledWith('tenant-1', 'enr-1', 'hr-1');
  });

  it('delegates getContribution with tenant and id', () => {
    controller.getContribution('tenant-1', 'enr-1', hrManager);

    expect(service.getContribution).toHaveBeenCalledWith('tenant-1', 'enr-1');
  });
});
