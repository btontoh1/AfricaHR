import { Injectable } from '@nestjs/common';
import { LowStockReportRepository, LowStockRow } from '@africahr/reporting-data-access';

export interface LowStockReportParams {
  warehouseId?: string;
}

@Injectable()
export class LowStockReportService {
  constructor(private readonly lowStock: LowStockReportRepository) {}

  generate(tenantId: string, params: LowStockReportParams): Promise<LowStockRow[]> {
    return this.lowStock.listLowStock(tenantId, { warehouseId: params.warehouseId });
  }
}
