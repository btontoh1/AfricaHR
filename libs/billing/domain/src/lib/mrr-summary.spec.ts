import { summarizeMonthlyRecurringRevenue } from './mrr-summary';

describe('summarizeMonthlyRecurringRevenue', () => {
  it('sums per-currency MRR across subscriptions', () => {
    const result = summarizeMonthlyRecurringRevenue([
      { currency: 'GHS', pricePerEmployee: 10, employeeCount: 20 },
      { currency: 'GHS', pricePerEmployee: 5, employeeCount: 10 },
      { currency: 'NGN', pricePerEmployee: 1000, employeeCount: 5 },
    ]);

    expect(result).toEqual([
      { currency: 'GHS', subscriptionCount: 2, mrr: 250 },
      { currency: 'NGN', subscriptionCount: 1, mrr: 5000 },
    ]);
  });

  it('returns an empty array when there are no active subscriptions', () => {
    expect(summarizeMonthlyRecurringRevenue([])).toEqual([]);
  });

  it('divides an ANNUAL subscription by 12 before summing into monthly MRR', () => {
    const result = summarizeMonthlyRecurringRevenue([
      { currency: 'GHS', pricePerEmployee: 0, employeeCount: 0, flatFeeAmount: 1200, billingInterval: 'ANNUAL' },
    ]);

    expect(result).toEqual([{ currency: 'GHS', subscriptionCount: 1, mrr: 100 }]);
  });

  it('sums a MONTHLY subscription as-is alongside an ANNUAL one', () => {
    const result = summarizeMonthlyRecurringRevenue([
      { currency: 'GHS', pricePerEmployee: 50, employeeCount: 1, billingInterval: 'MONTHLY' },
      { currency: 'GHS', pricePerEmployee: 0, employeeCount: 0, flatFeeAmount: 1200, billingInterval: 'ANNUAL' },
    ]);

    expect(result).toEqual([{ currency: 'GHS', subscriptionCount: 2, mrr: 150 }]);
  });
});
