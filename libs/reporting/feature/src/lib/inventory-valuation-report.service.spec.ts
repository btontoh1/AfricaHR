import { InventoryValuationReportRepository } from '@africahr/reporting-data-access';
import { InventoryValuationReportService } from './inventory-valuation-report.service';

describe('InventoryValuationReportService', () => {
  let service: InventoryValuationReportService;
  let valuation: jest.Mocked<InventoryValuationReportRepository>;

  beforeEach(() => {
    valuation = { listValuation: jest.fn() } as unknown as jest.Mocked<InventoryValuationReportRepository>;
    service = new InventoryValuationReportService(valuation);
  });

  it('returns a zero grand total for no stock on hand', async () => {
    valuation.listValuation.mockResolvedValue([]);

    const result = await service.generate('tenant-1', {});

    expect(result).toEqual({ rows: [], grandTotal: 0 });
  });

  it('sums totalValue across rows into a grand total', async () => {
    valuation.listValuation.mockResolvedValue([
      {
        warehouseId: 'wh-1',
        warehouseName: 'Main',
        productId: 'p1',
        productSku: 'SKU-1',
        productName: 'Item 1',
        quantity: 10,
        unitCost: 5,
        totalValue: 50,
      },
      {
        warehouseId: 'wh-1',
        warehouseName: 'Main',
        productId: 'p2',
        productSku: 'SKU-2',
        productName: 'Item 2',
        quantity: 4,
        unitCost: 25,
        totalValue: 100,
      },
    ] as never);

    const result = await service.generate('tenant-1', { warehouseId: 'wh-1' });

    expect(result.grandTotal).toBe(150);
    expect(valuation.listValuation).toHaveBeenCalledWith('tenant-1', { warehouseId: 'wh-1' });
  });
});
