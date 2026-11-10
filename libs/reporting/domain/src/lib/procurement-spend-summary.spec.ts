import { summarizeProcurementSpend } from './procurement-spend-summary';

describe('summarizeProcurementSpend', () => {
  it('returns an empty array for no entries', () => {
    expect(summarizeProcurementSpend([])).toEqual([]);
  });

  it('groups by vendor and calendar month, summing spend and counting orders', () => {
    const result = summarizeProcurementSpend([
      { vendorId: 'v1', vendorName: 'Acme', orderDate: new Date('2026-02-05'), lineTotal: 100 },
      { vendorId: 'v1', vendorName: 'Acme', orderDate: new Date('2026-02-20'), lineTotal: 50 },
      { vendorId: 'v1', vendorName: 'Acme', orderDate: new Date('2026-03-01'), lineTotal: 200 },
      { vendorId: 'v2', vendorName: 'Beta Ltd', orderDate: new Date('2026-02-10'), lineTotal: 75 },
    ]);

    expect(result).toEqual([
      { vendorId: 'v1', vendorName: 'Acme', month: '2026-02', totalSpend: 150, orderCount: 2 },
      { vendorId: 'v2', vendorName: 'Beta Ltd', month: '2026-02', totalSpend: 75, orderCount: 1 },
      { vendorId: 'v1', vendorName: 'Acme', month: '2026-03', totalSpend: 200, orderCount: 1 },
    ]);
  });
});
