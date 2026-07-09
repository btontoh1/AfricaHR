import { StatutoryRate, StatutoryTaxBand } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { StatutoryRateRepository, StatutoryTaxBandRepository } from '@africahr/payroll-data-access';
import { StatutoryDataService } from './statutory-data.service';

describe('StatutoryDataService', () => {
  let service: StatutoryDataService;
  let taxBands: jest.Mocked<StatutoryTaxBandRepository>;
  let rates: jest.Mocked<StatutoryRateRepository>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(() => {
    taxBands = {
      create: jest.fn(),
      listByCountry: jest.fn(),
      findEffective: jest.fn(),
    } as unknown as jest.Mocked<StatutoryTaxBandRepository>;

    rates = {
      create: jest.fn(),
      listByCountry: jest.fn(),
      findEffective: jest.fn(),
    } as unknown as jest.Mocked<StatutoryRateRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new StatutoryDataService(taxBands, rates, audit);
  });

  it('creates a tax band and audits it with no tenant scope (platform-root data)', async () => {
    const band = { id: 'band-1' } as StatutoryTaxBand;
    taxBands.create.mockResolvedValue(band);

    await service.createTaxBand(
      {
        countryCode: 'GH',
        order: 1,
        lowerBound: 0,
        upperBound: 500,
        rate: 0,
        effectiveFrom: '2026-01-01',
      },
      'admin-1',
    );

    expect(taxBands.create).toHaveBeenCalledWith(
      expect.objectContaining({ countryCode: 'GH', order: 1, rate: 0 }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: null, actorUserId: 'admin-1', resourceId: 'band-1' }),
    );
  });

  it('creates a statutory rate and audits it with no tenant scope', async () => {
    const rate = { id: 'rate-1' } as StatutoryRate;
    rates.create.mockResolvedValue(rate);

    await service.createRate(
      { countryCode: 'GH', code: 'SSNIT_EMPLOYEE', rate: 0.055, effectiveFrom: '2026-01-01' },
      'admin-1',
    );

    expect(rates.create).toHaveBeenCalledWith(
      expect.objectContaining({ countryCode: 'GH', code: 'SSNIT_EMPLOYEE', rate: 0.055 }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: null, resourceId: 'rate-1' }),
    );
  });

  it('lists tax bands and rates by country', async () => {
    await service.listTaxBands('GH');
    await service.listRates('GH');

    expect(taxBands.listByCountry).toHaveBeenCalledWith('GH');
    expect(rates.listByCountry).toHaveBeenCalledWith('GH');
  });
});
