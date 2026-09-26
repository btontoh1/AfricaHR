import { RequestUser } from '@africahr/platform-auth';
import { PlatformBillingController } from './platform-billing.controller';
import { PlatformBillingService } from './platform-billing.service';
import { PlatformSaasMetricsService } from './platform-saas-metrics.service';
import { PlatformOperatingCostService } from './platform-operating-cost.service';

describe('PlatformBillingController', () => {
  let controller: PlatformBillingController;
  let service: jest.Mocked<PlatformBillingService>;
  let saasMetrics: jest.Mocked<PlatformSaasMetricsService>;
  let operatingCosts: jest.Mocked<PlatformOperatingCostService>;
  const actor = { sub: 'user-1' } as RequestUser;

  beforeEach(() => {
    service = { getSummary: jest.fn() } as unknown as jest.Mocked<PlatformBillingService>;
    saasMetrics = { getSaasMetrics: jest.fn() } as unknown as jest.Mocked<PlatformSaasMetricsService>;
    operatingCosts = {
      setCost: jest.fn(),
      listCosts: jest.fn(),
    } as unknown as jest.Mocked<PlatformOperatingCostService>;
    controller = new PlatformBillingController(service, saasMetrics, operatingCosts);
  });

  it('delegates getSummary to PlatformBillingService', () => {
    controller.getSummary();

    expect(service.getSummary).toHaveBeenCalled();
  });

  it('delegates getSaasMetrics to PlatformSaasMetricsService', () => {
    controller.getSaasMetrics();

    expect(saasMetrics.getSaasMetrics).toHaveBeenCalled();
  });

  it('delegates listOperatingCosts to PlatformOperatingCostService', () => {
    controller.listOperatingCosts();

    expect(operatingCosts.listCosts).toHaveBeenCalled();
  });

  it('delegates setOperatingCost to PlatformOperatingCostService with the acting user', () => {
    const dto = { month: '2026-01', currency: 'GHS', amount: 5000 };

    controller.setOperatingCost(dto, actor);

    expect(operatingCosts.setCost).toHaveBeenCalledWith(dto, actor);
  });
});
