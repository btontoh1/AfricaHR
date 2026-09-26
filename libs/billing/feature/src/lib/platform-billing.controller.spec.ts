import { PlatformBillingController } from './platform-billing.controller';
import { PlatformBillingService } from './platform-billing.service';
import { PlatformSaasMetricsService } from './platform-saas-metrics.service';

describe('PlatformBillingController', () => {
  let controller: PlatformBillingController;
  let service: jest.Mocked<PlatformBillingService>;
  let saasMetrics: jest.Mocked<PlatformSaasMetricsService>;

  beforeEach(() => {
    service = { getSummary: jest.fn() } as unknown as jest.Mocked<PlatformBillingService>;
    saasMetrics = { getSaasMetrics: jest.fn() } as unknown as jest.Mocked<PlatformSaasMetricsService>;
    controller = new PlatformBillingController(service, saasMetrics);
  });

  it('delegates getSummary to PlatformBillingService', () => {
    controller.getSummary();

    expect(service.getSummary).toHaveBeenCalled();
  });

  it('delegates getSaasMetrics to PlatformSaasMetricsService', () => {
    controller.getSaasMetrics();

    expect(saasMetrics.getSaasMetrics).toHaveBeenCalled();
  });
});
