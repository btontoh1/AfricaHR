import { PrismaService } from '@africahr/platform-database';
import { PlatformOperatingCostRepository } from './platform-operating-cost.repository';

describe('PlatformOperatingCostRepository', () => {
  let repository: PlatformOperatingCostRepository;
  let prisma: { platformOperatingCost: { upsert: jest.Mock; findMany: jest.Mock } };

  beforeEach(() => {
    prisma = { platformOperatingCost: { upsert: jest.fn(), findMany: jest.fn() } };
    repository = new PlatformOperatingCostRepository(prisma as unknown as PrismaService);
  });

  it('upserts a cost entry keyed by month and currency, parsing the decimal amount', async () => {
    prisma.platformOperatingCost.upsert.mockResolvedValue({
      id: 'cost-1',
      month: '2026-01',
      currency: 'GHS',
      amount: '5000.00',
      notes: 'Payroll + infra',
    });

    const result = await repository.set({
      month: '2026-01',
      currency: 'GHS',
      amount: 5000,
      notes: 'Payroll + infra',
      actorId: 'user-1',
    });

    expect(prisma.platformOperatingCost.upsert).toHaveBeenCalledWith({
      where: { month_currency: { month: '2026-01', currency: 'GHS' } },
      create: {
        month: '2026-01',
        currency: 'GHS',
        amount: 5000,
        notes: 'Payroll + infra',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      },
      update: { amount: 5000, notes: 'Payroll + infra', updatedBy: 'user-1' },
    });
    expect(result).toEqual({ id: 'cost-1', month: '2026-01', currency: 'GHS', amount: 5000, notes: 'Payroll + infra' });
  });

  it('lists cost entries newest month first', async () => {
    prisma.platformOperatingCost.findMany.mockResolvedValue([
      { id: 'cost-1', month: '2026-02', currency: 'GHS', amount: '6000.00', notes: null },
    ]);

    const result = await repository.list();

    expect(prisma.platformOperatingCost.findMany).toHaveBeenCalledWith({
      orderBy: [{ month: 'desc' }, { currency: 'asc' }],
    });
    expect(result).toEqual([{ id: 'cost-1', month: '2026-02', currency: 'GHS', amount: 6000, notes: null }]);
  });
});
