import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { WeeklyReportTemplateRepository } from '@africahr/intranet-data-access';
import { WeeklyReportTemplateService } from './weekly-report-template.service';

describe('WeeklyReportTemplateService', () => {
  let service: WeeklyReportTemplateService;
  let templates: jest.Mocked<WeeklyReportTemplateRepository>;

  function makeActor(overrides: Partial<RequestUser> = {}): RequestUser {
    return {
      sub: 'actor-1',
      email: 'actor@test.com',
      role: SystemRole.TENANT_ADMIN,
      tenantId: 'tenant-1',
      organizationId: null,
      organizationUnitId: null,
      iat: 0,
      exp: 0,
      ...overrides,
    };
  }

  beforeEach(() => {
    templates = {
      findByOrganizationUnitId: jest.fn(),
      listAll: jest.fn(),
      upsert: jest.fn(),
      organizationUnitExistsInTenant: jest.fn(),
    } as unknown as jest.Mocked<WeeklyReportTemplateRepository>;

    service = new WeeklyReportTemplateService(templates);
  });

  describe('upsert', () => {
    it('rejects a UNIT_ADMIN even though it holds WEEKLY_REPORT_MANAGE', async () => {
      const actor = makeActor({ role: SystemRole.UNIT_ADMIN, organizationUnitId: 'unit-1' });

      await expect(service.upsert('tenant-1', 'unit-1', ['Q1'], actor)).rejects.toThrow(ForbiddenException);
      expect(templates.upsert).not.toHaveBeenCalled();
    });

    it('rejects an organizationUnitId outside the tenant', async () => {
      templates.organizationUnitExistsInTenant.mockResolvedValue(false);

      await expect(service.upsert('tenant-1', 'unit-9', ['Q1'], makeActor())).rejects.toThrow(NotFoundException);
    });

    it('upserts for a TENANT_ADMIN', async () => {
      templates.organizationUnitExistsInTenant.mockResolvedValue(true);
      templates.upsert.mockResolvedValue({
        id: 'template-1',
        tenantId: 'tenant-1',
        organizationUnitId: 'unit-1',
        questions: ['Q1', 'Q2'],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: 'actor-1',
        updatedBy: 'actor-1',
      });

      const result = await service.upsert('tenant-1', 'unit-1', ['Q1', 'Q2'], makeActor());

      expect(result).toEqual({ organizationUnitId: 'unit-1', questions: ['Q1', 'Q2'], isDefault: false });
    });
  });

  describe('getForOrganizationUnit', () => {
    it('falls back to the default questions when no template exists', async () => {
      templates.findByOrganizationUnitId.mockResolvedValue(null);

      const result = await service.getForOrganizationUnit('tenant-1', 'unit-1');

      expect(result.isDefault).toBe(true);
      expect(result.questions.length).toBeGreaterThan(0);
    });
  });
});
