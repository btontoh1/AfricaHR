import { aggregateChargesByTenantMonth, summarizeMrrHistory } from './mrr-history';

describe('aggregateChargesByTenantMonth', () => {
  it('sums multiple invoices for the same tenant/month/currency', () => {
    const result = aggregateChargesByTenantMonth([
      { tenantId: 't1', currency: 'GHS', amount: 100, month: '2026-01' },
      { tenantId: 't1', currency: 'GHS', amount: 50, month: '2026-01' },
    ]);

    expect(result).toEqual([
      { tenantId: 't1', currency: 'GHS', amount: 150, month: '2026-01', invoiceCount: 2 },
    ]);
  });

  it('keeps different tenants/months/currencies separate', () => {
    const result = aggregateChargesByTenantMonth([
      { tenantId: 't1', currency: 'GHS', amount: 100, month: '2026-01' },
      { tenantId: 't2', currency: 'GHS', amount: 200, month: '2026-01' },
      { tenantId: 't1', currency: 'GHS', amount: 100, month: '2026-02' },
      { tenantId: 't1', currency: 'NGN', amount: 5000, month: '2026-01' },
    ]);

    expect(result).toHaveLength(4);
  });
});

describe('summarizeMrrHistory', () => {
  it('sums MRR per month/currency and counts distinct tenants', () => {
    const result = summarizeMrrHistory([
      { tenantId: 't1', currency: 'GHS', amount: 100, month: '2026-01' },
      { tenantId: 't2', currency: 'GHS', amount: 200, month: '2026-01' },
      { tenantId: 't1', currency: 'GHS', amount: 100, month: '2026-02' },
      { tenantId: 't1', currency: 'NGN', amount: 5000, month: '2026-01' },
    ]);

    expect(result).toEqual([
      { month: '2026-01', currency: 'GHS', mrr: 300, tenantCount: 2 },
      { month: '2026-01', currency: 'NGN', mrr: 5000, tenantCount: 1 },
      { month: '2026-02', currency: 'GHS', mrr: 100, tenantCount: 1 },
    ]);
  });

  it('returns an empty array with no charges', () => {
    expect(summarizeMrrHistory([])).toEqual([]);
  });

  it('sorts chronologically then alphabetically by currency', () => {
    const result = summarizeMrrHistory([
      { tenantId: 't1', currency: 'NGN', amount: 1, month: '2026-03' },
      { tenantId: 't1', currency: 'GHS', amount: 1, month: '2026-01' },
      { tenantId: 't1', currency: 'NGN', amount: 1, month: '2026-01' },
    ]);

    expect(result.map((point) => `${point.month}:${point.currency}`)).toEqual([
      '2026-01:GHS',
      '2026-01:NGN',
      '2026-03:NGN',
    ]);
  });
});
