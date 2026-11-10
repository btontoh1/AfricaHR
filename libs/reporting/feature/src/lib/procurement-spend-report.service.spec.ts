import { ProcurementSpendReportRepository } from '@africahr/reporting-data-access';
import { ProcurementSpendReportService } from './procurement-spend-report.service';

describe('ProcurementSpendReportService', () => {
  let service: ProcurementSpendReportService;
  let spend: jest.Mocked<ProcurementSpendReportRepository>;

  beforeEach(() => {
    spend = { listSpendLines: jest.fn() } as unknown as jest.Mocked<ProcurementSpendReportRepository>;
    service = new ProcurementSpendReportService(spend);
  });

  it('summarizes spend lines by vendor and month', async () => {
    spend.listSpendLines.mockResolvedValue([
      { vendorId: 'v1', vendorName: 'Acme', orderDate: new Date('2026-02-05'), lineTotal: 100, purchaseOrderId: 'po-1' },
    ]);

    const result = await service.generate('tenant-1', { from: '2026-01-01', to: '2026-02-28' });

    expect(result).toEqual([{ vendorId: 'v1', vendorName: 'Acme', month: '2026-02', totalSpend: 100, orderCount: 1 }]);
    expect(spend.listSpendLines).toHaveBeenCalledWith('tenant-1', {
      vendorId: undefined,
      from: new Date('2026-01-01'),
      to: new Date('2026-02-28T23:59:59.999Z'),
    });
  });

  it('returns an empty array when there are no matching orders', async () => {
    spend.listSpendLines.mockResolvedValue([]);

    const result = await service.generate('tenant-1', {});

    expect(result).toEqual([]);
  });

  it('extends the "to" filter to end-of-day so a same-day order is not excluded', async () => {
    spend.listSpendLines.mockResolvedValue([]);

    await service.generate('tenant-1', { to: '2026-11-10' });

    const [, params] = spend.listSpendLines.mock.calls[0] as [string, { to?: Date }];
    expect(params.to).toEqual(new Date('2026-11-10T23:59:59.999Z'));
  });
});
