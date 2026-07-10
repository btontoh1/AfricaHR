import { Injectable } from '@nestjs/common';
import { LeaveUtilizationReportRepository } from '@africahr/reporting-data-access';
import { calculatePercentage } from '@africahr/reporting-domain';

export interface LeaveUtilizationReportParams {
  organizationId?: string;
  leaveTypeId?: string;
  year?: string;
}

export interface LeaveUtilizationReportEntry {
  leaveTypeId: string;
  leaveTypeName: string;
  totalEntitledDays: number;
  totalUsedDays: number;
  utilizationPercent: number;
}

@Injectable()
export class LeaveUtilizationReportService {
  constructor(private readonly leaveUtilization: LeaveUtilizationReportRepository) {}

  async generate(
    tenantId: string,
    params: LeaveUtilizationReportParams = {},
  ): Promise<LeaveUtilizationReportEntry[]> {
    const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();

    const byType = await this.leaveUtilization.summarizeByLeaveType(tenantId, {
      year,
      organizationId: params.organizationId,
      leaveTypeId: params.leaveTypeId,
    });

    return byType.map((entry) => ({
      ...entry,
      utilizationPercent: calculatePercentage(entry.totalUsedDays, entry.totalEntitledDays),
    }));
  }
}
