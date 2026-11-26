import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { WeeklyReport } from '@prisma/client';
import { DEFAULT_WEEKLY_REPORT_QUESTIONS, getWeekStart, isReportLate } from '@africahr/intranet-domain';
import {
  IntranetEligibleEmployee,
  IntranetEmployeeRepository,
  WeeklyReportCommentRepository,
  WeeklyReportEmployee,
  WeeklyReportRepository,
  WeeklyReportTemplateRepository,
  WeeklyReportWithEmployee,
} from '@africahr/intranet-data-access';
import { assertOrganizationUnitScope, RequestUser, SystemRole } from '@africahr/platform-auth';
import { AuditService } from '@africahr/platform-audit';
import { SubmitWeeklyReportDto } from './dto/submit-weekly-report.dto';
import { WeeklyReportResponseDto } from './dto/weekly-report-response.dto';
import { WeeklyReportCommentResponseDto } from './dto/weekly-report-comment-response.dto';

@Injectable()
export class WeeklyReportService {
  constructor(
    private readonly reports: WeeklyReportRepository,
    private readonly comments: WeeklyReportCommentRepository,
    private readonly templates: WeeklyReportTemplateRepository,
    private readonly employees: IntranetEmployeeRepository,
    private readonly audit: AuditService,
  ) {}

  async getMyTemplateQuestions(tenantId: string, userId: string): Promise<string[]> {
    const employee = await this.requireEmployee(tenantId, userId);
    return this.questionsForUnit(tenantId, employee.organizationUnitId);
  }

  async submitForSelf(tenantId: string, userId: string, dto: SubmitWeeklyReportDto): Promise<WeeklyReportResponseDto> {
    const employee = await this.requireEmployee(tenantId, userId);

    const weekStart = getWeekStart(new Date(dto.weekStart));
    const currentWeekStart = getWeekStart(new Date());
    if (weekStart.getTime() !== currentWeekStart.getTime()) {
      throw new BadRequestException('You can only submit a report for the current week');
    }

    const questions = await this.questionsForUnit(tenantId, employee.organizationUnitId);
    if (dto.answers.length !== questions.length) {
      throw new BadRequestException(`Expected ${questions.length} answers, got ${dto.answers.length}`);
    }

    const report = await this.reports.submit({
      tenantId,
      employeeId: employee.id,
      weekStart,
      answers: dto.answers,
      actorId: userId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: userId,
      action: 'intranet.weekly_report_submitted',
      resourceType: 'WeeklyReport',
      resourceId: report.id,
    });

    return this.toDto(report);
  }

  async listForSelf(tenantId: string, userId: string): Promise<WeeklyReportResponseDto[]> {
    const employee = await this.requireEmployee(tenantId, userId);
    const reports = await this.reports.listForEmployee(tenantId, employee.id);
    return reports.map((report) => this.toDto(report));
  }

  /**
   * Head/tenant-wide listing. A UNIT_ADMIN is locked to their own
   * department (matches "department head: their own team's reports"); any
   * other WEEKLY_REPORT_MANAGE holder may pass organizationUnitId to drill
   * into one department, or omit it for the tenant-wide summary ("group
   * management sees a summary across all companies").
   */
  async listForReview(
    tenantId: string,
    actor: RequestUser,
    organizationUnitId: string | undefined,
    weekStartInput: string | undefined,
  ): Promise<WeeklyReportResponseDto[]> {
    const weekStart = weekStartInput ? getWeekStart(new Date(weekStartInput)) : undefined;

    if (actor.role === SystemRole.UNIT_ADMIN) {
      const ownUnitId = actor.organizationUnitId ?? '';
      if (organizationUnitId && organizationUnitId !== ownUnitId) {
        throw new ForbiddenException("Cannot view another department's reports");
      }
      const reports = await this.reports.listForOrganizationUnit(tenantId, ownUnitId, weekStart);
      return reports.map((report) => this.toDto(report, report.employee));
    }

    if (organizationUnitId) {
      const reports = await this.reports.listForOrganizationUnit(tenantId, organizationUnitId, weekStart);
      return reports.map((report) => this.toDto(report, report.employee));
    }

    const reports = await this.reports.listForTenant(tenantId, weekStart);
    return reports.map((report) => this.toDto(report, report.employee));
  }

  async getById(tenantId: string, actor: RequestUser, id: string): Promise<WeeklyReportResponseDto> {
    const report = await this.requireReportWithAccess(tenantId, actor, id);
    return this.toDto(report, report.employee);
  }

  async addComment(tenantId: string, actor: RequestUser, id: string, body: string): Promise<WeeklyReportCommentResponseDto> {
    const report = await this.requireReportWithAccess(tenantId, actor, id);
    const comment = await this.comments.create(tenantId, report.id, actor.sub, body);
    const authorName = await this.resolveAuthorName(tenantId, actor.sub);
    return { id: comment.id, authorName, body: comment.body, createdAt: comment.createdAt.toISOString() };
  }

  async listComments(tenantId: string, actor: RequestUser, id: string): Promise<WeeklyReportCommentResponseDto[]> {
    const report = await this.requireReportWithAccess(tenantId, actor, id);
    const comments = await this.comments.listForReport(tenantId, report.id);
    return Promise.all(
      comments.map(async (comment) => ({
        id: comment.id,
        authorName: await this.resolveAuthorName(tenantId, comment.authorId),
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
      })),
    );
  }

  private async questionsForUnit(tenantId: string, organizationUnitId: string | null): Promise<string[]> {
    if (!organizationUnitId) {
      return [...DEFAULT_WEEKLY_REPORT_QUESTIONS];
    }
    const template = await this.templates.findByOrganizationUnitId(tenantId, organizationUnitId);
    return template ? (template.questions as string[]) : [...DEFAULT_WEEKLY_REPORT_QUESTIONS];
  }

  private async requireEmployee(tenantId: string, userId: string): Promise<IntranetEligibleEmployee> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record linked to this account');
    }
    return employee;
  }

  private async requireReportWithAccess(
    tenantId: string,
    actor: RequestUser,
    id: string,
  ): Promise<WeeklyReportWithEmployee> {
    const report = await this.reports.findById(tenantId, id);
    if (!report) {
      throw new NotFoundException(`Weekly report "${id}" not found`);
    }
    if (actor.role === SystemRole.UNIT_ADMIN) {
      assertOrganizationUnitScope(actor, report.employee.organizationUnitId ?? '');
    }
    return report;
  }

  /** Falls back to a generic label when the author holds no Employee record (e.g. an external Tenant Admin). */
  private async resolveAuthorName(tenantId: string, userId: string): Promise<string> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Admin';
  }

  private toDto(report: WeeklyReport, employee?: WeeklyReportEmployee): WeeklyReportResponseDto {
    return {
      id: report.id,
      employeeId: report.employeeId,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : undefined,
      organizationUnitId: employee ? employee.organizationUnitId : undefined,
      weekStart: report.weekStart.toISOString().slice(0, 10),
      answers: report.answers as string[],
      status: report.status,
      submittedAt: report.submittedAt ? report.submittedAt.toISOString() : null,
      isLate: isReportLate(report.weekStart, report.submittedAt, new Date()),
      createdAt: report.createdAt.toISOString(),
    };
  }
}
