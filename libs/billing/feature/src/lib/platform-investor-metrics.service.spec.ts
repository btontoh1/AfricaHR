import { PlatformFinancialInputRepository } from '@africahr/billing-data-access';
import { PlatformFinancialInputType } from '@prisma/client';
import { RequestUser } from '@africahr/platform-auth';
import { PlatformInvestorMetricsService } from './platform-investor-metrics.service';

describe('PlatformInvestorMetricsService', () => {
  let repository: jest.Mocked<PlatformFinancialInputRepository>;
  let service: PlatformInvestorMetricsService;
  const actor = { sub: 'user-1' } as RequestUser;

  beforeEach(() => {
    repository = { set: jest.fn(), list: jest.fn() } as unknown as jest.Mocked<PlatformFinancialInputRepository>;
    service = new PlatformInvestorMetricsService(repository);
  });

  it('sets an acquisition cost entry, attributing it to the acting user', async () => {
    repository.set.mockResolvedValue({ id: 'input-1', month: '2026-01', currency: 'GHS', amount: 1200, notes: null });

    const result = await service.setAcquisitionCost({ month: '2026-01', currency: 'GHS', amount: 1200 }, actor);

    expect(repository.set).toHaveBeenCalledWith({
      type: PlatformFinancialInputType.ACQUISITION_COST,
      month: '2026-01',
      currency: 'GHS',
      amount: 1200,
      notes: undefined,
      actorId: 'user-1',
    });
    expect(result).toEqual({ id: 'input-1', month: '2026-01', currency: 'GHS', amount: 1200, notes: null });
  });

  it('lists acquisition cost entries', async () => {
    repository.list.mockResolvedValue([{ id: 'input-1', month: '2026-01', currency: 'GHS', amount: 1200, notes: null }]);

    const result = await service.listAcquisitionCosts();

    expect(repository.list).toHaveBeenCalledWith(PlatformFinancialInputType.ACQUISITION_COST);
    expect(result).toEqual([{ id: 'input-1', month: '2026-01', currency: 'GHS', amount: 1200, notes: null }]);
  });

  it('sets a cash balance entry, attributing it to the acting user', async () => {
    repository.set.mockResolvedValue({ id: 'input-2', month: '2026-01', currency: 'GHS', amount: 50000, notes: null });

    const result = await service.setCashBalance({ month: '2026-01', currency: 'GHS', amount: 50000 }, actor);

    expect(repository.set).toHaveBeenCalledWith({
      type: PlatformFinancialInputType.CASH_BALANCE,
      month: '2026-01',
      currency: 'GHS',
      amount: 50000,
      notes: undefined,
      actorId: 'user-1',
    });
    expect(result).toEqual({ id: 'input-2', month: '2026-01', currency: 'GHS', amount: 50000, notes: null });
  });

  it('lists cash balance entries', async () => {
    repository.list.mockResolvedValue([{ id: 'input-2', month: '2026-01', currency: 'GHS', amount: 50000, notes: null }]);

    const result = await service.listCashBalances();

    expect(repository.list).toHaveBeenCalledWith(PlatformFinancialInputType.CASH_BALANCE);
    expect(result).toEqual([{ id: 'input-2', month: '2026-01', currency: 'GHS', amount: 50000, notes: null }]);
  });
});
