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
});
