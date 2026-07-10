import { BadRequestException, Injectable } from '@nestjs/common';
import { PayrollCostReportRepository } from '@africahr/reporting-data-access';
import { PayrollCostSummary, summarizePayrollCosts } from '@africahr/reporting-domain';

export interface PayrollCostReportParams {
  organizationId?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class PayrollCostReportService {
  constructor(private readonly payrollCost: PayrollCostReportRepository) {}

  async generate(tenantId: string, params: PayrollCostReportParams): Promise<PayrollCostSummary> {
    if (!params.from || !params.to) {
      throw new BadRequestException('from and to query parameters are required');
    }

    const entries = await this.payrollCost.listPayslipCosts(tenantId, {
      organizationId: params.organizationId,
      from: new Date(params.from),
      to: new Date(params.to),
    });

    return summarizePayrollCosts(entries);
  }
}
