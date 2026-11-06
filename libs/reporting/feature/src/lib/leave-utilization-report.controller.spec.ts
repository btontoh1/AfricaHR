import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { LeaveUtilizationReportController } from './leave-utilization-report.controller';
import { LeaveUtilizationReportService } from './leave-utilization-report.service';

describe('LeaveUtilizationReportController', () => {
  let controller: LeaveUtilizationReportController;
  let service: jest.Mocked<LeaveUtilizationReportService>;

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
    service = { generate: jest.fn() } as unknown as jest.Mocked<LeaveUtilizationReportService>;
    controller = new LeaveUtilizationReportController(service);
  });

  it('delegates with year/organizationId/leaveTypeId filters within the route tenant', () => {
    controller.generate('tenant-1', hrManager, '2026', 'org-1', 'lt-1');

    expect(service.generate).toHaveBeenCalledWith('tenant-1', {
      year: '2026',
      organizationId: 'org-1',
      leaveTypeId: 'lt-1',
    });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.generate('tenant-2', hrManager)).toThrow(ForbiddenException);
  });
});
