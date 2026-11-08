import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { BenefitPlanController } from './benefit-plan.controller';
import { BenefitPlanService } from './benefit-plan.service';

describe('BenefitPlanController', () => {
  let controller: BenefitPlanController;
  let service: jest.Mocked<BenefitPlanService>;

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
    } as unknown as jest.Mocked<BenefitPlanService>;

    controller = new BenefitPlanController(service);
  });

  it('creates within the route tenant when the actor matches', () => {
    const dto = {
      name: 'Private Health Insurance',
      code: 'HEALTH',
      contributionType: 'PERCENTAGE',
      employeeContribution: 0.02,
      employerContribution: 0.03,
    } as never;

    controller.create('tenant-1', dto, hrManager);

    expect(service.create).toHaveBeenCalledWith('tenant-1', dto, 'hr-1');
  });

  it('allows an EMPLOYEE-role actor to list the catalog (no permission gate on list)', () => {
    controller.list('tenant-1', employee, undefined);

    expect(service.list).toHaveBeenCalledWith('tenant-1', { activeOnly: false });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', hrManager, undefined)).toThrow(ForbiddenException);
  });

  it('delegates update with tenant, id, dto, and actor', () => {
    const dto = { isActive: false } as never;

    controller.update('tenant-1', 'plan-1', dto, hrManager);

    expect(service.update).toHaveBeenCalledWith('tenant-1', 'plan-1', dto, 'hr-1');
  });
});
