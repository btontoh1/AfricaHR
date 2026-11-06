import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { AttendancePolicyController } from './attendance-policy.controller';
import { AttendancePolicyService } from './attendance-policy.service';

describe('AttendancePolicyController', () => {
  let controller: AttendancePolicyController;
  let service: jest.Mocked<AttendancePolicyService>;

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
    service = { upsert: jest.fn(), find: jest.fn() } as unknown as jest.Mocked<AttendancePolicyService>;
    controller = new AttendancePolicyController(service);
  });

  it('upserts within the route tenant when the actor matches', () => {
    const dto = { standardDailyHours: 8 } as never;

    controller.upsert('tenant-1', dto, hrManager);

    expect(service.upsert).toHaveBeenCalledWith('tenant-1', dto, 'hr-1');
  });

  it('allows an EMPLOYEE-role actor to view the policy (no permission gate on find)', () => {
    controller.find('tenant-1', employee);

    expect(service.find).toHaveBeenCalledWith('tenant-1');
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.find('tenant-2', hrManager)).toThrow(ForbiddenException);
  });
});
