import { PrismaService } from '@africahr/platform-database';
import { StatutoryTaxBandRepository } from './statutory-tax-band.repository';

describe('StatutoryTaxBandRepository', () => {
  let repository: StatutoryTaxBandRepository;
  let prisma: { statutoryTaxBand: { create: jest.Mock; findMany: jest.Mock } };

  beforeEach(() => {
    prisma = { statutoryTaxBand: { create: jest.fn(), findMany: jest.fn() } };
    repository = new StatutoryTaxBandRepository(prisma as unknown as PrismaService);
  });

  it('creates a band without going through tenant context (platform-root data)', async () => {
    const effectiveFrom = new Date('2026-01-01');

    await repository.create({
      countryCode: 'GH',
      order: 1,
      lowerBound: 0,
      upperBound: 500,
      rate: 0,
      effectiveFrom,
      createdBy: 'admin-1',
    });

    expect(prisma.statutoryTaxBand.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ countryCode: 'GH', order: 1, rate: 0, effectiveFrom }),
    });
  });

  it('finds effective bands as of a point in time, ascending by order', async () => {
    const asOf = new Date('2026-06-01');

    await repository.findEffective('GH', asOf);

    expect(prisma.statutoryTaxBand.findMany).toHaveBeenCalledWith({
      where: {
        countryCode: 'GH',
        effectiveFrom: { lte: asOf },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: asOf } }],
      },
      orderBy: { order: 'asc' },
    });
  });
});
