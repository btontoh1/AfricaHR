import { RequestUser } from '@africahr/platform-auth';
import { PlatformBillingController } from './platform-billing.controller';
import { PlatformBillingService } from './platform-billing.service';
import { PlatformSaasMetricsService } from './platform-saas-metrics.service';
import { PlatformOperatingCostService } from './platform-operating-cost.service';
import { PlatformInvestorMetricsService } from './platform-investor-metrics.service';

describe('PlatformBillingController', () => {
  let controller: PlatformBillingController;
  let service: jest.Mocked<PlatformBillingService>;
  let saasMetrics: jest.Mocked<PlatformSaasMetricsService>;
  let operatingCosts: jest.Mocked<PlatformOperatingCostService>;
  let investorMetrics: jest.Mocked<PlatformInvestorMetricsService>;
  const actor = { sub: 'user-1' } as RequestUser;

  beforeEach(() => {
    service = { getSummary: jest.fn() } as unknown as jest.Mocked<PlatformBillingService>;
    saasMetrics = { getSaasMetrics: jest.fn() } as unknown as jest.Mocked<PlatformSaasMetricsService>;
    operatingCosts = {
      setCost: jest.fn(),
      listCosts: jest.fn(),
    } as unknown as jest.Mocked<PlatformOperatingCostService>;
    investorMetrics = {
      setAcquisitionCost: jest.fn(),
      listAcquisitionCosts: jest.fn(),
      setCashBalance: jest.fn(),
      listCashBalances: jest.fn(),
    } as unknown as jest.Mocked<PlatformInvestorMetricsService>;
    controller = new PlatformBillingController(service, saasMetrics, operatingCosts, investorMetrics);
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

  it('delegates listAcquisitionCosts to PlatformInvestorMetricsService', () => {
    controller.listAcquisitionCosts();

    expect(investorMetrics.listAcquisitionCosts).toHaveBeenCalled();
  });

  it('delegates setAcquisitionCost to PlatformInvestorMetricsService with the acting user', () => {
    const dto = { month: '2026-01', currency: 'GHS', amount: 1200 };

    controller.setAcquisitionCost(dto, actor);

    expect(investorMetrics.setAcquisitionCost).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates listCashBalances to PlatformInvestorMetricsService', () => {
    controller.listCashBalances();

    expect(investorMetrics.listCashBalances).toHaveBeenCalled();
  });

  it('delegates setCashBalance to PlatformInvestorMetricsService with the acting user', () => {
    const dto = { month: '2026-01', currency: 'GHS', amount: 50000 };

    controller.setCashBalance(dto, actor);

    expect(investorMetrics.setCashBalance).toHaveBeenCalledWith(dto, actor);
  });
});
