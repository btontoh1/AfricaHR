import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { StatutoryController } from './statutory.controller';
import { StatutoryDataService } from './statutory-data.service';

describe('StatutoryController', () => {
  let controller: StatutoryController;
  let service: jest.Mocked<StatutoryDataService>;

  const platformAdmin: RequestUser = {
    sub: 'admin-1',
    email: 'admin@africahr.local',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      createTaxBand: jest.fn(),
      listTaxBands: jest.fn(),
      createRate: jest.fn(),
      listRates: jest.fn(),
    } as unknown as jest.Mocked<StatutoryDataService>;

    controller = new StatutoryController(service);
  });

  it('delegates tax band creation with the actor id', () => {
    const dto = {
      countryCode: 'GH',
      order: 1,
      lowerBound: 0,
      upperBound: 500,
      rate: 0,
      effectiveFrom: '2026-01-01',
    } as never;

    controller.createTaxBand(dto, platformAdmin);

    expect(service.createTaxBand).toHaveBeenCalledWith(dto, 'admin-1');
  });

  it('delegates tax band listing by country', () => {
    controller.listTaxBands('GH');

    expect(service.listTaxBands).toHaveBeenCalledWith('GH');
  });

  it('delegates rate creation with the actor id', () => {
    const dto = { countryCode: 'GH', code: 'SSNIT_EMPLOYEE', rate: 0.055, effectiveFrom: '2026-01-01' } as never;

    controller.createRate(dto, platformAdmin);

    expect(service.createRate).toHaveBeenCalledWith(dto, 'admin-1');
  });

  it('delegates rate listing by country', () => {
    controller.listRates('GH');

    expect(service.listRates).toHaveBeenCalledWith('GH');
  });
});
