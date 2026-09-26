import { PlatformOperatingCostRepository } from '@africahr/billing-data-access';
import { RequestUser } from '@africahr/platform-auth';
import { PlatformOperatingCostService } from './platform-operating-cost.service';

describe('PlatformOperatingCostService', () => {
  let repository: jest.Mocked<PlatformOperatingCostRepository>;
  let service: PlatformOperatingCostService;
  const actor = { sub: 'user-1' } as RequestUser;

  beforeEach(() => {
    repository = { set: jest.fn(), list: jest.fn() } as unknown as jest.Mocked<PlatformOperatingCostRepository>;
    service = new PlatformOperatingCostService(repository);
  });

  it('sets a cost entry, attributing it to the acting user', async () => {
    repository.set.mockResolvedValue({ id: 'cost-1', month: '2026-01', currency: 'GHS', amount: 5000, notes: null });

    const result = await service.setCost({ month: '2026-01', currency: 'GHS', amount: 5000 }, actor);

    expect(repository.set).toHaveBeenCalledWith({
      month: '2026-01',
      currency: 'GHS',
      amount: 5000,
      notes: undefined,
      actorId: 'user-1',
    });
    expect(result).toEqual({ id: 'cost-1', month: '2026-01', currency: 'GHS', amount: 5000, notes: null });
  });

  it('lists cost entries', async () => {
    repository.list.mockResolvedValue([{ id: 'cost-1', month: '2026-01', currency: 'GHS', amount: 5000, notes: null }]);

    const result = await service.listCosts();

    expect(result).toEqual([{ id: 'cost-1', month: '2026-01', currency: 'GHS', amount: 5000, notes: null }]);
  });
});
