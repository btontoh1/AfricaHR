import { allocateFefo, getBatchExpiryStatus, InsufficientBatchStockError } from './fefo-allocation';

const asOf = new Date('2026-06-01T00:00:00.000Z');

describe('allocateFefo', () => {
  it('draws entirely from the single available batch when it covers the request', () => {
    const batches = [{ batchId: 'b1', expiryDate: new Date('2026-12-01'), remainingQuantity: 100 }];

    expect(allocateFefo(batches, 40, asOf)).toEqual([{ batchId: 'b1', quantity: 40 }]);
  });

  it('prefers the earliest-expiring batch first, regardless of input order', () => {
    const batches = [
      { batchId: 'later', expiryDate: new Date('2027-01-01'), remainingQuantity: 100 },
      { batchId: 'sooner', expiryDate: new Date('2026-07-01'), remainingQuantity: 100 },
    ];

    expect(allocateFefo(batches, 30, asOf)).toEqual([{ batchId: 'sooner', quantity: 30 }]);
  });

  it('spills over into the next-soonest batch once the first is exhausted', () => {
    const batches = [
      { batchId: 'sooner', expiryDate: new Date('2026-07-01'), remainingQuantity: 20 },
      { batchId: 'later', expiryDate: new Date('2027-01-01'), remainingQuantity: 50 },
    ];

    expect(allocateFefo(batches, 35, asOf)).toEqual([
      { batchId: 'sooner', quantity: 20 },
      { batchId: 'later', quantity: 15 },
    ]);
  });

  it('skips already-expired batches entirely, even if they would otherwise cover the request', () => {
    const batches = [
      { batchId: 'expired', expiryDate: new Date('2026-01-01'), remainingQuantity: 100 },
      { batchId: 'valid', expiryDate: new Date('2026-12-01'), remainingQuantity: 10 },
    ];

    expect(allocateFefo(batches, 10, asOf)).toEqual([{ batchId: 'valid', quantity: 10 }]);
  });

  it('skips batches with zero remaining quantity', () => {
    const batches = [
      { batchId: 'empty', expiryDate: new Date('2026-07-01'), remainingQuantity: 0 },
      { batchId: 'valid', expiryDate: new Date('2026-12-01'), remainingQuantity: 10 },
    ];

    expect(allocateFefo(batches, 10, asOf)).toEqual([{ batchId: 'valid', quantity: 10 }]);
  });

  it('throws InsufficientBatchStockError reporting only non-expired quantity as available', () => {
    const batches = [
      { batchId: 'expired', expiryDate: new Date('2026-01-01'), remainingQuantity: 1000 },
      { batchId: 'valid', expiryDate: new Date('2026-12-01'), remainingQuantity: 10 },
    ];

    try {
      allocateFefo(batches, 15, asOf);
      throw new Error('expected allocateFefo to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(InsufficientBatchStockError);
      expect((error as InsufficientBatchStockError).available).toBe(10);
      expect((error as InsufficientBatchStockError).requested).toBe(15);
    }
  });

  it('returns an empty allocation for a zero-quantity request without touching any batch', () => {
    const batches = [{ batchId: 'b1', expiryDate: new Date('2026-12-01'), remainingQuantity: 10 }];

    expect(allocateFefo(batches, 0, asOf)).toEqual([]);
  });

  it('allocates across three batches in expiry order when the first two are not enough', () => {
    const batches = [
      { batchId: 'c', expiryDate: new Date('2026-09-01'), remainingQuantity: 5 },
      { batchId: 'a', expiryDate: new Date('2026-06-15'), remainingQuantity: 5 },
      { batchId: 'b', expiryDate: new Date('2026-07-15'), remainingQuantity: 5 },
    ];

    expect(allocateFefo(batches, 12, asOf)).toEqual([
      { batchId: 'a', quantity: 5 },
      { batchId: 'b', quantity: 5 },
      { batchId: 'c', quantity: 2 },
    ]);
  });
});

describe('getBatchExpiryStatus', () => {
  it('is EXPIRED once the expiry date is in the past relative to asOf', () => {
    expect(getBatchExpiryStatus(new Date('2026-05-01'), asOf)).toBe('EXPIRED');
  });

  it('is EXPIRING_SOON within the warning window', () => {
    expect(getBatchExpiryStatus(new Date('2026-06-15'), asOf, 30)).toBe('EXPIRING_SOON');
  });

  it('is OK beyond the warning window', () => {
    expect(getBatchExpiryStatus(new Date('2027-01-01'), asOf, 30)).toBe('OK');
  });

  it('treats the exact warning-window boundary as EXPIRING_SOON, not OK', () => {
    const boundary = new Date(asOf.getTime() + 30 * 24 * 60 * 60 * 1000);
    expect(getBatchExpiryStatus(boundary, asOf, 30)).toBe('EXPIRING_SOON');
  });
});
