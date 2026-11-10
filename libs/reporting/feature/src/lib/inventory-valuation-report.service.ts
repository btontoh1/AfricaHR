import { Injectable } from '@nestjs/common';
import { InventoryValuationReportRepository } from '@africahr/reporting-data-access';
import { InventoryValuationReportDto } from './dto/inventory-valuation-report-response.dto';

export interface InventoryValuationReportParams {
  warehouseId?: string;
}

@Injectable()
export class InventoryValuationReportService {
  constructor(private readonly valuation: InventoryValuationReportRepository) {}

  async generate(tenantId: string, params: InventoryValuationReportParams): Promise<InventoryValuationReportDto> {
    const rows = await this.valuation.listValuation(tenantId, { warehouseId: params.warehouseId });
    const grandTotal = rows.reduce((sum, row) => sum + row.totalValue, 0);
    return { rows, grandTotal };
  }
}
