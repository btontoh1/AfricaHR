import { Injectable } from '@nestjs/common';
import { ProcurementSpendReportRepository } from '@africahr/reporting-data-access';
import { ProcurementSpendByVendorMonth, summarizeProcurementSpend } from '@africahr/reporting-domain';

export interface ProcurementSpendReportParams {
  vendorId?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class ProcurementSpendReportService {
  constructor(private readonly spend: ProcurementSpendReportRepository) {}

  async generate(tenantId: string, params: ProcurementSpendReportParams): Promise<ProcurementSpendByVendorMonth[]> {
    const lines = await this.spend.listSpendLines(tenantId, {
      vendorId: params.vendorId,
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
    });
    return summarizeProcurementSpend(lines);
  }
}
