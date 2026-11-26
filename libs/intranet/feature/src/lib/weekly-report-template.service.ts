import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_WEEKLY_REPORT_QUESTIONS } from '@africahr/intranet-domain';
import { WeeklyReportTemplateRepository } from '@africahr/intranet-data-access';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { WeeklyReportTemplateResponseDto } from './dto/weekly-report-template-response.dto';

@Injectable()
export class WeeklyReportTemplateService {
  constructor(private readonly templates: WeeklyReportTemplateRepository) {}

  async upsert(
    tenantId: string,
    organizationUnitId: string,
    questions: string[],
    actor: RequestUser,
  ): Promise<WeeklyReportTemplateResponseDto> {
    // "Group HR uploads policy documents... set up... departments" per the
    // project plan - form setup is a group-level job, not a department
    // head's, even though UNIT_ADMIN holds WEEKLY_REPORT_MANAGE too (for
    // reviewing/commenting on their own team's reports).
    if (actor.role === SystemRole.UNIT_ADMIN) {
      throw new ForbiddenException('Department heads cannot edit the weekly report form');
    }

    const belongsToTenant = await this.templates.organizationUnitExistsInTenant(tenantId, organizationUnitId);
    if (!belongsToTenant) {
      throw new NotFoundException(`Organization unit "${organizationUnitId}" not found`);
    }

    const template = await this.templates.upsert({ tenantId, organizationUnitId, questions, actorId: actor.sub });
    return { organizationUnitId, questions: template.questions as string[], isDefault: false };
  }

  async getForOrganizationUnit(tenantId: string, organizationUnitId: string): Promise<WeeklyReportTemplateResponseDto> {
    const template = await this.templates.findByOrganizationUnitId(tenantId, organizationUnitId);
    if (template) {
      return { organizationUnitId, questions: template.questions as string[], isDefault: false };
    }
    return { organizationUnitId, questions: [...DEFAULT_WEEKLY_REPORT_QUESTIONS], isDefault: true };
  }

  async listAll(tenantId: string): Promise<WeeklyReportTemplateResponseDto[]> {
    const templates = await this.templates.listAll(tenantId);
    return templates.map((template) => ({
      organizationUnitId: template.organizationUnitId,
      questions: template.questions as string[],
      isDefault: false,
    }));
  }
}
