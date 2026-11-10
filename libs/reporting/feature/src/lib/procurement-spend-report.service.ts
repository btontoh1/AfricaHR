import { Injectable } from '@nestjs/common';
import { ProcurementSpendReportRepository } from '@africahr/reporting-data-access';
import { ProcurementSpendByVendorMonth, summarizeProcurementSpend } from '@africahr/reporting-domain';

export interface ProcurementSpendReportParams {
  vendorId?: string;
  from?: string;
  to?: string;
}

function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

@Injectable()
export class ProcurementSpendReportService {
  constructor(private readonly spend: ProcurementSpendReportRepository) {}

  async generate(tenantId: string, params: ProcurementSpendReportParams): Promise<ProcurementSpendByVendorMonth[]> {
    const lines = await this.spend.listSpendLines(tenantId, {
      vendorId: params.vendorId,
      from: params.from ? new Date(params.from) : undefined,
      // orderDate is a full timestamp (defaults to now()), not a
      // date-only column, so a plain `new Date('2026-11-10')` parses to
      // that day's UTC midnight and would wrongly exclude an order placed
      // later the same day. End-of-day makes the "to" boundary inclusive
      // of the whole day it names.
      to: params.to ? endOfDay(new Date(params.to)) : undefined,
    });
    return summarizeProcurementSpend(lines);
  }
}
