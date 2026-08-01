import { Injectable } from '@nestjs/common';
import { PlatformBillingRepository } from '@africahr/billing-data-access';
import { calculateInvoiceAmount, isExpiringSoon, summarizeMonthlyRecurringRevenue } from '@africahr/billing-domain';

export interface RevenueByCurrency {
  currency: string;
  amount: number;
}

export interface ExpiringSubscription {
  tenantId: string;
  tenantName: string;
  currentPeriodEnd: Date;
  currency: string;
  amountDue: number;
}

export interface PlatformBillingSummary {
  mrr: RevenueByCurrency[];
  platformRevenue: RevenueByCurrency[];
  expiringSubscriptions: ExpiringSubscription[];
}

const EXPIRING_WINDOW_DAYS = 7;

/**
 * Platform-wide billing aggregates for the platform admin dashboard - MRR
 * and the expiring-subscriptions list are weighted by each tenant's
 * *current* active headcount (per-seat pricing), not whatever headcount
 * existed when the subscription was assigned.
 */
@Injectable()
export class PlatformBillingService {
  constructor(private readonly platformBilling: PlatformBillingRepository) {}

  async getSummary(): Promise<PlatformBillingSummary> {
    const [subscriptions, employeeCounts, revenue] = await Promise.all([
      this.platformBilling.listAllSubscriptions(),
      this.platformBilling.listActiveEmployeeCounts(),
      this.platformBilling.getRevenueByCurrency(),
    ]);

    const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === 'ACTIVE');

    const mrr = summarizeMonthlyRecurringRevenue(
      activeSubscriptions.map((subscription) => ({
        currency: subscription.currency,
        pricePerEmployee: subscription.pricePerEmployee,
        employeeCount: employeeCounts.get(subscription.tenantId) ?? 0,
      })),
    ).map((entry) => ({ currency: entry.currency, amount: entry.mrr }));

    const platformRevenue = revenue.map((entry) => ({
      currency: entry.currency,
      amount: entry.totalPaid,
    }));

    const now = new Date();
    const expiring = activeSubscriptions.filter((subscription) =>
      isExpiringSoon(subscription.currentPeriodEnd, now, EXPIRING_WINDOW_DAYS),
    );
    const tenantNames = await this.platformBilling.listTenantNames(
      expiring.map((subscription) => subscription.tenantId),
    );

    const expiringSubscriptions = expiring
      .map((subscription) => ({
        tenantId: subscription.tenantId,
        tenantName: tenantNames.get(subscription.tenantId) ?? subscription.tenantId,
        currentPeriodEnd: subscription.currentPeriodEnd,
        currency: subscription.currency,
        amountDue: calculateInvoiceAmount(
          subscription.pricePerEmployee,
          employeeCounts.get(subscription.tenantId) ?? 0,
        ),
      }))
      .sort((a, b) => a.currentPeriodEnd.getTime() - b.currentPeriodEnd.getTime());

    return { mrr, platformRevenue, expiringSubscriptions };
  }
}
