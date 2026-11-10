import { LowStockReportRepository } from '@africahr/reporting-data-access';
import { LowStockReportService } from './low-stock-report.service';

describe('LowStockReportService', () => {
  let service: LowStockReportService;
  let lowStock: jest.Mocked<LowStockReportRepository>;

  beforeEach(() => {
    lowStock = { listLowStock: jest.fn() } as unknown as jest.Mocked<LowStockReportRepository>;
    service = new LowStockReportService(lowStock);
  });

  it('delegates to the repository with the warehouse filter', async () => {
    lowStock.listLowStock.mockResolvedValue([]);

    const result = await service.generate('tenant-1', { warehouseId: 'wh-1' });

    expect(result).toEqual([]);
    expect(lowStock.listLowStock).toHaveBeenCalledWith('tenant-1', { warehouseId: 'wh-1' });
  });
});
