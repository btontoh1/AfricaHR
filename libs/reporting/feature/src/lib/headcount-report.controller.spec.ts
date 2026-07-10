import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { HeadcountReportController } from './headcount-report.controller';
import { HeadcountReportService } from './headcount-report.service';

describe('HeadcountReportController', () => {
  let controller: HeadcountReportController;
  let service: jest.Mocked<HeadcountReportService>;

  const hrManager: RequestUser = {
    sub: 'hr-1',
    email: 'hr@acme.com',
    role: SystemRole.HR_MANAGER,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = { generate: jest.fn() } as unknown as jest.Mocked<HeadcountReportService>;
    controller = new HeadcountReportController(service);
  });

  it('delegates with organizationId/from/to filters within the route tenant', () => {
    controller.generate('tenant-1', hrManager, 'org-1', '2026-01-01', '2026-01-31');

    expect(service.generate).toHaveBeenCalledWith('tenant-1', {
      organizationId: 'org-1',
      from: '2026-01-01',
      to: '2026-01-31',
    });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.generate('tenant-2', hrManager)).toThrow(ForbiddenException);
  });
});
