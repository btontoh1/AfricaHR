import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { RecruitmentPipelineReportController } from './recruitment-pipeline-report.controller';
import { RecruitmentPipelineReportService } from './recruitment-pipeline-report.service';

describe('RecruitmentPipelineReportController', () => {
  let controller: RecruitmentPipelineReportController;
  let service: jest.Mocked<RecruitmentPipelineReportService>;

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
    service = { generate: jest.fn() } as unknown as jest.Mocked<RecruitmentPipelineReportService>;
    controller = new RecruitmentPipelineReportController(service);
  });

  it('delegates with an organizationId filter within the route tenant', () => {
    controller.generate('tenant-1', hrManager, 'org-1');

    expect(service.generate).toHaveBeenCalledWith('tenant-1', { organizationId: 'org-1' });
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.generate('tenant-2', hrManager)).toThrow(ForbiddenException);
  });
});
