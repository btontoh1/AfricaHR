import { PlatformBillingRepository } from '@africahr/billing-data-access';
import { PlatformBillingService } from './platform-billing.service';

describe('PlatformBillingService', () => {
  let service: PlatformBillingService;
  let repository: jest.Mocked<PlatformBillingRepository>;

  beforeEach(() => {
    repository = {
      listAllSubscriptions: jest.fn(),
      listActiveEmployeeCounts: jest.fn(),
      getRevenueByCurrency: jest.fn(),
      listTenantNames: jest.fn(),
    } as unknown as jest.Mocked<PlatformBillingRepository>;

    service = new PlatformBillingService(repository);
  });

  it('computes MRR from active subscriptions weighted by current headcount, ignoring cancelled ones', async () => {
    const now = new Date();
    const farFuture = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    repository.listAllSubscriptions.mockResolvedValue([
      {
        id: 'sub-1',
        tenantId: 'tenant-1',
        pricePerEmployee: 10,
        currency: 'GHS',
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: farFuture,
        cancelAtPeriodEnd: false,
        paystackCustomerCode: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'sub-2',
        tenantId: 'tenant-2',
        pricePerEmployee: 5,
        currency: 'GHS',
        status: 'CANCELLED',
        currentPeriodStart: now,
        currentPeriodEnd: farFuture,
        cancelAtPeriodEnd: false,
        paystackCustomerCode: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    repository.listActiveEmployeeCounts.mockResolvedValue(new Map([['tenant-1', 20], ['tenant-2', 100]]));
    repository.getRevenueByCurrency.mockResolvedValue([{ currency: 'GHS', totalPaid: 5000 }]);
    repository.listTenantNames.mockResolvedValue(new Map());

    const result = await service.getSummary();

    expect(result.mrr).toEqual([{ currency: 'GHS', amount: 200 }]);
    expect(result.platformRevenue).toEqual([{ currency: 'GHS', amount: 5000 }]);
    expect(result.expiringSubscriptions).toEqual([]);
  });

  it('lists active subscriptions expiring within the next 7 days, with tenant names attached', async () => {
    const now = new Date();
    const soon = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    repository.listAllSubscriptions.mockResolvedValue([
      {
        id: 'sub-1',
        tenantId: 'tenant-1',
        pricePerEmployee: 10,
        currency: 'GHS',
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: soon,
        cancelAtPeriodEnd: false,
        paystackCustomerCode: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    repository.listActiveEmployeeCounts.mockResolvedValue(new Map([['tenant-1', 20]]));
    repository.getRevenueByCurrency.mockResolvedValue([]);
    repository.listTenantNames.mockResolvedValue(new Map([['tenant-1', 'Acme Ghana Ltd']]));

    const result = await service.getSummary();

    expect(result.expiringSubscriptions).toEqual([
      {
        tenantId: 'tenant-1',
        tenantName: 'Acme Ghana Ltd',
        currentPeriodEnd: soon,
        currency: 'GHS',
        amountDue: 200,
      },
    ]);
  });
});
