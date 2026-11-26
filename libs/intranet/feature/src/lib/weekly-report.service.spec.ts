import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { WeeklyReport, WeeklyReportComment } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import {
  IntranetEligibleEmployee,
  IntranetEmployeeRepository,
  WeeklyReportCommentRepository,
  WeeklyReportRepository,
  WeeklyReportTemplateRepository,
  WeeklyReportWithEmployee,
} from '@africahr/intranet-data-access';
import { WeeklyReportService } from './weekly-report.service';
import { SubmitWeeklyReportDto } from './dto/submit-weekly-report.dto';

describe('WeeklyReportService', () => {
  let service: WeeklyReportService;
  let reports: jest.Mocked<WeeklyReportRepository>;
  let comments: jest.Mocked<WeeklyReportCommentRepository>;
  let templates: jest.Mocked<WeeklyReportTemplateRepository>;
  let employees: jest.Mocked<IntranetEmployeeRepository>;
  let audit: jest.Mocked<AuditService>;

  const employee: IntranetEligibleEmployee = {
    id: 'employee-1',
    userId: 'user-1',
    organizationId: 'org-1',
    organizationUnitId: 'unit-1',
    firstName: 'Ama',
    lastName: 'Owusu',
  };

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

  function makeReport(overrides: Partial<WeeklyReport> = {}): WeeklyReport {
    return {
      id: 'report-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      weekStart: new Date('2026-11-23T00:00:00Z'),
      answers: ['did stuff', 'no problems', 'more stuff'],
      status: 'SUBMITTED',
      submittedAt: new Date('2026-11-24T00:00:00Z'),
      createdAt: new Date('2026-11-24T00:00:00Z'),
      updatedAt: new Date('2026-11-24T00:00:00Z'),
      deletedAt: null,
      createdBy: 'user-1',
      updatedBy: 'user-1',
      ...overrides,
    };
  }

  function makeReportWithEmployee(overrides: Partial<WeeklyReport> = {}): WeeklyReportWithEmployee {
    return {
      ...makeReport(overrides),
      employee: { id: 'employee-1', firstName: 'Ama', lastName: 'Owusu', organizationUnitId: 'unit-1' },
    };
  }

  function makeDto(overrides: Partial<SubmitWeeklyReportDto> = {}): SubmitWeeklyReportDto {
    return {
      weekStart: '2026-11-23',
      answers: ['did stuff', 'no problems', 'more stuff'],
      ...overrides,
    };
  }

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-25T12:00:00Z'));

    reports = {
      submit: jest.fn(),
      findById: jest.fn(),
      listForEmployee: jest.fn(),
      listForOrganizationUnit: jest.fn(),
      listForTenant: jest.fn(),
    } as unknown as jest.Mocked<WeeklyReportRepository>;

    comments = {
      create: jest.fn(),
      listForReport: jest.fn(),
    } as unknown as jest.Mocked<WeeklyReportCommentRepository>;

    templates = {
      findByOrganizationUnitId: jest.fn(),
    } as unknown as jest.Mocked<WeeklyReportTemplateRepository>;

    employees = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<IntranetEmployeeRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new WeeklyReportService(reports, comments, templates, employees, audit);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('submitForSelf', () => {
    it('rejects a caller with no linked employee record', async () => {
      employees.findByUserId.mockResolvedValue(null);

      await expect(service.submitForSelf('tenant-1', 'user-9', makeDto())).rejects.toThrow(ForbiddenException);
    });

    it('rejects a weekStart outside the current week', async () => {
      employees.findByUserId.mockResolvedValue(employee);

      await expect(service.submitForSelf('tenant-1', 'user-1', makeDto({ weekStart: '2026-11-02' }))).rejects.toThrow(
        BadRequestException,
      );
      expect(reports.submit).not.toHaveBeenCalled();
    });

    it('rejects an answer count mismatch against the department template', async () => {
      employees.findByUserId.mockResolvedValue(employee);
      templates.findByOrganizationUnitId.mockResolvedValue({
        id: 'template-1',
        tenantId: 'tenant-1',
        organizationUnitId: 'unit-1',
        questions: ['Q1', 'Q2'],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: null,
        updatedBy: null,
      });

      await expect(
        service.submitForSelf('tenant-1', 'user-1', makeDto({ answers: ['only one'] })),
      ).rejects.toThrow(BadRequestException);
    });

    it('falls back to the default questions when the department has no template', async () => {
      employees.findByUserId.mockResolvedValue(employee);
      templates.findByOrganizationUnitId.mockResolvedValue(null);
      reports.submit.mockResolvedValue(makeReport());

      await service.submitForSelf('tenant-1', 'user-1', makeDto());

      expect(reports.submit).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', employeeId: 'employee-1' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'intranet.weekly_report_submitted', resourceId: 'report-1' }),
      );
    });
  });

  describe('listForReview', () => {
    it('locks a UNIT_ADMIN to their own department', async () => {
      const actor = makeActor({ role: SystemRole.UNIT_ADMIN, organizationUnitId: 'unit-1' });
      reports.listForOrganizationUnit.mockResolvedValue([]);

      await service.listForReview('tenant-1', actor, undefined, undefined);

      expect(reports.listForOrganizationUnit).toHaveBeenCalledWith('tenant-1', 'unit-1', undefined);
    });

    it('rejects a UNIT_ADMIN requesting a different department', async () => {
      const actor = makeActor({ role: SystemRole.UNIT_ADMIN, organizationUnitId: 'unit-1' });

      await expect(service.listForReview('tenant-1', actor, 'unit-9', undefined)).rejects.toThrow(ForbiddenException);
    });

    it('gives TENANT_ADMIN the tenant-wide summary when no department is given', async () => {
      reports.listForTenant.mockResolvedValue([]);

      await service.listForReview('tenant-1', makeActor(), undefined, undefined);

      expect(reports.listForTenant).toHaveBeenCalledWith('tenant-1', undefined);
    });

    it('lets TENANT_ADMIN drill into one department', async () => {
      reports.listForOrganizationUnit.mockResolvedValue([]);

      await service.listForReview('tenant-1', makeActor(), 'unit-1', undefined);

      expect(reports.listForOrganizationUnit).toHaveBeenCalledWith('tenant-1', 'unit-1', undefined);
    });
  });

  describe('addComment', () => {
    it('rejects a UNIT_ADMIN commenting outside their department', async () => {
      reports.findById.mockResolvedValue(makeReportWithEmployee());
      const actor = makeActor({ role: SystemRole.UNIT_ADMIN, organizationUnitId: 'unit-9' });

      await expect(service.addComment('tenant-1', actor, 'report-1', 'nice work')).rejects.toThrow(ForbiddenException);
      expect(comments.create).not.toHaveBeenCalled();
    });

    it('resolves the author name via their own employee record', async () => {
      reports.findById.mockResolvedValue(makeReportWithEmployee());
      comments.create.mockResolvedValue({
        id: 'comment-1',
        tenantId: 'tenant-1',
        weeklyReportId: 'report-1',
        authorId: 'actor-1',
        body: 'nice work',
        createdAt: new Date('2026-11-25T12:00:00Z'),
      } as WeeklyReportComment);
      employees.findByUserId.mockResolvedValue({ ...employee, id: 'employee-2', firstName: 'Kwame', lastName: 'Head' });

      const result = await service.addComment('tenant-1', makeActor(), 'report-1', 'nice work');

      expect(result.authorName).toBe('Kwame Head');
    });

    it('falls back to a generic label when the author has no employee record', async () => {
      reports.findById.mockResolvedValue(makeReportWithEmployee());
      comments.create.mockResolvedValue({
        id: 'comment-1',
        tenantId: 'tenant-1',
        weeklyReportId: 'report-1',
        authorId: 'actor-1',
        body: 'nice work',
        createdAt: new Date('2026-11-25T12:00:00Z'),
      } as WeeklyReportComment);
      employees.findByUserId.mockResolvedValue(null);

      const result = await service.addComment('tenant-1', makeActor(), 'report-1', 'nice work');

      expect(result.authorName).toBe('Admin');
    });

    it('throws when the report does not exist', async () => {
      reports.findById.mockResolvedValue(null);

      await expect(service.addComment('tenant-1', makeActor(), 'missing', 'nice work')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getById', () => {
    it('flags isLate for an unsubmitted report past its week', async () => {
      reports.findById.mockResolvedValue(
        makeReportWithEmployee({ weekStart: new Date('2026-11-09T00:00:00Z'), status: 'DRAFT', submittedAt: null }),
      );

      const result = await service.getById('tenant-1', makeActor(), 'report-1');

      expect(result.isLate).toBe(true);
    });

    it('does not flag isLate for a report submitted within its week', async () => {
      reports.findById.mockResolvedValue(makeReportWithEmployee());

      const result = await service.getById('tenant-1', makeActor(), 'report-1');

      expect(result.isLate).toBe(false);
    });
  });
});
