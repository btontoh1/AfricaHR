import { BadRequestException, Injectable } from '@nestjs/common';
import { AttendanceReportRepository, AttendanceSummary } from '@africahr/reporting-data-access';

export interface AttendanceReportParams {
  organizationId?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class AttendanceReportService {
  constructor(private readonly attendance: AttendanceReportRepository) {}

  async generate(tenantId: string, params: AttendanceReportParams): Promise<AttendanceSummary> {
    if (!params.from || !params.to) {
      throw new BadRequestException('from and to query parameters are required');
    }

    return this.attendance.summarize(tenantId, {
      organizationId: params.organizationId,
      from: new Date(params.from),
      to: new Date(params.to),
    });
  }
}
