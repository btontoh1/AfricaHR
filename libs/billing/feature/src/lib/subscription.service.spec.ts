import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, Subscription } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { BillingEmployeeCountRepository, SubscriptionRepository } from '@africahr/billing-data-access';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let subscriptions: jest.Mocked<SubscriptionRepository>;
  let employeeCounts: jest.Mocked<BillingEmployeeCountRepository>;
  let audit: jest.Mocked<AuditService>;

  const baseSubscription: Subscription = {
    id: 'sub-1',
    tenantId: 'tenant-1',
    pricePerEmployee: new Prisma.Decimal(10),
    currency: 'GHS',
    status: 'ACTIVE',
    currentPeriodStart: new Date('2026-08-01'),
    currentPeriodEnd: new Date('2026-09-01'),
    cancelAtPeriodEnd: false,
    paystackCustomerCode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(() => {
    subscriptions = {
      create: jest.fn(),
      findByTenant: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<SubscriptionRepository>;

    employeeCounts = { countActive: jest.fn() } as unknown as jest.Mocked<BillingEmployeeCountRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new SubscriptionService(subscriptions, employeeCounts, audit);
  });

  describe('assign', () => {
    it('creates a subscription and records an audit entry', async () => {
      subscriptions.findByTenant.mockResolvedValue(null);
      subscriptions.create.mockResolvedValue(baseSubscription);

      const result = await service.assign(
        'tenant-1',
        { pricePerEmployee: 10, currency: 'GHS' },
        'admin-1',
      );

      expect(result).toBe(baseSubscription);
      expect(subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', pricePerEmployee: 10, currency: 'GHS' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'billing.subscription.assigned' }),
      );
    });

    it('rejects assigning a second subscription to the same tenant', async () => {
      subscriptions.findByTenant.mockResolvedValue(baseSubscription);

      await expect(
        service.assign('tenant-1', { pricePerEmployee: 10, currency: 'GHS' }, 'admin-1'),
      ).rejects.toThrow(ConflictException);
      expect(subscriptions.create).not.toHaveBeenCalled();
    });
  });

  describe('getForTenant', () => {
    it('returns the subscription with usage and amount-due calculated from current headcount', async () => {
      subscriptions.findByTenant.mockResolvedValue(baseSubscription);
      employeeCounts.countActive.mockResolvedValue(20);

      const result = await service.getForTenant('tenant-1');

      expect(result.activeEmployeeCount).toBe(20);
      expect(result.currentAmountDue).toBe(200);
      expect(result.subscription).toBe(baseSubscription);
    });

    it('throws when the tenant has no subscription', async () => {
      subscriptions.findByTenant.mockResolvedValue(null);

      await expect(service.getForTenant('tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('marks the subscription cancelled and records an audit entry', async () => {
      subscriptions.findByTenant.mockResolvedValue(baseSubscription);
      subscriptions.update.mockResolvedValue({ ...baseSubscription, status: 'CANCELLED' });

      const result = await service.cancel('tenant-1', 'admin-1');

      expect(result.status).toBe('CANCELLED');
      expect(subscriptions.update).toHaveBeenCalledWith('tenant-1', 'sub-1', {
        status: 'CANCELLED',
        updatedBy: 'admin-1',
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'billing.subscription.cancelled' }),
      );
    });

    it('throws when the tenant has no subscription to cancel', async () => {
      subscriptions.findByTenant.mockResolvedValue(null);

      await expect(service.cancel('tenant-1')).rejects.toThrow(NotFoundException);
    });
  });
});
