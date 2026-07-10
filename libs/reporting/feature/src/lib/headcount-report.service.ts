import { Injectable } from '@nestjs/common';
import {
  HeadcountByEmploymentType,
  HeadcountByOrganizationUnit,
  HeadcountReportRepository,
} from '@africahr/reporting-data-access';

export interface HeadcountReportParams {
  organizationId?: string;
  from?: string;
  to?: string;
}

export interface HeadcountReport {
  activeCount: number;
  byEmploymentType: HeadcountByEmploymentType[];
  byOrganizationUnit: HeadcountByOrganizationUnit[];
  /** Only present when both from and to are supplied. */
  hiresInPeriod?: number;
  terminationsInPeriod?: number;
}

@Injectable()
export class HeadcountReportService {
  constructor(private readonly headcount: HeadcountReportRepository) {}

  async generate(tenantId: string, params: HeadcountReportParams = {}): Promise<HeadcountReport> {
    const { organizationId } = params;

    const [activeCount, byEmploymentType, byOrganizationUnit] = await Promise.all([
      this.headcount.countActive(tenantId, { organizationId }),
      this.headcount.countByEmploymentType(tenantId, { organizationId }),
      this.headcount.countByOrganizationUnit(tenantId, { organizationId }),
    ]);

    const report: HeadcountReport = { activeCount, byEmploymentType, byOrganizationUnit };

    if (params.from && params.to) {
      const from = new Date(params.from);
      const to = new Date(params.to);
      const [hiresInPeriod, terminationsInPeriod] = await Promise.all([
        this.headcount.countHiresInPeriod(tenantId, { organizationId, from, to }),
        this.headcount.countTerminationsInPeriod(tenantId, { organizationId, from, to }),
      ]);
      report.hiresInPeriod = hiresInPeriod;
      report.terminationsInPeriod = terminationsInPeriod;
    }

    return report;
  }
}
