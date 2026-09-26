import { PrismaService } from '@africahr/platform-database';
import { PlatformFinancialInputType } from '@prisma/client';
import { PlatformFinancialInputRepository } from './platform-financial-input.repository';

describe('PlatformFinancialInputRepository', () => {
  let repository: PlatformFinancialInputRepository;
  let prisma: { platformFinancialInput: { upsert: jest.Mock; findMany: jest.Mock } };

  beforeEach(() => {
    prisma = { platformFinancialInput: { upsert: jest.fn(), findMany: jest.fn() } };
    repository = new PlatformFinancialInputRepository(prisma as unknown as PrismaService);
  });

  it('upserts an entry keyed by type, month, and currency, parsing the decimal amount', async () => {
    prisma.platformFinancialInput.upsert.mockResolvedValue({
      id: 'input-1',
      month: '2026-01',
      currency: 'GHS',
      amount: '1200.00',
      notes: 'Ads + sales salaries',
    });

    const result = await repository.set({
      type: PlatformFinancialInputType.ACQUISITION_COST,
      month: '2026-01',
      currency: 'GHS',
      amount: 1200,
      notes: 'Ads + sales salaries',
      actorId: 'user-1',
    });

    expect(prisma.platformFinancialInput.upsert).toHaveBeenCalledWith({
      where: {
        type_month_currency: { type: PlatformFinancialInputType.ACQUISITION_COST, month: '2026-01', currency: 'GHS' },
      },
      create: {
        type: PlatformFinancialInputType.ACQUISITION_COST,
        month: '2026-01',
        currency: 'GHS',
        amount: 1200,
        notes: 'Ads + sales salaries',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      },
      update: { amount: 1200, notes: 'Ads + sales salaries', updatedBy: 'user-1' },
    });
    expect(result).toEqual({ id: 'input-1', month: '2026-01', currency: 'GHS', amount: 1200, notes: 'Ads + sales salaries' });
  });

  it('lists entries of one type, newest month first', async () => {
    prisma.platformFinancialInput.findMany.mockResolvedValue([
      { id: 'input-1', month: '2026-02', currency: 'GHS', amount: '9000.00', notes: null },
    ]);

    const result = await repository.list(PlatformFinancialInputType.CASH_BALANCE);

    expect(prisma.platformFinancialInput.findMany).toHaveBeenCalledWith({
      where: { type: PlatformFinancialInputType.CASH_BALANCE },
      orderBy: [{ month: 'desc' }, { currency: 'asc' }],
    });
    expect(result).toEqual([{ id: 'input-1', month: '2026-02', currency: 'GHS', amount: 9000, notes: null }]);
  });
});
