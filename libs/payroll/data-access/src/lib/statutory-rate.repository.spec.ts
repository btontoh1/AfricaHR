import { PrismaService } from '@africahr/platform-database';
import { StatutoryRateRepository } from './statutory-rate.repository';

describe('StatutoryRateRepository', () => {
  let repository: StatutoryRateRepository;
  let prisma: { statutoryRate: { create: jest.Mock; findFirst: jest.Mock } };

  beforeEach(() => {
    prisma = { statutoryRate: { create: jest.fn(), findFirst: jest.fn() } };
    repository = new StatutoryRateRepository(prisma as unknown as PrismaService);
  });

  it('creates a rate without going through tenant context (platform-root data)', async () => {
    const effectiveFrom = new Date('2026-01-01');

    await repository.create({
      countryCode: 'GH',
      code: 'SSNIT_EMPLOYEE',
      rate: 0.055,
      effectiveFrom,
      createdBy: 'admin-1',
    });

    expect(prisma.statutoryRate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ countryCode: 'GH', code: 'SSNIT_EMPLOYEE', rate: 0.055 }),
    });
  });

  it('finds the most recent effective rate for a country/code as of a point in time', async () => {
    const asOf = new Date('2026-06-01');

    await repository.findEffective('GH', 'SSNIT_EMPLOYEE', asOf);

    expect(prisma.statutoryRate.findFirst).toHaveBeenCalledWith({
      where: {
        countryCode: 'GH',
        code: 'SSNIT_EMPLOYEE',
        effectiveFrom: { lte: asOf },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: asOf } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  });
});
